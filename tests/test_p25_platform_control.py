"""Galaxy platform admin contracts: fail closed, shared auth isolation, no self-upgrade."""
from pathlib import Path
import unittest
BASE=Path(__file__).resolve().parents[1]
SQL=(BASE/"supabase/migrations/20261023194000_galaxy_platform_admin_approval.sql").read_text()
JS=(BASE/"app.js").read_text()
HTML=(BASE/"index.html").read_text()
class GalaxyPlatformContract(unittest.TestCase):
 def test_shared_auth_is_not_globally_modified(self):
  self.assertNotIn("create trigger galaxy_queue_new_signup",SQL.lower())
  self.assertNotIn("after insert on auth.users",SQL.lower())
  self.assertIn("galaxy_request_access()",SQL)
  self.assertIn("insert into galaxy_private.signup_approvals(user_id)",SQL)
 def test_admin_authority_stays_server_side(self):
  self.assertIn("galaxy_private.require_admin()",SQL)
  self.assertIn("galaxy_private.platform_admins",SQL)
  self.assertIn("PLATFORM_ADMIN_REQUIRED",SQL)
  self.assertNotIn("service_role",JS)
  self.assertIn("galaxy_platform_summary",JS)
  self.assertIn("galaxy_platform_manage_subscription",JS)
  self.assertIn("galaxy_platform_assign_plan",SQL)
  self.assertIn("state.platformAuthorized",JS)
 def test_no_user_self_upgrades(self):
  self.assertIn("grant execute on function public.galaxy_platform_assign_plan",SQL)
  self.assertIn("perform galaxy_private.require_admin();",SQL)
  self.assertIn("state.platformAuthorized",JS)
  self.assertIn("galaxy_platform_review",JS)
 def test_admin_is_hidden_by_default(self):
  self.assertIn('id="platform-nav"',HTML)
  self.assertIn('class="navlink" hidden',HTML)
if __name__=="__main__": unittest.main()
