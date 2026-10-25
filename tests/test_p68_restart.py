"""P68: restart is one-time, existing Galaxy-only, never changes idle costs."""
import pathlib
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class RestartContract(unittest.TestCase):
 def test_exactly_one_restart_after_app_identity_and_scale_guards(self):
  txt=(ROOT/'.github/workflows/galaxy-p68-one-time-restart.yml').read_text()
  self.assertEqual(txt.count('az functionapp restart -g "$RG" -n "$APP" -o none'),1)
  self.assertLess(txt.index("instanceMemoryMB"),txt.index("az functionapp restart -g"))
  self.assertIn("cfg.get('instanceMemoryMB') == 512",txt)
  self.assertIn("cfg.get('maximumInstanceCount') == 2",txt)
  self.assertIn("cfg.get('alwaysReady') in (None,[])",txt)
  self.assertIn("gengalaxy-p3-1429841605",txt)
  self.assertIn("GenAI_Galaxy",txt)
  self.assertIn("environment: dev",txt)
  self.assertIn("--confirm LONG_READONLY",txt)
  self.assertIn("RESTART_EXISTING_ONCE",txt)
  self.assertIn("workflow_dispatch:",txt)
  for blocked in ("  push:","  pull_request:","  schedule:","az functionapp create",
    "az functionapp scale config","az monitor log-analytics workspace create",
    "az functionapp config appsettings set","--always-ready","--instance-memory 2048",
    "api-key","GALAXY_OPENAI_KEY"):
   self.assertNotIn(blocked,txt)
 def test_owner_command_is_explicit_and_single(self):
  text=(ROOT/'.github/workflows/galaxy-ai-owner-command.yml').read_text()
  self.assertIn('"RESTART_ONCE_$EVENT_SHA"',text)
  self.assertIn('galaxy-p68-one-time-restart.yml',text)
  self.assertEqual(text.count('gh workflow run galaxy-p68-one-time-restart.yml'),1)
if __name__=='__main__':unittest.main()
