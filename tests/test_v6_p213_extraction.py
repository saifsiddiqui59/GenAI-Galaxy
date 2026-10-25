from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class CinematicExtraction(unittest.TestCase):
 def test_sparks_follow_same_real_orbit_and_are_never_persistent(self):
  fx=(ROOT/'experience/src/effects/CollectionFX.jsx').read_text()
  self.assertIn('source.x+(end.x-source.x)*u',fx)
  self.assertIn('const origin=galaxySpaceAt(',fx)
  self.assertIn('sparks.current.visible=visible',fx)
  self.assertIn('!reducedMotion&&pick.t>.025&&pick.t<.30',fx)
  self.assertIn('sparksGeometry.dispose()',fx)
if __name__=='__main__':unittest.main()
