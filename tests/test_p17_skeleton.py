from pathlib import Path
import json
import unittest
ROOT=Path(__file__).resolve().parents[1]

class SkeletonReplacementTests(unittest.TestCase):
 def test_original_quaternius_license_kept_for_historical_provenance(self):
  old=(ROOT/'docs/experience/P17_SKELETON_PROVENANCE.md').read_text()
  self.assertIn('Quaternius',old)
  self.assertIn('CC0',old)
 def test_replacement_is_real_external_licensed_glb(self):
  src=(ROOT/'experience/scripts/fetch-kaykit.py').read_text()
  for token in ('KayKit-Game-Assets','CC0','Skeleton_Mage.glb','EXPECTED_BYTES','GIT_BLOB_SHA','verify(contents)'):
   self.assertIn(token,src)
  model=(ROOT/'experience/src/guardian/KayKitGuardian.jsx').read_text()
  for token in ('useGLTF','useAnimations','fadeIn','discoverRigAnchors','models/kaykit/Skeleton_Mage.glb',
                'gripMidpoint','moveWrist'):
   self.assertIn(token,model)
  self.assertNotIn("material.color.set('#f2e3d2')",model)
 def test_app_uses_new_character_and_keeps_progress_hand_off(self):
  app=(ROOT/'experience/src/App.jsx').read_text()
  self.assertIn("from './guardian/KayKitGuardian.jsx'",app)
  self.assertNotIn("from './guardian/SkeletonGuardian.jsx'",app)
  self.assertIn("rigPoseRef={rigPoseRef}",app)
  self.assertIn("completedWorlds(",app)
 def test_build_must_download_verified_gltf(self):
  pkg=json.loads((ROOT/'experience/package.json').read_text())
  self.assertIn('python3 scripts/fetch-kaykit.py',pkg['scripts']['build'])
if __name__=='__main__':unittest.main()
