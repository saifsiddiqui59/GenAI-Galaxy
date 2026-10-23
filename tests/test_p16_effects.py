from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class FXTests(unittest.TestCase):
 def test_real_world_sack_geometry(self):
  s=(ROOT/'experience/src/effects/CollectionFX.jsx').read_text()
  for token in ("layoutWorlds()[world.index]","COLLECT_START_MS=1700","PER_WORLD_MS=1050",
                "collectPosition","pickup.clone().lerp(to","Satchel","onOpenSack?.()",
                "reducedMotion", "ready={true}"):
   self.assertIn(token,s)
  self.assertNotIn("fetch(",s)
  self.assertNotIn("service_role",s)
if __name__=="__main__":unittest.main()
