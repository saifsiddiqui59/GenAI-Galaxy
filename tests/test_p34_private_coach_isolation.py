"""Regression: never carry private coaching source text between accounts."""
from pathlib import Path
import unittest
CODE=(Path(__file__).resolve().parents[1]/"app.js").read_text()
class CoachIdentityIsolation(unittest.TestCase):
 def test_identity_transitions_purge_private_text(self):
  self.assertIn("function clearPrivateCoachState()",CODE)
  for snippet in ["state.coachResume='';","state.coachJob='';","state.coachPlan=null;","state.coachInsights=null;","state.sessionReport=null;"]:
   self.assertIn(snippet,CODE)
  self.assertIn("stopVoice();authEpoch++;clearPrivateCoachState();",CODE)
  self.assertIn("if(state.user?.id&&state.user.id!==userId){\n  clearPrivateCoachState();",CODE)
if __name__=="__main__":unittest.main()
