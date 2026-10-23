"""No-cloud safety test for isolated manual Genie preview upload."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
WORKFLOW=ROOT/".github/workflows/galaxy-genie-storage-preview.yml"
DEMO=ROOT/"scripts/genie-preview-demo.js"

class GenieStoragePreviewTests(unittest.TestCase):
    def test_manual_main_protected_only(self):
        w=WORKFLOW.read_text()
        self.assertIn("workflow_dispatch:",w)
        self.assertNotIn("pull_request:",w)
        self.assertNotIn("  push:",w)
        self.assertIn("github.ref == 'refs/heads/main'",w)
        self.assertIn("inputs.confirm_preview == 'DEPLOY_PREVIEW'",w)
        self.assertIn("environment: dev",w)
        self.assertIn("id-token: write",w)
        self.assertIn("ref: 0ca9cc809b86cec07a2a640ffc01a2df39953b89",w)
    def test_staged_preview_only(self):
        w=WORKFLOW.read_text()
        self.assertIn("PREFIX: previews/genie-0ca9cc80",w)
        self.assertIn('--destination-path "$PREFIX"',w)
        self.assertIn("--destination '$web'",w)
        self.assertIn('--auth-mode login',w)
        self.assertIn('storageAccounts/gengalaxy1429841605',w)
        self.assertIn('sha256sum',w)
        for forbidden in ('az group create','az storage account create',
                          'az storage blob delete','az storage blob sync',
                          '--delete-destination', '--auth-mode key'):
            self.assertNotIn(forbidden,w)
    def test_synthetic_demo_opt_in_only(self):
        d=DEMO.read_text()
        self.assertIn("get('demo')!=='genie'",d)
        self.assertIn("synthetic planet progress",d)
        self.assertIn("GalaxyGenieGuide.show",d)
        self.assertIn("GalaxyPlanetHandoff.run",d)
        for unsafe in ("fetch(", "service_role", "supabase.from(",
                       "localStorage.setItem(", "api/practice/evaluate"):
            self.assertNotIn(unsafe,d)

if __name__=="__main__":
    unittest.main()
