from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class SkeletonReplacementTests(unittest.TestCase):
 def test_actual_cc0_animation_source(self):
  src=(ROOT/'experience/scripts/fetch-skeleton.py').read_text()
  self.assertIn("opengameart.org/sites/default/files/Animated%20Monster",src)
  self.assertIn('CC0-1.0',src)
  self.assertIn('Skeleton.fbx',src)
  self.assertIn('fbxSha256',src)
  self.assertIn("Expected real FBX",src)
 def test_robot_removed_from_render_path(self):
  app=(ROOT/'experience/src/App.jsx').read_text()
  self.assertIn("from './guardian/SkeletonGuardian.jsx'",app)
  self.assertNotIn("from './guardian/Guardian.jsx'",app)
  model=(ROOT/'experience/src/guardian/SkeletonGuardian.jsx').read_text()
  for term in ('FBXLoader','useAnimations','fadeIn','SkinnedMesh','models/skeleton/Skeleton.fbx','chooseSkeletonClip'):
   self.assertIn(term,model)
 def test_build_requires_real_fbx(self):
  import json
  pkg=json.loads((ROOT/'experience/package.json').read_text())
  self.assertIn('python3 scripts/fetch-skeleton.py',pkg['scripts']['build'])
if __name__=='__main__':unittest.main()
