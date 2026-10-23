"""Local, zero-token study-plan regression."""
import unittest, subprocess
from pathlib import Path
class PersonalizedPlanTests(unittest.TestCase):
 def test_client_planner(self):
  subprocess.run(['node','tests/test_p36_personalization.cjs'],cwd=Path(__file__).resolve().parents[1],check=True,timeout=15)
