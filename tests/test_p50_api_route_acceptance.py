"""P50 zero-network end-to-end checks of actual Azure Function routes.

Synthetic JWT/user/model stand-ins only. These checks do not consume model
tokens, deploy Azure code, or establish real cloud auth or grading accuracy.
"""
from __future__ import annotations

import json
import pathlib
import sys
import types
import unittest
from unittest.mock import Mock, patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "api"))

# Azure Functions host is deliberately NOT installed by the free PR CI. Provide
# only the route/response surface so real handler code can execute without Azure.
if "azure.functions" not in sys.modules:
    azure = types.ModuleType("azure")
    azure.__path__ = []
    funcs = types.ModuleType("azure.functions")

    class HttpRequest:
        def __init__(self, payload=None, headers=None, method="POST"):
            self._payload = payload
            self.headers = headers or {}
            self.method = method

        def get_json(self):
            return self._payload

    class HttpResponse:
        def __init__(self, body, *, status_code=200, mimetype=None, headers=None):
            self.status_code = status_code
            self.headers = headers or {}
            self.body = body

        def get_body(self):
            return self.body.encode("utf-8")

    class FunctionApp:
        def __init__(self, *, http_auth_level):
            self.http_auth_level = http_auth_level

        def route(self, **kwargs):
            return lambda handler: handler

    funcs.HttpRequest = HttpRequest
    funcs.HttpResponse = HttpResponse
    funcs.FunctionApp = FunctionApp
    funcs.AuthLevel = types.SimpleNamespace(ANONYMOUS="anonymous")
    azure.functions = funcs
    sys.modules["azure"] = azure
    sys.modules["azure.functions"] = funcs

import function_app as api
from consumption_security import QuotaExceeded, QuotaUnavailable

TOPIC = next(iter(api.rubric_catalog()))
IDENTITY = ("synthetic-jwt-only", "00000000-0000-4000-8000-000000000001",
            "https://vfoghlhtnifpnbevgufa.supabase.co", "synthetic-anon-key")
QUESTION = api.rubric_catalog()[TOPIC]["question"]


def request(payload, headers=None, method="POST"):
    return api.func.HttpRequest(payload, headers=headers, method=method)


def payload(response):
    return json.loads(response.get_body())


