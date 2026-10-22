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

    def test_source_remains_distinct_from_retail_project(self):
        self.assertTrue((ROOT / 'V3_REFERENCE.html').is_file())
        self.assertTrue((ROOT / 'data/curriculum.json').is_file())
        self.assertTrue((ROOT / 'docs/GITHUB_WORKFLOW.md').is_file())
        self.assertTrue((ROOT / 'docs/INTERFACES_V1.md').is_file())


if __name__ == '__main__':
    unittest.main()
