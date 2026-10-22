"""Static guards for the explicit opt-in live Supabase RLS workflow."""
import importlib.util
import os
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("galaxy_rls_probe", ROOT / "tests/live_rls_check.py")
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class LiveRLSGuards(unittest.TestCase):
    def test_manual_only_and_galaxy_target(self):
        wf = (ROOT / ".github/workflows/galaxy-live-rls.yml").read_text()
        self.assertIn("workflow_dispatch:", wf)
        self.assertNotIn("pull_request:", wf)
        self.assertNotIn("  push:", wf)
        self.assertIn("inputs.confirm == 'TEST'", wf)
        self.assertIn("environment: dev", wf)
        self.assertIn("github.ref == 'refs/heads/main'", wf)
        self.assertIn("github.repository == 'saifsiddiqui59/GenAI-Galaxy'", wf)
        self.assertIn("https://vfoghlhtnifpnbevgufa.supabase.co", wf)
        self.assertNotIn("azure/login", wf)
        self.assertNotIn("id-token: write", wf)
        self.assertNotIn("service_role", wf)
        self.assertNotIn("az storage", wf)

    def test_no_secrets_cannot_run_or_touch_network(self):
        with patch.dict(os.environ, {}, clear=True):
            with patch.object(probe, "sign_in", side_effect=AssertionError("unexpected network")):
                with self.assertRaisesRegex(probe.CheckFailed, "Missing required"):
                    probe.run()

    def test_wrong_project_blocked_before_signin(self):
        env = {name: "dummy" for name in (
            "GALAXY_SUPABASE_PUBLISHABLE_KEY", "GALAXY_TEST_A_EMAIL", "GALAXY_TEST_A_PASSWORD",
            "GALAXY_TEST_B_EMAIL", "GALAXY_TEST_B_PASSWORD"
        )}
        env["GALAXY_SUPABASE_URL"] = "https://wrong.supabase.co"
        with patch.dict(os.environ, env, clear=True):
            with patch.object(probe, "sign_in", side_effect=AssertionError("unexpected network")):
                with self.assertRaisesRegex(probe.CheckFailed, "different Supabase project"):
                    probe.run()

    def test_galaxy_table_allowlist(self):
        self.assertEqual(probe.BUCKET, "genai-study-docs")
        self.assertEqual(probe.URL, "https://vfoghlhtnifpnbevgufa.supabase.co")
        with self.assertRaisesRegex(probe.CheckFailed, "Not a Galaxy allowlisted"):
            probe.rest("GET", "profiles", "not-a-key", "not-a-jwt")


if __name__ == "__main__":
    unittest.main()
