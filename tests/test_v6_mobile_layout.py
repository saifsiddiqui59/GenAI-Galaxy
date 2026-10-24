"""Guard the compact V6 HUD against tiny, overlapping mobile actions."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class V6MobileLayoutContracts(unittest.TestCase):
 def test_compact_actions_remain_readable(self):
  css=(ROOT/'experience/src/shell.css').read_text()
  journey=(ROOT/'experience/src/journey/journey.css').read_text()
  self.assertIn('min-height:44px',css)
  self.assertIn('.guardian-next{bottom:106px;',journey)
  self.assertIn('.guardian-skip,.guardian-replay{display:none!important}',journey)
  dock=(ROOT/'experience/src/navigation/WorldDock.jsx').read_text()
  self.assertIn('Skip Genie introduction',dock)
  self.assertIn('Replay Genie entrance',dock)
  self.assertIn('min-height:44px',(ROOT/'experience/src/navigation/world-dock.css').read_text())
  self.assertIn('font-size:8px;letter-spacing:.1em',css)
if __name__=='__main__': unittest.main()
