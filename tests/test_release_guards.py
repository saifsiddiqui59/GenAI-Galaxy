"""Cheap, intentionally narrow source-security invariants for pull requests.

Not a substitute for secret scanning, hosted negative-tenant tests, or code review.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ReleaseGuardTests(unittest.TestCase):
    def test_git_handoff_restricted_to_galaxy(self):
        script = (ROOT / 'scripts/publish_github.sh').read_text()
        self.assertIn("REPOSITORY='saifsiddiqui59/GenAI-Galaxy'", script)
        self.assertIn("[[ \"$privacy\" == true ]]", script)
        self.assertIn('Wrong GitHub account', script)
        self.assertIn('Refusing unexpected origin', script)
        self.assertNotIn('RetailGrowthAI.git', script)
        self.assertNotIn('WineShopPOS.git', script)
        self.assertNotIn('gh pr merge', script)
        self.assertIn('chore/m5-azure-actions', script)
        self.assertNotIn('--admin', script)

    def test_ci_read_only_and_not_deploying(self):
        workflow = (ROOT / '.github/workflows/galaxy-ci.yml').read_text()
        self.assertIn('contents: read', workflow)
        self.assertNotIn('pull_request_target:', workflow)
        self.assertNotIn('azure/login', workflow)
        self.assertNotIn('az storage blob upload', workflow)
        self.assertNotIn('secrets.', workflow)
        self.assertIn('timeout-minutes:', workflow)
        self.assertIn('cancel-in-progress: true', workflow)

    def test_static_config_is_public_endpoints_only(self):
        config = (ROOT / 'runtime-config.js').read_text()
        js = (ROOT / 'index.html').read_text()
        self.assertIn('runtime-config.js', js)
        self.assertNotRegex(config, re.compile(r'\b(?:service_role|subscription[_-]?key|api[_-]?key|secret[_-]?key)\b\s*=', re.I))
        for key in ('GALAXY_EVALUATOR_URL', 'GALAXY_VAULT_EXTRACT_URL', 'GALAXY_SPEECH_BROKER_URL'):
            self.assertRegex(config, r'window\.' + key + r"\s*=\s*''")
        deploy = (ROOT / 'scripts/deploy_azure_static.sh').read_text()
        self.assertIn('runtime-config.js /tmp/genai-galaxy-static/', deploy)
        self.assertIn('--approve-provisioning', deploy)

    def test_azure_verification_is_manually_triggered_and_read_only(self):
        wf = (ROOT / '.github/workflows/galaxy-azure-verify.yml').read_text()
        self.assertIn('workflow_dispatch:', wf)
        self.assertNotIn('pull_request:', wf)
        self.assertNotIn('  push:', wf)
        self.assertIn("github.ref == 'refs/heads/main'", wf)
        self.assertIn("github.repository == 'saifsiddiqui59/GenAI-Galaxy'", wf)
        self.assertIn('environment: dev', wf)
        self.assertIn('id-token: write', wf)
        self.assertIn('azure/login@v3', wf)
        self.assertIn('GALAXY_AZ_RG: GenAI_Galaxy', wf)
        self.assertIn('GALAXY_APP_NAME: GenAI_Galaxy', wf)
        for forbidden in ('az group create', 'az storage account create', 'az storage blob upload', 'AZURE_CLIENT_SECRET'):
            self.assertNotIn(forbidden, wf)

    def test_deploy_requires_main_manual_ack_and_verified_existing_website(self):
        wf = (ROOT / '.github/workflows/galaxy-static-deploy.yml').read_text()
        deploy = (ROOT / 'scripts/deploy_existing_static.sh').read_text()
        self.assertIn('workflow_dispatch:', wf)
        self.assertNotIn('pull_request:', wf)
        self.assertNotIn('  push:', wf)
        self.assertIn("inputs.confirm_deploy == 'DEPLOY'", wf)
        self.assertIn("github.ref == 'refs/heads/main'", wf)
        self.assertIn('environment: dev', wf)
        self.assertIn('GALAXY_AZ_RG: GenAI_Galaxy', wf)
        self.assertIn('GALAXY_AZ_STORAGE: ${{ vars.GALAXY_STORAGE_ACCOUNT }}', wf)
        self.assertIn('needs: validate', wf)
        self.assertIn("'$web'", deploy)
        self.assertIn('staticWebsite.enabled', deploy)
        self.assertIn('resourceGroups/', deploy)
        self.assertIn('runtime-config.js', deploy)
        self.assertIn('az storage blob upload-batch', deploy)
        self.assertIn('az storage account blob-service-properties show', deploy)
        self.assertIn('az storage container show', deploy)
        self.assertIn('Pin OIDC credential to approved Galaxy service principal', wf)
        self.assertIn('737d67b7-4984-48bb-bb1f-5f62599f645c', wf)
        for forbidden in ('az group create', 'az storage account create', '--auth-mode key'):
            self.assertNotIn(forbidden, wf)
            self.assertNotIn(forbidden, deploy)
        self.assertNotIn('AZURE_CLIENT_SECRET=', wf)
        self.assertNotIn('AZURE_CLIENT_SECRET=', deploy)

    def test_public_runtime_has_no_known_credential_shapes(self):
        # Narrow static check: does not scan Git history or detect all secret types.
        public = [
            ROOT / 'runtime-config.js', ROOT / 'app.js', ROOT / 'index.html',
            ROOT / 'speech/azure-speech-adapter.js', ROOT / 'styles.css',
            ROOT / 'genie/guide.js',
            ROOT / 'genie/progress/story.js', ROOT / 'genie/effects/cosmic-polish.js',
            ROOT / 'genie/effects/cosmic-polish.css', ROOT / 'galaxy/handoff/planet-flight.js',
            ROOT / 'galaxy/handoff/planet-flight.css',
        ]
        credential_shapes = (
            r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
            r'ghp_[A-Za-z0-9]{36}',
            r'sb_secret_[A-Za-z0-9_-]{16,}',
            r'sk-proj-[A-Za-z0-9_-]{20,}',
            r'AKIA[0-9A-Z]{16}',
        )
        for file in public:
            content = file.read_text()
            for shape in credential_shapes:
                with self.subTest(file=str(file.relative_to(ROOT)), shape=shape):
                    self.assertIsNone(re.search(shape, content))

    def test_live_browser_acceptance_rejects_stale_deploys(self):
        hosted_test = (ROOT / 'tests/live_site_browser_check.py').read_text()
        self.assertIn('verify_public_asset(path, downloaded, local)', hosted_test)
        policy = (ROOT / 'tests/public_asset_policy.py').read_text()
        self.assertIn('sha256(downloaded).digest() == sha256(local).digest()', policy)
        self.assertIn('hosted_text == expected', policy)
        self.assertIn('assert len(hosted_lessons) == 245', hosted_test)
        self.assertIn('assert mapped == 246', hosted_test)
        self.assertIn('PUBLIC_ASSETS', hosted_test)

    def test_no_private_documents_or_live_local_settings_in_checkout(self):
        forbidden = [
            ROOT / '.env', ROOT / '.env.production', ROOT / 'api/local.settings.json',
            ROOT / 'private_key.pem', ROOT / 'resume.pdf', ROOT / 'secrets.json',
        ]
        for path in forbidden:
            with self.subTest(name=path.name):
                self.assertFalse(path.exists(), 'Sensitive file must not ship in public repo')

    def test_source_remains_distinct_from_retail_project(self):
        self.assertTrue((ROOT / 'V3_REFERENCE.html').is_file())
        self.assertTrue((ROOT / 'data/curriculum.json').is_file())
        self.assertTrue((ROOT / 'docs/GITHUB_WORKFLOW.md').is_file())
        self.assertTrue((ROOT / 'docs/INTERFACES_V1.md').is_file())


if __name__ == '__main__':
    unittest.main()
