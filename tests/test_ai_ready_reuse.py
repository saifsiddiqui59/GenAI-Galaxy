"""No-spend static redeploy security contract: prior model proof is not a loophole."""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]


class FrontendOnlyAIReadyTests(unittest.TestCase):
    def test_reuse_immutable_real_hosted_smoke_without_billing(self):
        wf=(ROOT/'.github/workflows/galaxy-static-deploy.yml').read_text()
        self.assertIn('SMOKE_SHA="c12625931e99b8b00ffe6677f718fe263b1f1000"',wf)
        self.assertIn('--workflow galaxy-ephemeral-live-ai.yml',wf)
        self.assertIn('--json conclusion,headSha',wf)
        self.assertIn('select(.conclusion ==',wf)
        self.assertIn('git diff --name-only "$SMOKE_SHA" "$RELEASE_SHA"',wf)
        self.assertIn('fetch-depth: 0',wf)
        self.assertIn('app.js|docs/*|tests/*|.github/workflows/galaxy-static-deploy.yml',wf)
        self.assertIn('Unverified change since tested backend',wf)
        self.assertIn("inputs.enable_evaluator == 'AI_READY'",wf)
        # This workflow can *only* upload static assets to preexisting Galaxy Blob.
        self.assertNotIn('az cognitiveservices account create',wf)
        self.assertNotIn('az functionapp create',wf)
        self.assertNotIn('gh workflow run',wf)
        self.assertNotIn('GALAXY_RUN_AI_SMOKE',wf)
        self.assertNotIn('az storage account create',wf)

    def test_ui_requires_explicit_user_action_and_shows_local_reason(self):
        js=(ROOT/'app.js').read_text()
        self.assertIn("function modelAvailability()",js)
        self.assertIn("function modelFailureMessage(status)",js)
        self.assertIn("Local check (free)",js)
        self.assertIn("localReason",js)
        self.assertIn("role=\"status\"",js)
        self.assertIn("async function submitAnswer(e,localOnly=false)",js)


if __name__=="__main__": unittest.main()
