from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class DeepGalaxyTests(unittest.TestCase):
 def test_world_count_and_galaxy_is_local(self):
  code=(ROOT/"experience/src/space/DeepGalaxy.jsx").read_text()
  self.assertIn('PLANET_COUNT=17',code)
  self.assertIn('layoutWorlds()',code)
  self.assertIn('Starfield',code)
  self.assertIn('NebulaCloud',code)
  self.assertIn('onSelect?.(world.index)',code)
  self.assertIn('lowPower=size.width<700',code)
  self.assertIn('reducedMotion',code)
  self.assertNotIn('fetch(',code)
  self.assertNotIn('Math.random(',code)
if __name__=='__main__': unittest.main()
