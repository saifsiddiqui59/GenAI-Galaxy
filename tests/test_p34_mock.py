"""P34 no-cost mock interview regression harness."""
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
class MockInterviewFlowTests(unittest.TestCase):
 def test_offline_five_question_flow_and_model_followup_handling(self):
  subprocess.run(['node','tests/test_p34_mock.cjs'],cwd=ROOT,check=True,timeout=15)
if __name__=='__main__': unittest.main()
