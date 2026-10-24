"""P37 owner-only SaaS operations: refuse cross-app and unauthorized paths."""
from pathlib import Path
import subprocess, unittest
ROOT=Path(__file__).resolve().parents[1]
SQL=(ROOT/"supabase/migrations/20261024115500_galaxy_saas_operations.sql").read_text()
JS=(ROOT/"app.js").read_text()
HTML=(ROOT/"index.html").read_text()
class SaaSOpsTests(unittest.TestCase):
 def test_reminders_and_alerts(self):
  subprocess.run(["node","tests/test_p37_saas.cjs"],cwd=ROOT,check=True,timeout=15)
 def test_no_shared_auth_trigger_and_database_role_security(self):
  self.assertNotIn("after insert on auth.users",SQL.lower())
  for rpc in ["galaxy_platform_accounts","galaxy_platform_summary","galaxy_platform_manage_subscription","galaxy_platform_audit"]:
   block=SQL.split("create or replace function public."+rpc)[1].split("end $$;")[0]
   self.assertIn("perform galaxy_private.require_admin();",block)
  self.assertIn("where a.user_id=p_user_id and a.status='APPROVED'",SQL)
  self.assertIn("p_user_id=auth.uid()",SQL)
  self.assertIn("union select user_id from public.genai_study_progress",SQL)
  self.assertNotIn("revoke all on auth.users",SQL.lower())
 def test_client_no_admin_secret_or_mock_sales(self):
  self.assertIn("GalaxySaaSOperations?.warnings(",JS)
  self.assertIn("galaxy_platform_accounts",JS)
  self.assertIn("galaxy_platform_manage_subscription",JS)
  self.assertIn("galaxy_my_plan_lifecycle",JS)
  self.assertIn("features/saas-operations.js",HTML)
  self.assertNotIn("service_role",JS)
  self.assertIn("'subscription_payment_revenue_inr', null",SQL)
