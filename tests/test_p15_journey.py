from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class JourneyTests(unittest.TestCase):
 def test_mastery_is_readonly_status_two_all_topics(self):
  s=(ROOT/"experience/src/journey/story.js").read_text()
  self.assertIn('TOTAL_WORLDS=17',s)
  self.assertIn("v.user_id!==ownerId",s)
  self.assertIn("every(t=>progress[worldKey(t)]?.status===2)",s)
  self.assertIn("recommendedWorld",s)
  self.assertIn("next_review_at",s)
  for bad in ("supabase", "localStorage.setItem", "fetch("):self.assertNotIn(bad,s)
 def test_clickable_satchel_and_motion(self):
  s=(ROOT/"experience/src/journey/GuardianJourney.jsx").read_text()
  for v in ("aria-expanded", "aria-controls", "onSelectCompleted", "onAccept", "Skip introduction", "Replay guardian entrance", "reducedMotion"):
   self.assertIn(v,s)
  self.assertIn("performance.now()",s)
if __name__=="__main__":unittest.main()
