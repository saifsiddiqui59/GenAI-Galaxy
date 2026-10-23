"""Zero-additional-cost Galaxy QA: no cloud calls, payments, fine tuning, or LLM usage."""
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tests"))
from public_asset_policy import APPROVED_EVALUATOR, EVAL_DEFAULT, EVAL_APPROVED, verify_public_asset


class ZeroCostAcceptanceTests(unittest.TestCase):
    def test_exact_approved_runtime_injection_is_only_allowed_difference(self):
        original = (ROOT / "runtime-config.js").read_bytes()
        self.assertEqual(original.decode().count(EVAL_DEFAULT), 1)
        deployed = original.replace(EVAL_DEFAULT.encode(), EVAL_APPROVED.encode())
        verify_public_asset("runtime-config.js", deployed, original)
        with self.assertRaises(AssertionError):
            verify_public_asset("runtime-config.js", original, original)
        with self.assertRaises(AssertionError):
            verify_public_asset("runtime-config.js", deployed.replace(
                APPROVED_EVALUATOR.encode(), b"https://other.example/api"), original)
        with self.assertRaises(AssertionError):
            verify_public_asset("runtime-config.js", deployed.replace(
                b"window.GALAXY_SPEECH_BROKER_URL='';",
                b"window.GALAXY_SPEECH_BROKER_URL='https://example.com';"), original)
        with self.assertRaises(AssertionError):
            verify_public_asset("runtime-config.js", deployed + b"\n// injected\n", original)

    def test_static_assets_must_match_byte_for_byte(self):
        original = (ROOT / "app.js").read_bytes()
        verify_public_asset("app.js", original, original)
        with self.assertRaises(AssertionError):
            verify_public_asset("app.js", original + b"// modified", original)

    def test_no_payment_gateway_in_current_public_app_or_database(self):
        paths = ("app.js", "index.html", "runtime-config.js",
                 "infra/azure/backend/galaxy_subscription_entitlements_REVIEW_ONLY.sql")
        for path in paths:
            content = (ROOT / path).read_text().lower()
            with self.subTest(path=path):
                for keyword in ("razorpay", "stripe", "paypal", "cashfree",
                                "checkout.sessions", "payment_intent", "billingportal"):
                    self.assertNotIn(keyword, content)
        sql = (ROOT / paths[-1]).read_text()
        self.assertIn("price_inr_monthly", sql)
        self.assertIn("genai_study_user_subscriptions", sql)
        # Users cannot grant themselves paid entitlements.
        self.assertNotIn("GRANT INSERT ON public.genai_study_user_subscriptions TO authenticated",sql)

    def test_github_ci_has_zero_ai_and_no_live_cloud_deploy(self):
        workflow = (ROOT / ".github/workflows/galaxy-ci.yml").read_text()
        for forbidden in ("azure/login", "GALAXY_RUN_AI_SMOKE",
                          "az cognitiveservices account create",
                          "gh workflow run", "GALAXY_SUPABASE_ADMIN_KEY",
                          "GALAXY_AZURE_OPENAI_API_KEY",
                          "openai.azure.com", "fine_tuning"):
            self.assertNotIn(forbidden, workflow)
        self.assertIn("python -m unittest discover -s tests -v", workflow)
        self.assertIn("node tests/test_engine.cjs", workflow)

    def test_read_only_browser_workflow_does_not_call_model(self):
        wf = (ROOT / ".github/workflows/galaxy-live-browser.yml").read_text()
        self.assertIn("workflow_dispatch:", wf)
        self.assertNotIn("  push:", wf)
        self.assertNotIn("secrets.", wf)
        self.assertNotIn("GALAXY_RUN_AI_SMOKE", wf)
        guest = (ROOT / "tests/live_site_browser_check.py").read_text()
        self.assertIn("verify_public_asset", guest)
        self.assertNotIn("signInWithPassword", guest)
        self.assertNotIn("fetch(APPROVED_EVALUATOR", guest)

    def test_golden_contract_has_offline_coverage_not_fake_quality(self):
        cases = [json.loads(x) for x in
                 (ROOT / "docs/ai/evaluation/golden-galaxy-v1.jsonl").read_text().splitlines()
                 if x.strip()]
        rubrics = json.loads((ROOT / "api/rubrics.json").read_text())
        self.assertEqual(len(cases), 10)
        self.assertEqual(len(set(c["id"] for c in cases)), 10)
        self.assertTrue(all(c["topic_key"] in rubrics for c in cases))
        gate = (ROOT / "scripts/gate_galaxy_eval.py").read_text()
        self.assertIn('independent_judge_call', gate)
        self.assertIn("independent evaluator provenance missing", gate)
        self.assertIn("evidence unavailable/invalid", gate)


if __name__ == "__main__":
    unittest.main()
