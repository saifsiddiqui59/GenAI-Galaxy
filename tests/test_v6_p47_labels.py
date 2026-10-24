from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class AtlasNameContracts(unittest.TestCase):
 def test_every_planet_has_name_independent_of_hover_and_mobile(self):
  scene=(ROOT/'experience/src/space/DeepGalaxy.jsx').read_text()
  self.assertIn('data-world-label={world.index}',scene)
  self.assertIn('curriculum[world.index].title',scene)
  self.assertNotIn('(hover||recommended)&&!lowPower&&<Html',scene)
  self.assertIn('pointerEvents:\'none\'',scene)
  css=(ROOT/'experience/src/shell.css').read_text()
  self.assertIn('.planet-caption-next',css)
  self.assertIn('@media(max-width:700px){.planet-caption',css)
if __name__=='__main__': unittest.main()
