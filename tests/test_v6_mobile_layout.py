"""Guard the compact V6 HUD against tiny, overlapping mobile actions."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class V6MobileLayoutContracts(unittest.TestCase):
 def test_compact_actions_remain_readable(self):
  css=(ROOT/'experience/src/shell.css').read_text()
  journey=(ROOT/'experience/src/journey/journey.css').read_text()
  self.assertIn('min-height:44px',css)
  self.assertIn('.guardian-next{bottom:130px;',journey)
  self.assertIn('.guardian-skip,.guardian-replay{top:auto;bottom:87px;',journey)
  self.assertIn('min-height:36px;font-size:10px!important',journey)
  self.assertIn('font-size:8px;letter-spacing:.1em',css)
if __name__=='__main__': unittest.main()
