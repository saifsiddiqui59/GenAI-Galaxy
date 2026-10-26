"""Check that the old pot-like sack is replaced with a clickable soul vault."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class SatchelVisualContracts(unittest.TestCase):
 def test_void_vault_is_clickable_and_rig_attached_without_a_pot(self):
  fx=(ROOT/'experience/src/effects/CollectionFX.jsx').read_text()
  guardian=(ROOT/'experience/src/guardian/KayKitGuardian.jsx').read_text()
  for fragment in ("function Satchel(", "vault.current.position.copy(pose.bag)",
    "onOpenSack?.()", 'ringGeometry args={[.145,.185,64]}',
    'torusGeometry args={[.225,.013,9,56]}', "pickupAt(c.ms,order)"):
   self.assertIn(fragment,fx)
  self.assertNotIn('ExtrudeGeometry(outline',fx)
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
