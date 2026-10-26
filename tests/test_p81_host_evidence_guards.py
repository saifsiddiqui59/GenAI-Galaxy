"""P81 read-only host diagnostics guard. No Azure provider/model calls."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
FLOW=(ROOT/".github/workflows/galaxy-p81-host-evidence.yml").read_text()
BRIDGE=(ROOT/".github/workflows/galaxy-ai-owner-command.yml").read_text()
class P81Guards(unittest.TestCase):
    def test_manual_only_pinned_dev_resource(self):
        self.assertIn("workflow_dispatch:",FLOW)
        for event in ("  push:","  pull_request:","  schedule:","  issue_comment:"):
            self.assertNotIn(event,FLOW)
        self.assertIn("environment: dev",FLOW)
        self.assertIn("github.ref == 'refs/heads/main'",FLOW)
        self.assertIn("gengalaxy-p3-1429841605",FLOW)
        self.assertIn("GenAI_Galaxy",FLOW)
        self.assertIn("737d67b7-4984-48bb-bb1f-5f62599f645c",FLOW)
        self.assertIn("3a5e8018-40a4-49e3-bcba-a9af3344f50e",FLOW)
        self.assertIn('"DIAG_HOST_EVIDENCE_$EVENT_SHA"',BRIDGE)
        self.assertIn("galaxy-p81-host-evidence.yml",BRIDGE)
    def test_no_paid_monitoring_or_secret_diagnostics(self):
        self.assertIn("InstanceCount OnDemandFunctionExecutionCount",FLOW)
        self.assertIn("runtimeavailability sitecrashes",FLOW)
        self.assertIn("az rest --method get",FLOW)
        self.assertIn("abnormal_period_count",FLOW)
        self.assertIn("Never output raw descriptions",FLOW)
        for forbidden in ("az resource create", "az monitor app-insights component create",
                          "az functionapp create","az functionapp restart",
                          "az functionapp scale", "az functionapp config appsettings set",
                          "az functionapp config appsettings list",
                          "az functionapp keys", "AZURE_OPENAI_API_KEY",
                          "SUPABASE_SERVICE_ROLE","az rest --method post","Authorization: Bearer"):
            self.assertNotIn(forbidden,FLOW)
if __name__=="__main__":
    unittest.main()
