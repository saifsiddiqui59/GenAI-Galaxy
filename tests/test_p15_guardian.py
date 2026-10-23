from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class GuardianSourceTests(unittest.TestCase):
 def test_pinned_official_cc0_asset(self):
  s=(ROOT/'experience/scripts/fetch-guardian.mjs').read_text()
  self.assertIn('eba30de865cfbf31ac736f792defd9a60ff28d57',s)
  self.assertIn('047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319',s)
  self.assertIn('verify(await download(SOURCE))',s)
  self.assertIn('463988',s)
  self.assertNotIn('service_role',s)
 def test_real_skeletal_clips_and_fallback(self):
  s=(ROOT/'experience/src/guardian/Guardian.jsx').read_text()
  for word in ("Walking","Wave","ThumbsUp","Idle","useAnimations","fadeIn","fadeOut","GuardianFallback","Suspense"):
   self.assertIn(word,s)
  self.assertIn('import.meta.env.BASE_URL',s)
if __name__=='__main__': unittest.main()
