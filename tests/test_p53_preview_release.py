"""No-network guard tests for fixed existing-storage AI preview workflow."""
import pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
WF=ROOT/".github/workflows/galaxy-ai-preview-p53.yml"
class Guard(unittest.TestCase):
    def test_existing_only_and_manual_approval(self):
        s=WF.read_text()
        for expected in ("workflow_dispatch:","inputs.confirm == 'PREVIEW'",
                         "environment: dev","BACKEND_PIN: 0be3c0d8",
                         "gengalaxy1429841605","GenAI_Galaxy",
                         "git diff --name-only","galaxy-p3-flex-deploy.yml"):
            self.assertIn(expected,s)
        for forbidden in ("  push:","  pull_request:","  issue_comment:",
                          "galaxy-ephemeral-live-ai.yml",
                          "galaxy-p3-model-provision.yml"):
            self.assertNotIn(forbidden,s)
    def test_isolated_and_byte_verified_no_root_upload(self):
        s=WF.read_text()
        for expected in ("previews/galaxy-ai-p53",
                         '--name "$prefix/$file"',
                         'cmp -s "$tmp/stage/$file" "$tmp/verify/$file"',
                         '--name index.html --file "$tmp/root-after"',
                         "Production homepage changed",
                         "window.GALAXY_EVALUATOR_URL",
                         "features/speaking-metrics.js",
                         "features/saas-operations.js"):
            self.assertIn(expected,s)
        self.assertNotIn("--account-key",s)
        self.assertNotIn("az storage account create",s)
        self.assertNotIn("az functionapp create",s)
        self.assertNotIn("--destination '$web'",s)
    def test_frontend_imports_exist_in_preview_allowlist(self):
        import re
        html=(ROOT/"index.html").read_text()
        files=re.findall(r'<script[^>]+src="([^"]+)"',html)
        wf=WF.read_text()
        self.assertGreaterEqual(len(files),8)
        for file in files:
            if file.startswith("http"): continue
            self.assertIn(file,wf)
if __name__=="__main__":unittest.main()
