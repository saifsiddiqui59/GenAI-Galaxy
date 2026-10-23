"""Offline security and billing-invariant tests for direct-consumption backend.

Tests make zero Azure/OpenAI/Supabase network calls and cannot provision cloud.
"""
import os
import pathlib
import sys
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "api"))
from consumption_security import (
    DIRECT, GATEWAY, GALAXY_SUPABASE_URL,
    QuotaExceeded, QuotaUnavailable,
    backend_profile, enforce_eval_quota,
)


class DirectConsumptionSecurityTests(unittest.TestCase):
    def test_no_default_unsafe_backend_mode(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(QuotaUnavailable):
                backend_profile()
        for mode in (DIRECT, GATEWAY):
            with patch.dict(os.environ, {"GALAXY_BACKEND_PROFILE": mode}, clear=True):
                self.assertEqual(backend_profile(), mode)
        with patch.dict(os.environ, {"GALAXY_BACKEND_PROFILE": "off"}, clear=True):
            with self.assertRaises(QuotaUnavailable):
                backend_profile()

    def test_routing_and_private_quota_jwt(self):
        seen = []
        def call(url, **kwargs):
            seen.append((url, kwargs))
            return True
        enforce_eval_quota(token="valid-jwt", base=GALAXY_SUPABASE_URL,
                           public_key="sb_publishable_example", request_json=call)
        self.assertEqual(len(seen), 1)
        self.assertEqual(seen[0][0], GALAXY_SUPABASE_URL + "/rest/v1/rpc/genai_study_reserve_evaluation")
        self.assertEqual(seen[0][1]["payload"], {})
        self.assertEqual(seen[0][1]["token"], "valid-jwt")
        self.assertEqual(seen[0][1]["extra_headers"], {"apikey": "sb_publishable_example"})

    def test_no_cross_project_quota_request(self):
        def no_network(*a, **k):
            raise AssertionError("Should fail before any network access")
        with self.assertRaises(QuotaUnavailable):
            enforce_eval_quota(token="jwt", base="https://another.supabase.co",
                               public_key="publishable", request_json=no_network)

    def test_failed_or_unrecognized_quota_blocks_model_calls(self):
        for response in (False, None, {"allowed": True}, "true", 1):
            with self.subTest(response=response):
                # identity check is intentional: bool True only; 1 must not pass
                error = QuotaExceeded if response is False else QuotaUnavailable
                with self.assertRaises(error):
                    enforce_eval_quota(token="jwt", base=GALAXY_SUPABASE_URL,
                                       public_key="publishable",
                                       request_json=lambda *a, **k: response)
        def network_failure(*a, **k):
            raise OSError("not available")
        with self.assertRaises(QuotaUnavailable):
            enforce_eval_quota(token="jwt", base=GALAXY_SUPABASE_URL,
                               public_key="publishable", request_json=network_failure)

    def test_direct_mode_is_restricted_to_paid_evaluator(self):
        src = (ROOT / "api/function_app.py").read_text()
        evaluation = src.split("def evaluate(", 1)[1].split("@app.route(route='vault/extract'",1)[0]
        self.assertIn("enforce_eval_quota(", evaluation)
        self.assertLess(evaluation.index("enforce_eval_quota("), evaluation.index("review,usage=model_review"))
        self.assertIn("except QuotaExceeded", evaluation)
        self.assertIn("429", evaluation)
        vault = src.split("def vault_extract(",1)[1].split("@app.route(route='speech/token'",1)[0]
        speech = src.split("def speech_token(",1)[1]
        self.assertIn("if backend_profile()==DIRECT:", vault)
        self.assertIn("Vault extraction is disabled", vault)
        self.assertIn("if backend_profile()==DIRECT:", speech)
        self.assertIn("Azure Speech tokens are disabled", speech)

    def test_sql_atomic_quotas_and_strict_auth(self):
        sql = (ROOT / "infra/azure/backend/galaxy_quota_REVIEW_ONLY.sql").read_text()
        self.assertIn("pg_advisory_xact_lock", sql)
        self.assertIn("auth.uid()", sql)
        self.assertIn(">= 5", sql)
        self.assertIn(">= 50", sql)
        self.assertIn("SECURITY DEFINER", sql)
        self.assertIn("REVOKE ALL ON FUNCTION", sql)
        self.assertIn("TO authenticated", sql)
        self.assertIn("ENABLE ROW LEVEL SECURITY", sql)
        self.assertNotIn("CREATE POLICY galaxy_allow_all", sql)
        self.assertNotIn("DROP TABLE", sql)


if __name__ == "__main__":
    unittest.main()
