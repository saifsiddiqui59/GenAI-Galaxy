"""P42 three role contract; never alter shared Supabase Auth or privilege browser clients."""
from pathlib import Path
import unittest

R=Path(__file__).resolve().parents[1]
SQL=(R/"supabase/migrations/20261024140500_galaxy_three_role_access.sql").read_text()
APP=(R/"app.js").read_text()

class GalaxyThreeRoleTests(unittest.TestCase):
 def test_only_three_valid_galaxy_roles(self):
  self.assertIn("check (admin_role in ('SUPER_ADMIN', 'ADMIN'))",SQL)
  self.assertIn("'USER'",SQL)
  self.assertIn("a.user_id=auth.uid() and a.active=true and a.admin_role='SUPER_ADMIN'",SQL)
  self.assertIn("raise exception 'GALAXY_SUPER_ADMIN_REQUIRED'",SQL)
 def test_legacy_plan_rpc_denied_and_new_plan_rpc_privileged(self):
  self.assertIn("revoke all on function public.galaxy_platform_assign_plan(uuid,text,text,integer)",SQL)
  managed=SQL.split("create or replace function public.galaxy_platform_manage_subscription(")[1].split("end $$;")[0]
  self.assertIn("perform galaxy_private.require_super_admin();",managed)
  self.assertIn("a.status='APPROVED'",managed)
  self.assertIn("p_user_id=auth.uid()",managed)
 def test_auth_table_and_other_apps_untouched(self):
  for forbidden in ("insert into auth.users","update auth.users","after insert on auth.users",
                    "retailgrowth","wineshoppos","service_role"):
   self.assertNotIn(forbidden,SQL.lower())
  self.assertNotIn("insert into galaxy_private.platform_admins",SQL.lower())
 def test_browser_read_only_admin(self):
  self.assertIn("state.platformRole==='SUPER_ADMIN'",APP)
  self.assertIn("state.platformRole!=='SUPER_ADMIN'",APP)
  self.assertIn("galaxy_my_platform_role",APP)
  self.assertIn("Subscription changes restricted",APP)
  self.assertIn("state.platformRole=null",APP)

if __name__=="__main__":
 unittest.main()
