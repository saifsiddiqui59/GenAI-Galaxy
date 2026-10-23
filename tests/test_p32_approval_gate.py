"""P32 onboarding gate: source contracts. Hosted RLS proof is separate."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
SQL=(ROOT/'supabase/migrations/20261023201000_galaxy_approval_rls_gate.sql').read_text()
UI=(ROOT/'app.js').read_text()
class ApprovalGateTests(unittest.TestCase):
 def test_admin_lockout_prevention(self):
  self.assertIn("coalesce(enforced,false)=false then return true",SQL)
  self.assertNotIn("update galaxy_private.approval_settings",SQL.lower())
  self.assertIn("galaxy_private.platform_admins",SQL)
 def test_server_side_gates_cover_all_private_data(self):
  for table in ['genai_study_progress','genai_study_attempts','genai_study_documents','storage.objects']:
   self.assertIn('on '+('public.' if not table.startswith('storage.') else '')+table,SQL.lower())
  self.assertIn("OR NOT public.galaxy_access_allowed()",SQL)
  self.assertGreaterEqual(SQL.count('(select public.galaxy_access_allowed())'),14)
 def test_pending_screen_and_no_client_grant(self):
  self.assertIn("approvalPendingMarkup",UI)
  self.assertIn("galaxy_account_approval",UI)
  self.assertIn("admin approval enforced",UI.lower())
  self.assertNotIn("service_role",UI)
if __name__=="__main__":unittest.main()
