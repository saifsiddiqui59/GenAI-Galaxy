from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class HoodVisualContracts(unittest.TestCase):
 def test_no_plastic_forehead_bar_or_floating_headband(self):
  cloak=(ROOT/'experience/src/guardian/skullMasterMantle.js').read_text()
  detail=(ROOT/'experience/src/guardian/skullMasterDetail.js').read_text()
  self.assertNotIn('const frontRim=',cloak)
  self.assertNotIn("trim.name='SkullMasterHoodSeam'",detail)
  self.assertIn('hemTear=',cloak)
  self.assertIn("outer:'#14111e'",cloak)
if __name__=='__main__':unittest.main()
