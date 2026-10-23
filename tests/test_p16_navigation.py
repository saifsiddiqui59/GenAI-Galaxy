from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class NavigationTests(unittest.TestCase):
 def test_does_not_embed_auth_or_progress(self):
  js=(ROOT/'experience/src/navigation/navigation.js').read_text()
  self.assertIn("WORLD_COUNT=17",js)
  self.assertIn("new URL('/index.html',base.origin)",js)
  self.assertIn("searchParams.set('galaxyWorld',String(index))",js)
  self.assertIn("saveData",js)
  self.assertNotIn("authToken",js)
  self.assertNotIn("user_id",js)
 def test_keyboard_world_picker(self):
  js=(ROOT/'experience/src/navigation/WorldDock.jsx').read_text()
  for x in ("aria-label","Escape","onSelect","recommended","17 planets"):
   self.assertIn(x,js)
if __name__=="__main__":unittest.main()
