from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class OfferedWorldContracts(unittest.TestCase):
 def test_offered_world_routes_through_existing_17_world_navigation(self):
  fx=(ROOT/'experience/src/effects/CollectionFX.jsx').read_text()
  app=(ROOT/'experience/src/App.jsx').read_text()
  self.assertIn('onSelect?.(worldIndex)',fx)
  self.assertIn('onSelectWorld={select}',app)
  journey=(ROOT/'experience/src/journey/GuardianJourney.jsx').read_text()
  self.assertIn('{nextName',journey)
  self.assertIn("Click the glowing planet",journey)
  self.assertNotIn('galaxy-offer-label',fx)
  self.assertIn('onClick={e=>{e.stopPropagation()',fx)
  self.assertIn('sphereGeometry args={[.37,20,14]}',fx)
if __name__=='__main__': unittest.main()
