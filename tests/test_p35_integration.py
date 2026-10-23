"""P35 integration and account-isolation contracts; no network, data writes or model spend."""
from pathlib import Path
import subprocess,unittest
ROOT=Path(__file__).resolve().parents[1]
JS=(ROOT/"app.js").read_text()
PAGE=(ROOT/"index.html").read_text()
class P35IntegrationTests(unittest.TestCase):
 def test_all_modules_present_and_loaded_in_public_page(self):
  for m in ("evaluation-evidence","milestones","private-study-plan"):
   self.assertIn('features/'+m+'.js',PAGE)
   self.assertTrue((ROOT/"features"/(m+".js")).exists())
  self.assertIn("GalaxyEvidencePolicy?.nextReview(",JS)
  self.assertIn("GalaxyMilestones?.summarize(",JS)
  self.assertNotIn("transcriptCoaching(state.answerDraft)",JS)
  self.assertNotIn("features/speaking-metrics.js",PAGE)
 def test_account_switch_purges_private_coach_material(self):
  self.assertIn("function clearPrivateCoachState()",JS)
  for x in ("state.coachResume='';","state.coachJob='';","state.coachPlan=null;",
            "state.coachInsights=null;","state.sessionReport=null;"):
   self.assertIn(x,JS)
  self.assertIn("stopVoice();authEpoch++;clearPrivateCoachState();",JS)
  self.assertIn("if(state.user?.id&&state.user.id!==userId){\n  clearPrivateCoachState();",JS)
 def test_offline_branches_still_pass(self):
  for test in ("test_p35_p1.cjs","test_p35_p2.cjs","test_p35_p3.cjs","test_p34_mock.cjs"):
   with self.subTest(test=test):
    subprocess.run(["node","tests/"+test],cwd=ROOT,check=True,timeout=15)
