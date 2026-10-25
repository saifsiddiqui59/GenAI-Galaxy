from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class PickupVisualPolish(unittest.TestCase):
 def test_transferred_world_does_not_leave_empty_ring(self):
  scene=(ROOT/'experience/src/space/DeepGalaxy.jsx').read_text()
  self.assertIn('ring.current.visible=!transferred',scene)
  self.assertIn('halo.current.visible=!transferred',scene)
  self.assertIn('collectedBeacon.current.visible=transferred',scene)
  self.assertIn('onSelect?.(world.index)',scene)
 def test_active_pickup_has_origin_to_palm_visual(self):
  fx=(ROOT/'experience/src/effects/CollectionFX.jsx').read_text()
  self.assertIn('source.x+(end.x-source.x)*a',fx)
  self.assertIn("trail.current.visible=visible",fx)
  self.assertIn('pick.t<.30',fx)
if __name__=='__main__':unittest.main()
