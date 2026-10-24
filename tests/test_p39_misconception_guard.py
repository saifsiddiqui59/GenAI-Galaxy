"""Offline P39 golden negative controls: no paid model, no network."""
from pathlib import Path
import subprocess,unittest
ROOT=Path(__file__).resolve().parents[1]
class P39GoldenMisconceptionTests(unittest.TestCase):
 def test_negative_controls_and_ui_contract(self):
  subprocess.run(['node','tests/test_p39_misconception_guard.cjs'],cwd=ROOT,check=True,timeout=15)
if __name__=='__main__':unittest.main()
