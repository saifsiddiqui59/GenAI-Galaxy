"""Fail-closed source guards for protected read-only Azure Function host probes."""
import pathlib
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
WF=(ROOT/".github/workflows/galaxy-ai-runtime-diagnostics.yml")
BR=(ROOT/".github/workflows/galaxy-ai-owner-command.yml")
class GalaxyRuntimeDiagnosticGuards(unittest.TestCase):
    def test_manual_only_scoped_oidc(self):
        code=WF.read_text()
        for required in ("workflow_dispatch:", "inputs.confirm == 'DIAGNOSE'",
                         "environment: dev","GenAI_Galaxy","gengalaxy-p3-1429841605",
                         "737d67b7-4984-48bb-bb1f-5f62599f645c",
                         "az functionapp function list","az functionapp show",
                         "--query '[].name'","--max-time 40"):
            self.assertIn(required,code)
        for forbidden in ("  push:","  pull_request:","  issue_comment:","az functionapp create",
                          "az functionapp config appsettings list",
                          "az cognitiveservices account keys list","galaxy-ephemeral-live-ai",
                          "--location-trusted","Authorization:","--account-key"):
            self.assertNotIn(forbidden,code)
        self.assertIn("without model credentials or quota",code)
    def test_owner_only_exact_source_bridge(self):
        code=BR.read_text()
        self.assertIn("DIAG_BACKEND_$EVENT_SHA",code)
        self.assertIn("galaxy-ai-runtime-diagnostics.yml",code)
        self.assertIn("github.event.comment.user.id == 80577424",code)
        self.assertIn("github.event.issue.number == 183",code)
        self.assertIn('[[ "$current" == "$EVENT_SHA" ]]',code)

if __name__=="__main__":
    unittest.main()
