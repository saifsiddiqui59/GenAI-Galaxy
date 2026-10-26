"""Check the bag is a thin, flexible-looking messenger satchel, not a pot."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class SatchelVisualContracts(unittest.TestCase):
 def test_flat_messenger_bag_has_open_slit_and_live_hip_attachment(self):
  fx=(ROOT/'experience/src/effects/CollectionFX.jsx').read_text()
  guardian=(ROOT/'experience/src/guardian/KayKitGuardian.jsx').read_text()
  for fragment in ('const pouchGeometry=useMemo(', 'ExtrudeGeometry(outline',
    'const strapGeometry=useMemo(', 'bag.current.position.copy(pose.bag)',
    'onOpenSack?.()', 'color="#090b13"', 'pickupAt(c.ms,order)'):
   self.assertIn(fragment,fx)
  self.assertNotIn('torusGeometry args={[.248,.022,8,32]}',fx)
  self.assertNotIn('sphereGeometry args={[.305,20,14]}',fx)
  self.assertIn('const mouth=bag.clone()',guardian)
 def test_bare_skeleton_replaces_costume(self):
  src=(ROOT/'experience/src/guardian/styleKayKit.js').read_text()
  rib=(ROOT/'experience/src/guardian/bareSkull.js').read_text()
  self.assertIn('attachBareSkullTorso',src)
  self.assertNotIn('attachSkullMasterCloak(source,THREE)',src)
  self.assertIn("'Skeleton_Mage_Hat','Skeleton_Mage_Body'",rib)
  self.assertIn("SkullMasterBareRibCage",rib)
if __name__=='__main__': unittest.main()
