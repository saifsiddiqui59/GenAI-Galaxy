"""Offline test fixtures for the manual-only ephemeral Auth test runner."""
import base64
import json
import pathlib
import sys
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import ephemeral_rls_accounts as tool


class EphemeralAuthTests(unittest.TestCase):
    def test_reject_missing_public_key_and_privileged_key_in_user_test(self):
        with self.assertRaises(tool.CheckFailed):
            tool.validate_admin_key("")
        with self.assertRaises(tool.CheckFailed):
            tool.validate_admin_key("sb_publishable_sample")

    def test_allow_project_scoped_legacy_service_jwt_not_anon(self):
        def fake_jwt(role, ref):
            payload = base64.urlsafe_b64encode(json.dumps({"role": role, "ref": ref}).encode()).rstrip(b"=").decode()
            return "eyJhbGciOiJIUzI1NiJ9." + payload + ".signature"
        valid = fake_jwt("service_role", "vfoghlhtnifpnbevgufa")
        self.assertEqual(tool.validate_admin_key(valid), valid)
        for invalid in [fake_jwt("anon", "vfoghlhtnifpnbevgufa"),
                        fake_jwt("service_role", "another-project")]:
            with self.assertRaises(tool.CheckFailed):
                tool.validate_admin_key(invalid)

    def test_restrict_admin_path_to_uuid(self):
        with self.assertRaises(tool.CheckFailed):
            tool.admin_request("DELETE", "/../unsafe", "sb_secret_test")
        with self.assertRaises(tool.CheckFailed):
            tool.admin_request("DELETE", "/../../rest/v1/tenants", "sb_secret_test")

    def test_create_deletes_both_accounts_even_if_rls_probe_fails(self):
        # All calls mocked. No external network or hosted credentials in CI.
        ids = [str(tool.uuid.uuid4()), str(tool.uuid.uuid4())]
        deleted = []
        def fake_create(secret, address, password):
            return ids.pop(0)
        def fake_admin(method, path, secret, body=None):
            if method == "DELETE":
                deleted.append(path)
                return 204, {}
            raise AssertionError("Unexpected network operation")
        env = {
            "GITHUB_REPOSITORY": "saifsiddiqui59/GenAI-Galaxy",
            "GITHUB_REF": "refs/heads/main",
            "GALAXY_CONFIRM": "TEST",
            "GALAXY_SUPABASE_URL": tool.URL,
            "GALAXY_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_test",
            "GALAXY_SUPABASE_ADMIN_KEY": "sb_secret_test"
        }
        with patch.dict(tool.os.environ, env, clear=True), \
             patch.object(tool, "create_test_user", side_effect=fake_create), \
             patch.object(tool, "admin_request", side_effect=fake_admin), \
             patch.object(tool, "run_rls", side_effect=tool.CheckFailed("simulated")):
            with self.assertRaises(tool.CheckFailed):
                tool.run()
        self.assertEqual(len(deleted), 2)
        self.assertNotEqual(deleted[0], deleted[1])

    def test_sigterm_during_probe_requests_existing_cleanup(self):
        ids = [str(tool.uuid.uuid4()), str(tool.uuid.uuid4())]
        removed = []
        def created(secret, address, password):
            return ids.pop(0)
        def admin(method, path, secret, body=None):
            self.assertEqual(method, 'DELETE')
            removed.append(path)
            return 204, {}
        with patch.dict(tool.os.environ, {
            "GITHUB_REPOSITORY": "saifsiddiqui59/GenAI-Galaxy",
            "GITHUB_REF": "refs/heads/main", "GALAXY_CONFIRM": "TEST",
            "GALAXY_SUPABASE_URL": tool.URL,
            "GALAXY_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_fake",
            "GALAXY_SUPABASE_ADMIN_KEY": "sb_secret_fake",
        }, clear=True), patch.object(tool, 'create_test_user', side_effect=created), \\
             patch.object(tool, 'admin_request', side_effect=admin), \\
             patch.object(tool, 'run_rls', side_effect=lambda: tool._cancellation_requested(None,None)):
            with self.assertRaisesRegex(tool.CheckFailed, "cancellation"):
                tool.run()
        self.assertEqual(len(removed), 2)

    def test_workflow_is_manual_and_never_exposes_secret_in_pull_requests(self):
        wf = (ROOT.parent / '.github/workflows/galaxy-ephemeral-rls.yml').read_text()
        self.assertIn('workflow_dispatch:', wf)
        self.assertNotIn('pull_request:', wf)
        self.assertNotIn('  push:', wf)
        self.assertIn('environment: dev', wf)
        self.assertIn("inputs.confirm == 'TEST'", wf)
        self.assertIn('GALAXY_SUPABASE_ADMIN_KEY: ${{ secrets.GALAXY_SUPABASE_ADMIN_KEY }}', wf)
        self.assertNotIn('az storage', wf)

    def test_cannot_run_on_push_or_other_repo(self):
        with patch.dict(tool.os.environ, {"GITHUB_REPOSITORY":"example/other",
                                          "GITHUB_REF":"refs/heads/main",
                                          "GALAXY_CONFIRM":"TEST"}, clear=True):
            with self.assertRaises(tool.CheckFailed):
                tool.run()


if __name__ == "__main__":
    unittest.main()
