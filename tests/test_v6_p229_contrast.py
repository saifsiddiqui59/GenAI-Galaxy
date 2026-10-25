from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]

class SkullMasterContrast(unittest.TestCase):
 def test_light_pass_preserves_eye_emission_and_limits_blown_out_front_fill(self):
  scene=(ROOT/'experience/src/space/DeepGalaxy.jsx').read_text()
  style=(ROOT/'experience/src/guardian/styleKayKit.js').read_text()
  assert 'color="#aaa0d1" intensity={8.5}' in scene
  assert 'intensity={15} distance={9}' not in scene
  assert "emissive.set('#f15c0f')" in style
  assert 'SKULLMASTER_PROFILE' in (ROOT/'experience/src/guardian/KayKitGuardian.jsx').read_text()

if __name__=='__main__':unittest.main()
