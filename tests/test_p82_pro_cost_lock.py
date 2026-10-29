"""P82 no-network fail-closed PRO spending controls."""
import os
import pathlib
import sys
import unittest
from unittest.mock import patch

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"api"))
from consumption_security import (
    GALAXY_SUPABASE_URL,ProRequired,QuotaUnavailable,enforce_pro_access
)

class ProCostLockTests(unittest.TestCase):
    def test_paid_routes_are_off_without_explicit_release(self):
        seen=[]
        with patch.dict(os.environ,{},clear=True):
            with self.assertRaises(QuotaUnavailable):
                enforce_pro_access(token="jwt",base=GALAXY_SUPABASE_URL,
                  public_key="publishable",request_json=lambda *a,**k:seen.append(a))
        self.assertEqual(seen,[],"OFF means no network/DB call, not just no LLM call")

    def test_pro_requires_trusted_server_rpc_not_client_payload(self):
        expected={"plan_code":"PRO","status":"ACTIVE","allowed":True,
                  "daily_eval_limit":20}
        def ok(url,**kw):
            self.assertTrue(url.endswith("/rpc/genai_study_my_subscription"))
            self.assertEqual(kw["payload"],{})
            self.assertEqual(kw["token"],"jwt")
            return expected
        with patch.dict(os.environ,{"GALAXY_PAID_FEATURES_ENABLED":"active"},clear=True):
            enforce_pro_access(token="jwt",base=GALAXY_SUPABASE_URL,
              public_key="publishable",request_json=ok)
            for plan in (
                dict(plan_code="FREE",status="ACTIVE",allowed=True,daily_eval_limit=5),
                dict(plan_code="PLUS",status="ACTIVE",allowed=True,daily_eval_limit=10),
                dict(plan_code="PRO",status="PAST_DUE",allowed=False,daily_eval_limit=0),
                dict(plan_code="PRO",status="SUSPENDED",allowed=False,daily_eval_limit=0),
                dict(plan_code="PRO",status="ACTIVE",allowed="true",daily_eval_limit=20),
                dict(plan_code="PRO",status="ACTIVE",allowed=True,daily_eval_limit="20"),
            ):
                with self.subTest(plan=plan),self.assertRaises(ProRequired):
                    enforce_pro_access(token="jwt",base=GALAXY_SUPABASE_URL,
                      public_key="publishable",request_json=lambda *a,**k:plan)
            for invalid in (None, True, [], "PRO"):
                with self.subTest(invalid=invalid),self.assertRaises(QuotaUnavailable):
                    enforce_pro_access(token="jwt",base=GALAXY_SUPABASE_URL,
                      public_key="publishable",request_json=lambda *a,**k:invalid)

    def test_no_other_project_or_missing_credentials(self):
        with patch.dict(os.environ,{"GALAXY_PAID_FEATURES_ENABLED":"active"},clear=True):
            for base,token,pub in [("https://elsewhere.supabase.co","jwt","key"),
                                   (GALAXY_SUPABASE_URL,"","key"),
                                   (GALAXY_SUPABASE_URL,"jwt","")]:
                with self.assertRaises(QuotaUnavailable):
                    enforce_pro_access(token=token,base=base,public_key=pub,
                      request_json=lambda *a,**k:self.fail("Unexpected request"))

    def test_backend_enforces_before_azure_and_paid_routes(self):
        src=(ROOT/"api/function_app.py").read_text()
        evaluate=src.split("def evaluate(req:func.HttpRequest)",1)[1].split(
          "def tutor_model_response",1)[0]
        tutor=src.split("def tutor(req:func.HttpRequest)",1)[1].split(
          "@app.route(route='vault/extract'",1)[0]
        for part in (evaluate,tutor):
            self.assertIn("enforce_pro_access(token=token",part)
            self.assertLess(part.index("enforce_pro_access("),part.index("enforce_eval_quota("))
            self.assertIn("except ProRequired:",part)
        for route in ("def vault_extract(req:func.HttpRequest)","def speech_token(req:func.HttpRequest)"):
            piece=src.split(route,1)[1].split("except InputError",1)[0]
            self.assertIn("GALAXY_PAID_FEATURES_ENABLED",piece)

    def test_galaxy_quota_migration_is_off_and_safely_scoped(self):
        path=ROOT/"supabase/migrations/20261029083000_galaxy_pro_paid_features_paused.sql"
        sql=path.read_text()
        self.assertIn("v_paid_features_released boolean := false",sql)
        self.assertIn("if not v_paid_features_released then return false",sql)
        self.assertIn("is distinct from 'PRO'",sql)
        self.assertIn("public.galaxy_access_allowed()",sql)
        self.assertIn("pg_advisory_xact_lock",sql)
        self.assertIn("coalesce(v_global_count,0)>=50",sql)
        for forbidden in ("auth.users set","service_role","wineshoppos","payments"):
            self.assertNotIn(forbidden,sql.lower())

if __name__=="__main__":
    unittest.main()
