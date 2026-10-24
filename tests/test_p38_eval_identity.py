"""P38: fail closed on evaluation responses received after logout/account switch."""
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
class EvaluationIdentityRace(unittest.TestCase):
 def test_async_identity_and_quota_safety(self):
  subprocess.run(['node','tests/test_p38_eval_identity.cjs'],cwd=ROOT,check=True,timeout=20)
if __name__=='__main__': unittest.main()
