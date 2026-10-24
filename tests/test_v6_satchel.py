"""Guard the native satchel and 17-world pickup flow during art refinements."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class SatchelVisualContracts(unittest.TestCase):
 def test_soft_satchel_keeps_open_deposit_mouth_and_rig_attachment(self):
  fx=(ROOT/'experience/src/effects/CollectionFX.jsx').read_text()
  guardian=(ROOT/'experience/src/guardian/KayKitGuardian.jsx').read_text()
  self.assertIn('sphereGeometry args={[.305,20,14]}',fx)
  self.assertIn('circleGeometry args={[.245,28]}',fx)
  self.assertIn('torusGeometry args={[.248,.022,8,32]}',fx)
  self.assertIn('bag.current.position.copy(pose.bag)',fx)
  self.assertIn('pickupAt(c.ms,order)',fx)
  self.assertIn('const mouth=bag.clone()',guardian)
if __name__=='__main__':unittest.main()
