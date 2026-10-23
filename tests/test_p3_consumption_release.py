"""Fail closed if the consumption release acquires automatic triggers or other resources."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class P3ReleasePolicyTests(unittest.TestCase):
    def test_provision_requires_manual_approval_and_named_billed_resources(self):
        s = (ROOT / ".github/workflows/galaxy-p3-flex-provision.yml").read_text()
        for must in ("workflow_dispatch:", "inputs.confirm == 'PROVISION'",
                     "environment: dev", "refs/heads/main",
                     "RG: GenAI_Galaxy", "LOCATION: centralindia",
                     "gengalaxy-p3-1429841605", "gengalaxyp31429841605",
                     "--flexconsumption-location", "--maximum-instance-count 2",
                     "--instance-memory 512", "--disable-app-insights true",
                     "--allow-blob-public-access false", "azure/login@v3"):
            self.assertIn(must, s)
        for forbidden in ("pull_request:", "  push:", "az group create",
                          "az apim create", "--always-ready-instances", "service_role"):
            self.assertNotIn(forbidden, s)

    def test_deploy_requires_existing_exact_app_and_protected_secrets(self):
        s = (ROOT / ".github/workflows/galaxy-p3-flex-deploy.yml").read_text()
        for must in ("workflow_dispatch:", "inputs.confirm == 'DEPLOY'",
                     "environment: dev", "refs/heads/main", "functionapp show",
                     "GALAXY_BACKEND_PROFILE=direct-consumption",
                     "GALAXY_AZURE_OPENAI_API_KEY", "GALAXY_SUPABASE_PUBLISHABLE_KEY",
                     "Azure/functions-action@v1", "package: api",
                     "gengalaxy-p3-1429841605"):
            self.assertIn(must, s)
        for forbidden in ("pull_request:", "  push:", "az functionapp create",
                          "az storage account create", "az apim create",
                          "publish-profile:", "service_role", "GALAXY_GATEWAY_SHARED_SECRET="):
            self.assertNotIn(forbidden, s)

    def test_sql_is_review_only_and_isolated_from_clinic(self):
        sql = (ROOT / "infra/azure/backend/galaxy_quota_REVIEW_ONLY.sql").read_text()
        self.assertIn("REVIEW-ONLY SQL", sql)
        for table in ("genai_study_eval_user_daily", "genai_study_eval_global_daily"):
            self.assertIn("public." + table, sql)
        for unsafe in ("public.patients", "public.appointments", "public.tenants",
                       "auth.users", "DROP SCHEMA", "DROP POLICY"):
            self.assertNotIn(unsafe, sql)


if __name__ == "__main__":
    unittest.main()
