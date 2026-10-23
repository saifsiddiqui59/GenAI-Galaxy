"""No-network P35 P2 regressions."""
from pathlib import Path
import subprocess
import unittest
class CoachTests(unittest.TestCase):
 def test_offline(self):
  subprocess.run(["node","tests/test_p35_p2.cjs"],cwd=Path(__file__).resolve().parents[1],check=True,timeout=15)
