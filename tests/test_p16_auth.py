from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class AuthTests(unittest.TestCase):
 def test_owner_scoped_query_and_no_writes(self):
  s=(ROOT/'experience/src/auth/galaxySession.js').read_text()
  for x in ("getUser()","genai_study_progress","eq('user_id',user.id)","row.user_id!==userId",
            "PROGRESS_LIMIT","closed||epoch!==generation","onAuthStateChange","signInWithPassword"):
   self.assertIn(x,s)
  for forbidden in (".upsert(", ".insert(", ".update(", "service_role", "sb_secret_", "getSession().data.session"):
   self.assertNotIn(forbidden,s)
 def test_ui_does_not_show_demo_user_as_real(self):
  s=(ROOT/'experience/src/auth/GalaxyAuth.jsx').read_text()
  self.assertIn('if(demo)return null',s)
  self.assertIn('onSnapshot',s)
  self.assertIn('type="password"',s)
  self.assertIn('Sign out',s)
if __name__=='__main__':unittest.main()