class NoChargeRouteAcceptance(unittest.TestCase):
    def setUp(self):
        self.settings = patch.dict(api.os.environ, {
            "GALAXY_BACKEND_PROFILE": "direct-consumption",
            "GALAXY_PRICE_SOURCE": "",
            "GALAXY_ALLOWED_ORIGIN": "https://galaxy.example.com",
        })
        self.settings.start()
        self.addCleanup(self.settings.stop)
        # All outbound network calls in these tests are forbidden. The route
        # must use explicitly injected, synthetic JWT and provider doubles.
        self.network = patch.object(api, "request_json",
                                    side_effect=AssertionError("Unexpected network request"))
        self.network.start()
        self.addCleanup(self.network.stop)
        # P82: only this no-network route contract simulates a future
        # approved PRO launch; production release and DB gates stay OFF.
        self.pro = patch.object(api, 'enforce_pro_access')
        self.pro.start()
        self.addCleanup(self.pro.stop)

    def test_missing_bearer_fails_before_any_model_or_quota(self):
        with patch.object(api, "enforce_eval_quota") as reserve, \
             patch.object(api, "model_review") as model:
            response = api.evaluate(request({
                "topic_key": TOPIC, "question": QUESTION,
                "response": "My answer has enough characters."
            }))
        self.assertEqual(response.status_code, 401)
        self.assertNotIn("accuracy", payload(response))
        reserve.assert_not_called()
        model.assert_not_called()

    def test_invalid_question_or_topic_never_reserves_quota(self):
        with patch.object(api, "authenticate", return_value=IDENTITY), \
             patch.object(api, "enforce_eval_quota") as reserve, \
             patch.object(api, "model_review") as model:
            for body in (
                {"topic_key": "unauthorized", "question": QUESTION,
                 "response": "A complete interview answer."},
                {"topic_key": TOPIC, "question": "", "response": "A complete answer."},
                {"topic_key": TOPIC, "question": QUESTION, "response": "short"}
            ):
                self.assertEqual(api.evaluate(request(body)).status_code, 400)
        reserve.assert_not_called()
        model.assert_not_called()

    def test_quota_denied_429_does_not_call_model(self):
        with patch.object(api, "authenticate", return_value=IDENTITY), \
             patch.object(api, "enforce_eval_quota",
                          side_effect=QuotaExceeded("limit")) as reserve, \
             patch.object(api, "model_review") as model:
            response = api.evaluate(request({
                "topic_key": TOPIC, "question": QUESTION,
                "response": "An adequately long candidate answer."
            }))
        self.assertEqual(response.status_code, 429)
        self.assertNotIn("accuracy", payload(response))
        reserve.assert_called_once()
        model.assert_not_called()

    def test_quota_service_unavailable_fails_closed(self):
        with patch.object(api, "authenticate", return_value=IDENTITY), \
             patch.object(api, "enforce_eval_quota",
                          side_effect=QuotaUnavailable("not verified")), \
             patch.object(api, "model_review") as model:
            response = api.evaluate(request({
                "topic_key": TOPIC, "question": QUESTION,
                "response": "An adequately long candidate answer."
            }))
        self.assertEqual(response.status_code, 503)
        model.assert_not_called()

    def test_one_quota_one_model_call_then_model_provenance(self):
        review = {
            "review_status": "model_reviewed", "accuracy": 78, "clarity": 75,
            "score_provenance": "weighted_model_assessment_not_independent_verification",
        }
        usage = {"input_tokens": 100, "output_tokens": 30, "total_tokens": 130}
        with patch.object(api, "authenticate", return_value=IDENTITY), \
             patch.object(api, "enforce_eval_quota") as reserve, \
             patch.object(api, "model_review", return_value=(review.copy(), usage)) as model:
            response = api.evaluate(request({
                "topic_key": TOPIC, "question": QUESTION,
                "response": "Embeddings encode semantic meaning for similarity retrieval."
            }))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload(response)["token_usage"], usage)
        self.assertNotIn("estimated_model_cost", payload(response))
        self.assertEqual(payload(response)["score_provenance"], review["score_provenance"])
        self.assertIn("X-Galaxy-Trace-Id", response.headers)
        self.assertNotIn(IDENTITY[0], response.body)
        reserve.assert_called_once()
        model.assert_called_once()

    def test_provider_failure_never_returns_a_fabricated_score(self):
        with patch.object(api, "authenticate", return_value=IDENTITY), \
             patch.object(api, "enforce_eval_quota") as reserve, \
             patch.object(api, "model_review",
                          side_effect=api.UpstreamError("model failed")):
            response = api.evaluate(request({
                "topic_key": TOPIC, "question": QUESTION,
                "response": "This answer is sufficiently long to be graded."
            }))
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("accuracy", payload(response))
        reserve.assert_called_once()

    def test_free_tutor_reference_and_quiz_do_not_reserve_or_call_model(self):
        with patch.object(api, "authenticate", return_value=IDENTITY), \
             patch.object(api, "enforce_eval_quota") as reserve, \
             patch.object(api, "tutor_model_response") as paid:
            for mode in ("reference", "quiz"):
                response = api.tutor(request({"topic_key": TOPIC, "mode": mode,
                                              "message": ""}))
                data = payload(response)
                self.assertEqual(response.status_code, 200)
                self.assertTrue(data["reference_only"])
                self.assertFalse(data["model_called"])
                self.assertEqual(data["token_usage"], {})
            reserve.assert_not_called()
            paid.assert_not_called()

    def test_paid_tutor_reserves_once_and_invokes_one_model_node(self):
        usage = {"input_tokens": 100, "output_tokens": 30, "total_tokens": 130}
        with patch.object(api, "authenticate", return_value=IDENTITY), \
             patch.object(api, "enforce_eval_quota") as reserve, \
             patch.object(api, "tutor_model_response", return_value={
                 "reply": "Embeddings turn passages into vectors for similarity search.",
                 "next_question": "How do you use cosine similarity?",
                 "usage": usage,
             }) as paid:
            response = api.tutor(request({"topic_key": TOPIC, "mode": "explain",
                                          "message": "Explain the difference please."}))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(payload(response)["model_called"])
        self.assertEqual(payload(response)["token_usage"], usage)
        reserve.assert_called_once()
        paid.assert_called_once()

    def test_tutor_quota_denial_and_model_failure_are_not_answers(self):
        with patch.object(api, "authenticate", return_value=IDENTITY), \
             patch.object(api, "enforce_eval_quota",
                          side_effect=QuotaExceeded("limit")), \
             patch.object(api, "tutor_model_response") as model:
            response = api.tutor(request({"topic_key": TOPIC, "mode": "explain",
                                          "message": "Explain this subject"}))
        self.assertEqual(response.status_code, 429)
        model.assert_not_called()
        with patch.object(api, "authenticate", return_value=IDENTITY), \
             patch.object(api, "enforce_eval_quota") as reserve, \
             patch.object(api, "tutor_model_response",
                          side_effect=api.UpstreamError("unavailable")):
            response = api.tutor(request({"topic_key": TOPIC, "mode": "followup",
                                          "message": "Ask a harder question"}))
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("reply", payload(response))
        reserve.assert_called_once()

    def test_cors_only_allows_configured_site(self):
        good = api.evaluate(request(None, {"Origin": "https://galaxy.example.com"},
                                    method="OPTIONS"))
        bad = api.evaluate(request(None, {"Origin": "https://another.example.org"},
                                   method="OPTIONS"))
        self.assertEqual(good.status_code, 200)
        self.assertEqual(bad.status_code, 403)
        self.assertEqual(good.headers["Access-Control-Allow-Origin"],
                         "https://galaxy.example.com")
        self.assertNotIn("Access-Control-Allow-Origin", bad.headers)


if __name__ == "__main__":
    unittest.main()
