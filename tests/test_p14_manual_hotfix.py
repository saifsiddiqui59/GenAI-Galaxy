"""Safety contract for the isolated, manual-only P14 public app.js hotfix."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class P14ManualHotfixTests(unittest.TestCase):
    def test_only_pinned_public_js_can_be_updated(self):
        workflow = (ROOT / ".github/workflows/galaxy-p14-hotfix-app-only.yml").read_text()
        self.assertIn("workflow_dispatch:", workflow)
        self.assertNotIn("\n  push:", workflow)
        self.assertNotIn("\n  pull_request:", workflow)
        self.assertIn("PUBLISH_P14_APP_ONLY", workflow)
        self.assertIn("environment: dev", workflow)
        self.assertIn("737d67b7-4984-48bb-bb1f-5f62599f645c", workflow)
        self.assertIn("gengalaxy1429841605", workflow)
        self.assertIn("GenAI_Galaxy", workflow)
        self.assertIn("f93af599bdbb1409742323f06a5a9307bfe9ec7b", workflow)
        self.assertIn("bcfbbfcf638b2844d14703cff69306593223ea4e", workflow)
        self.assertIn("04f1e03ee347d51d88f6bf942a3b8921d02e5c65", workflow)
        self.assertIn("git hash-object \"$tmp/current.js\"", workflow)
        self.assertIn("git hash-object \"$tmp/after.js\"", workflow)
        self.assertIn("--name app.js", workflow)
        self.assertIn("--overwrite true", workflow)
        self.assertIn("no-cache, max-age=0", workflow)
        self.assertIn("python tests/p14_live_guest_smoke.py", workflow)
        for forbidden in (
            "az cognitiveservices account create",
            "az functionapp create",
            "az storage account create",
            "az storage blob upload-batch",
            "gh workflow run",
            "supabase db push",
            "az role assignment create",
            "secrets.GALAXY_AZURE_OPENAI_API_KEY",
        ):
            self.assertNotIn(forbidden, workflow)

    def test_post_deploy_browser_test_blocks_model_requests(self):
        browser = (ROOT / "tests/p14_live_guest_smoke.py").read_text()
        self.assertIn("page.route(\"**/api/practice/evaluate*\"", browser)
        self.assertIn("await route.abort()", browser)
        self.assertIn("blocked_paid_calls", browser)
        self.assertIn("LOCAL CONCEPT CHECK", browser)
        self.assertIn("Why this is a local check", browser)


if __name__ == "__main__":
    unittest.main()
