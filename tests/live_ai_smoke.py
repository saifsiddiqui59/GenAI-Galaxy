"""At most two billable AI calls with one disposable confirmed Supabase user.

Called ONLY from the protected manual DEV GitHub Action when opted in.
Never prints bearer tokens, credentials, raw prompts or model content.
"""
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from live_rls_check import sign_in, URL, CheckFailed

EXPECTED_URL = "https://gengalaxy-p3-1429841605.azurewebsites.net/api/practice/evaluate"


def run_ai_smoke(publishable, email, password):
    target = os.environ.get("GALAXY_LIVE_AI_URL", EXPECTED_URL)
    if target != EXPECTED_URL:
        raise CheckFailed("Refusing to test any other AI endpoint")
    _user_id, jwt = sign_in(email, password, publishable)
    rubrics = json.loads((Path(__file__).parents[1] / "api/rubrics.json").read_text())
    topic = "GenAI Evaluation & Quality Gates / Metric interpretation / Groundedness"
    if topic not in rubrics:
        raise CheckFailed("Galaxy golden topic not found")

    body = json.dumps({
        "topic_key": topic,
        "question": "How do you measure groundedness of generated answers?",
        "response": "I compare each factual claim with its authorized retrieved evidence and test whether the source supports that claim. I evaluate unsupported assertions and use a reviewed golden dataset, not citation count alone."
    }).encode("utf-8")
    def issue(bearer):
        req = Request(target, data=body, method="POST",
                      headers={"Authorization": "Bearer " + bearer,
                               "Content-Type": "application/json",
                               "Origin": "https://gengalaxy1429841605.z29.web.core.windows.net"})
        try:
            with urlopen(req, timeout=75) as res:
                raw = res.read(100_000)
                return res.status, res.headers, raw
        except HTTPError as exc:
            return exc.code, exc.headers, exc.read(100_000)
        except URLError:
            raise CheckFailed("Galaxy AI backend network error") from None

    denied, _, _ = issue("invalid-test-token")
    if denied in (200, 201):
        raise CheckFailed("CRITICAL: invalid bearer token authorized paid evaluator")
    if denied not in (400, 401, 403):
        raise CheckFailed("Expected 4xx denial for invalid JWT (got HTTP " + str(denied) + ")")
    status, headers, payload = issue(jwt)
    if status != 200:
        raise CheckFailed("Authenticated AI evaluator failed: HTTP " + str(status))
    try:
        obj = json.loads(payload)
        if obj.get("review_status") != "model_reviewed" or type(obj.get("accuracy")) not in (int,float) or not 0 <= obj["accuracy"] <= 100:
            raise ValueError("Missing valid reviewed scores")
        trace = headers.get("X-Galaxy-Trace-Id", "")
        import uuid
        uuid.UUID(trace)
    except (ValueError, TypeError, KeyError, AttributeError):
        raise CheckFailed("AI evaluator response or safe trace header invalid") from None
    # One additional, explicit real tutor call; no retries. This is a smoke
    # quality contract, NOT independent human/expert accuracy certification.
    review_feedback = obj.get("feedback")
    improved = obj.get("improved_answer")
    if not isinstance(review_feedback, str) or len(review_feedback.strip()) < 12:
        raise CheckFailed("Evaluator feedback is too short for interview use")
    if not isinstance(improved, str) or len(improved.strip()) < 25:
        raise CheckFailed("Evaluator improved answer is missing/too short")
    print("LIVE EVALUATOR: schema, trace, substantive feedback and improved-answer length PASS; expert correctness NOT certified.")
    tutor_target = "https://gengalaxy-p3-1429841605.azurewebsites.net/api/practice/tutor"
    tutor_payload = json.dumps({
        "topic_key": topic, "mode": "explain", "history": [],
        "message": "Explain groundedness versus answer relevance in a technical interview, with one concrete example."
    }).encode("utf-8")
    tutor_req = Request(tutor_target, data=tutor_payload, method="POST",
                        headers={"Authorization":"Bearer "+jwt,"Content-Type":"application/json",
                                 "Origin":"https://gengalaxy1429841605.z29.web.core.windows.net"})
    try:
        with urlopen(tutor_req, timeout=75) as tutor_res:
            tutor_status=tutor_res.status
            tutor_payload=tutor_res.read(100_000)
    except HTTPError as exc:
        raise CheckFailed("Authenticated tutor failed: HTTP "+str(exc.code)) from None
    except (URLError, TimeoutError):
        raise CheckFailed("Authenticated tutor network timeout or failure; do not auto-retry paid request") from None
    if tutor_status!=200:
        raise CheckFailed("Authenticated tutor returned unexpected status")
    try:
        tutor=json.loads(tutor_payload)
    except (ValueError, TypeError):
        raise CheckFailed("Authenticated tutor returned invalid JSON") from None
    reply=tutor.get("reply")
    nxt=tutor.get("next_question")
    if (tutor.get("tutor_status")!="model_tutored" or
        tutor.get("model_called") is not True or
        not isinstance(reply,str) or len(reply.strip())<80 or
        not isinstance(nxt,str) or len(nxt.strip())<12 or
        not any(term in reply.lower() for term in ("ground", "evidence", "relevan"))):
        raise CheckFailed("Tutor structured explanation does not meet minimal groundedness/relevance smoke contract")
    print("LIVE TUTOR: exactly one request, model-used flag, substantive topic-related explanation and follow-up PASS; expert accuracy NOT certified.")
    print("LIVE GALAXY AI SMOKE PASSED: invalid token denied; one evaluator and one tutor model call; no paid retries.")

