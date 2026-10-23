"""Offline tests for Galaxy-only freemium plan contracts and real-login smoke.

No network access, paid provider calls, Auth users or shared DB writes in CI.
"""
import json
import pathlib
import sys
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tests"))
import ephemeral_rls_accounts as runner


class GalaxySubscriptionTests(unittest.TestCase):
    def test_galaxy_login_is_supabase_native(self):
        source=(ROOT/"app.js").read_text()
        self.assertIn("state.client.auth.signInWithPassword({email,password})",source)
        self.assertIn("state.client.auth.signUp({email,password})",source)
        self.assertIn("state.client.auth.onAuthStateChange(",source)
        self.assertIn("state.client.auth.resetPasswordForEmail(",source)
        self.assertNotIn("wineshoppos.supabase",source.lower())

    def test_subscription_sql_does_not_touch_other_projects_or_enable_payments(self):
        sql=(ROOT/"infra/azure/backend/galaxy_subscription_entitlements_REVIEW_ONLY.sql").read_text()
        self.assertIn("genai_study_plan_catalog",sql)
        self.assertIn("genai_study_user_subscriptions",sql)
        self.assertIn("genai_study_my_subscription",sql)
        self.assertIn("auth.uid()",sql)
        self.assertIn("pg_advisory_xact_lock",sql)
        self.assertIn("genai_study_reserve_evaluation",sql)
        self.assertIn("COALESCE(v_global_count,0)>=50",sql)
        for code in ("'FREE'","'PLUS'","'PRO'"):
            self.assertIn(code,sql)
        for name in ("public.shops","public.saas_shop_subscriptions","public.tenants",
                     "public.patients","Razorpay","Stripe","INSERT INTO auth.users",
                     "GRANT INSERT ON public.genai_study_user_subscriptions TO authenticated"):
            self.assertNotIn(name,sql)

    def test_workflow_and_script_are_manual_and_test_before_paid_provisioning(self):
        script=(ROOT/"scripts/galaxy_p3_one_shot.sh").read_text()
        self.assertLess(script.index("run_workflow galaxy-ephemeral-rls.yml"),
                        script.index("run_workflow galaxy-p3-model-provision.yml"))
        self.assertLess(script.index("run_workflow galaxy-p3-model-provision.yml"),
                        script.index("run_workflow galaxy-p3-flex-provision.yml"))
        self.assertLess(script.index("run_workflow galaxy-p3-flex-deploy.yml"),
                        script.index("run_workflow galaxy-ephemeral-live-ai.yml"))
        self.assertLess(script.index("run_workflow galaxy-ephemeral-live-ai.yml"),
                        script.index("run_workflow galaxy-static-deploy.yml"))
        self.assertIn("gh run watch",script)
        self.assertNotIn("ensure_secret GALAXY_AZURE_OPENAI_ENDPOINT",script)
        self.assertNotIn("ensure_secret GALAXY_AZURE_OPENAI_API_KEY",script)
        self.assertNotIn("az group create",script)
        wf=(ROOT/".github/workflows/galaxy-ephemeral-live-ai.yml").read_text()
        self.assertIn("workflow_dispatch:",wf)
        self.assertNotIn("  push:",wf)
        self.assertNotIn("pull_request:",wf)
        self.assertIn("GALAXY_RUN_AI_SMOKE: '1'",wf)
        self.assertIn("GALAXY_SUPABASE_ADMIN_KEY:",wf)

    def test_static_ai_gate_uses_real_github_token(self):
        wf=(ROOT/".github/workflows/galaxy-static-deploy.yml").read_text()
        self.assertIn("GH_TOKEN: $" + "{{ github.token }}",wf)
        self.assertIn("RELEASE_SHA: $" + "{{ github.sha }}",wf)
        self.assertNotIn("GH_TOKEN: " + chr(92) + "$",wf)
        self.assertIn("actions: read",wf)
        self.assertIn("inputs.enable_evaluator == 'AI_READY'",wf)
        self.assertIn("galaxy-ephemeral-live-ai.yml",wf)

    def test_signed_in_free_plan_no_cross_user_or_self_upgrade(self):
        calls=[]
        ids={"a@example.com":("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","token-a"),
             "b@example.com":("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","token-b")}
        def fake_signin(email,password,key):
            self.assertEqual(key,"sb_publishable_dummy")
            return ids[email]
        def fake_request(method,path,key,token=None,body=None):
            calls.append((method,path,token,body))
            if path.endswith("genai_study_my_subscription"):
                return 200,b'{"plan_code":"FREE","status":"ACTIVE","allowed":true,"daily_eval_limit":5}'
            if method=="GET" and "user_id=eq." in path:
                return 200,b"[]"
            if method=="POST" and path.endswith("/genai_study_user_subscriptions"):
                return 403,b'{"code":"42501"}'
            raise AssertionError("Unexpected API request")
        with patch.object(runner,"sign_in",side_effect=fake_signin),patch.object(runner,"request",side_effect=fake_request):
            runner.check_galaxy_subscriptions("sb_publishable_dummy",
                "a@example.com","dummy","b@example.com","dummy")
        self.assertEqual(sum(c[0]=="POST" and "my_subscription" in c[1] for c in calls),2)
        self.assertTrue(any(c[0]=="POST" and c[3] and c[3].get("plan_code")=="PRO" for c in calls))

    def test_subscription_self_upgrade_is_release_blocker(self):
        def fake_request(method,path,key,token=None,body=None):
            if "my_subscription" in path:return 200,b'{"plan_code":"FREE","status":"ACTIVE","allowed":true,"daily_eval_limit":5}'
            if method=="GET":return 200,b"[]"
            return 201,b'{"user_id":"fake"}'
        with patch.object(runner,"sign_in",side_effect=[
          ("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","token-a"),
          ("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","token-b")]), \
             patch.object(runner,"request",side_effect=fake_request):
            with self.assertRaisesRegex(runner.CheckFailed,"self-upgrade"):
                runner.check_galaxy_subscriptions("key","a","p","b","p")


if __name__=="__main__":
    unittest.main()
