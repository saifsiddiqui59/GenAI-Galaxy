"""P79 single-instance routing experiment guard tests; no cloud calls."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
PATH=ROOT/".github/workflows/galaxy-p79-one-instance-test.yml"
BRIDGE=ROOT/".github/workflows/galaxy-ai-owner-command.yml"
SRC=PATH.read_text()
OWNER=BRIDGE.read_text()
class P79OneInstanceSafety(unittest.TestCase):
    def test_manual_dev_only_and_exact_target(self):
        self.assertIn("workflow_dispatch:",SRC)
        self.assertNotIn("  push:",SRC)
        self.assertNotIn("  pull_request:",SRC)
        self.assertIn("environment: dev",SRC)
        self.assertIn("gengalaxy-p3-1429841605",SRC)
        self.assertIn("GenAI_Galaxy",SRC)
        self.assertIn("737d67b7-4984-48bb-bb1f-5f62599f645c",SRC)
        self.assertIn("3a5e8018-40a4-49e3-bcba-a9af3344f50e",SRC)
        self.assertIn("DIAG_SINGLE_INSTANCE_$EVENT_SHA",OWNER)
        self.assertIn("galaxy-p79-one-instance-test.yml",OWNER)
    def test_cost_no_model_and_reversible_reset(self):
        self.assertIn("maximumInstanceCount",SRC)
        self.assertIn("--maximum-instance-count 1",SRC)
        self.assertGreaterEqual(SRC.count("--maximum-instance-count 2"),2)
        self.assertIn("trap restore EXIT TERM INT",SRC)
        self.assertIn("if: always()",SRC)
        self.assertIn("512",SRC)
        self.assertIn("alwaysReady",SRC)
        self.assertIn("/api/health",SRC)
        self.assertIn("practice/evaluate practice/tutor practice/evaluate",SRC)
        self.assertIn("model-free HTTP probes only",SRC)
        self.assertIn("no streaming deployment is authorized",SRC)
        for forbidden in ("az resource create", "az functionapp create", "AZURE_OPENAI_API_KEY",
                          "SUPABASE_SERVICE_ROLE", "api-key:", "Authorization: Bearer",
                          "AZURE_OPENAI_DEPLOYMENT", "alwaysReady 1"):
            self.assertNotIn(forbidden,SRC)
if __name__=="__main__":
    unittest.main()
