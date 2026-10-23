"""Offline invariants for isolated, manually approved Galaxy Azure OpenAI provisioning."""
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class GalaxyModelProvisionPolicyTests(unittest.TestCase):
    def test_provision_is_manual_azure_oidc_not_on_push(self):
        wf = (ROOT / '.github/workflows/galaxy-p3-model-provision.yml').read_text()
        self.assertIn('workflow_dispatch:',wf)
        self.assertIn("inputs.confirm == 'PROVISION_MODEL'",wf)
        self.assertIn('environment: dev',wf)
        self.assertIn('azure/login@v3',wf)
        self.assertIn('id-token: write',wf)
        self.assertNotIn('  push:',wf)
        self.assertNotIn('pull_request:',wf)
        self.assertNotIn('publish-profile:',wf)
        self.assertNotIn('service_role',wf)

    def test_resource_is_pinned_to_galaxy_India_and_pay_per_use(self):
        shell = (ROOT / 'scripts/provision_galaxy_openai.sh').read_text()
        for expected in (
           "RG='GenAI_Galaxy'",
           "NAME='gengalaxy-ai-sin-1429841605'",
           "REGION='southindia'",
           "DEPLOY='galaxy-gpt-41-mini'",
           "MODEL='gpt-4.1-mini'",
           "VERSION='2025-04-14'",
           "SKU='Standard'",
           "kind OpenAI", "--kind OpenAI --sku S0",
           '--sku-name "$SKU"',
           '--model-version "$VERSION"',
           'if [[ -z "$existing" ]]',
           'if [[ -z "$deployment" ]]',
           'region',
           'account_sku'
        ):
            self.assertIn(expected,shell)
        for unsafe in ('--sku-name GlobalStandard', '--sku-name ProvisionedManaged', 'PTU --', 'az group create',
                       'wineshopPOS', 'WineShopPOS', 'az account keys', 'keys list'):
            self.assertNotIn(unsafe,shell)
        subprocess.run(['bash','-n',str(ROOT/'scripts/provision_galaxy_openai.sh')],check=True)

    def test_backend_discovers_model_and_key_only_through_azure_oidc(self):
        deploy=(ROOT/'.github/workflows/galaxy-p3-flex-deploy.yml').read_text()
        for expected in ("gengalaxy-ai-sin-1429841605", "galaxy-gpt-41-mini",
            'az cognitiveservices account show',
            'az cognitiveservices account deployment show',
            'az cognitiveservices account keys list',
            'AZURE_OPENAI_ENDPOINT="$OPENAI_ENDPOINT"',
            'AZURE_OPENAI_DEPLOYMENT="$llm_deploy"',
            'AZURE_OPENAI_API_KEY="$OPENAI_API_KEY"',
            'unset OPENAI_API_KEY',
            'GALAXY_BACKEND_PROFILE=direct-consumption'):
            self.assertIn(expected,deploy)
        for disallowed in ('secrets.GALAXY_AZURE_OPENAI_ENDPOINT',
                           'secrets.GALAXY_AZURE_OPENAI_DEPLOYMENT',
                           'secrets.GALAXY_AZURE_OPENAI_API_KEY',
                           'echo "$OPENAI_API_KEY"', 'az cognitiveservices account create'):
            self.assertNotIn(disallowed,deploy)

    def test_one_shot_creates_model_before_deploy_without_key_prompt(self):
        script=(ROOT/'scripts/galaxy_p3_one_shot.sh').read_text()
        workflow_order=(
            'galaxy-ephemeral-rls.yml',
            'galaxy-p3-model-provision.yml',
            'galaxy-p3-flex-provision.yml',
            'galaxy-p3-flex-deploy.yml',
            'galaxy-ephemeral-live-ai.yml',
            'galaxy-static-deploy.yml'
        )
        positions=[script.index('run_workflow '+name) for name in workflow_order]
        self.assertEqual(positions,sorted(positions))
        for old_prompt in ('ensure_secret GALAXY_AZURE_OPENAI_ENDPOINT',
                           'ensure_secret GALAXY_AZURE_OPENAI_DEPLOYMENT',
                           'ensure_secret GALAXY_AZURE_OPENAI_API_KEY'):
            self.assertNotIn(old_prompt,script)
        self.assertIn('gh run watch',script)
        subprocess.run(['bash','-n',str(ROOT/'scripts/galaxy_p3_one_shot.sh')],check=True)

if __name__=='__main__':
    unittest.main()
