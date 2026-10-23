"""Source contract for independent Vite 3D galaxy; build is verified by GitHub Actions."""
import json
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
XP=ROOT/"experience"

class ThreeDIntegrationTests(unittest.TestCase):
 def test_isolated_react_app_and_real_curriculum(self):
  package=json.loads((XP/"package.json").read_text())
  for dependency in ("@react-three/fiber","@react-three/drei","three","react","react-dom","vite"):
   self.assertTrue(dependency in package.get("dependencies",{}) or dependency in package.get("devDependencies",{}))
  self.assertIn("npm run assets",package["scripts"]["build"])
  app=(XP/"src/App.jsx").read_text()
  self.assertIn("import curriculum from '../../data/curriculum.json'",app)
  self.assertIn("completedWorlds(",app)
  self.assertIn("GuardianJourney",app)
  self.assertIn("GalaxyScene",app)
  self.assertIn("WarpGate",app)
  self.assertIn("17",app)
  self.assertIn("SHOW_SAMPLE",app)
  self.assertIn("3 SAMPLE MASTERED WORLDS",app)
  self.assertIn("onSelect={select}",app)
  self.assertNotIn("service_role",app)
  self.assertNotIn("fetch(",app)
 def test_lesson_handoff_whitelists_index(self):
  source=(ROOT/"app.js").read_text()
  self.assertIn("get('galaxyWorld')",source)
  self.assertIn("chapterTopics(index)[0]",source)
  self.assertIn("chooseTopic(topic)",source)
  self.assertIn("1[0-6]",source)
 def test_no_generated_glb_committed_in_source(self):
  ignore=(XP/".gitignore").read_text()
  self.assertIn("public/models/guardian.glb",ignore)
  self.assertFalse((XP/"public/models/guardian.glb").exists())
if __name__=="__main__": unittest.main()
