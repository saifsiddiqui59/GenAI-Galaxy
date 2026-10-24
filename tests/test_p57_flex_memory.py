"""P57: existing Galaxy on-demand Flex 2048MB experiment stays isolated and reversible."""
import pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
W=(ROOT/".github/workflows/galaxy-p57-flex-memory.yml").read_text()
B=(ROOT/".github/workflows/galaxy-ai-owner-command.yml").read_text()
class FlexExistingOnlyTest(unittest.TestCase):
    def test_only_manual_existing_galaxy_flex(self):
        for part in ("workflow_dispatch:","environment: dev",
                     "inputs.confirm == 'SCALE_2048'","inputs.confirm == 'ROLLBACK_512'",
                     "gengalaxy-p3-1429841605","GenAI_Galaxy",
                     "737d67b7-4984-48bb-bb1f-5f62599f645c",
                     "instanceMemoryMB","maximumInstanceCount","alwaysReady",
                     "--instance-memory \"$target\" --maximum-instance-count 2"):
            self.assertIn(part,W)
        for forbidden in ("  push:","  issue_comment:","  pull_request:",
                          "az functionapp create", "az functionapp config appsettings set",
                          "az functionapp config appsettings list",
                          "az cognitiveservices account", "az role assignment create",
                          "galaxy-ephemeral-live-ai.yml", "--always-ready-instances"):
            self.assertNotIn(forbidden,W)
    def test_rollback_to_original_512_and_preexisting_2048(self):
        self.assertIn("target=2048",W)
        self.assertIn("target=512",W)
        self.assertIn("if mem not in (512,2048)",W)
        self.assertIn("Refusing: Always Ready instances configured",W)
        self.assertIn("Refusing: existing instance max differs from approved 2",W)
        for cmd in ("SCALE_FLEX_2048_$EVENT_SHA","ROLLBACK_FLEX_512_$EVENT_SHA"):
            self.assertIn(cmd,B)
        self.assertIn("github.event.comment.user.id == 80577424",B)
        self.assertIn("github.event.issue.number == 183",B)
if __name__=="__main__":unittest.main()
