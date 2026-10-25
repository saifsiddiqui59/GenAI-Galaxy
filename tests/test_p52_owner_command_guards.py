"""Source-only safety test for owner's exact-main GitHub dispatch bridge."""
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
BRIDGE=ROOT/".github/workflows/galaxy-ai-owner-command.yml"


class OwnerCommandGuard(unittest.TestCase):
    def test_no_push_pr_schedule_or_automatic_cloud_deploy(self):
        text=BRIDGE.read_text()
        self.assertIn("  issue_comment:",text)
        for phrase in ("  workflow_dispatch:","  push:","  pull_request:","  schedule:"):
            self.assertNotIn(phrase,text)
        self.assertIn("github.event.comment.user.id == 80577424",text)
        self.assertIn("github.event.issue.number == 183",text)
        self.assertIn("github.event.issue.pull_request == null",text)
        self.assertIn("github.actor == 'saifsiddiqui59'",text)
        self.assertIn('[[ "$current" == "$EVENT_SHA" ]]',text)
        self.assertIn('[[ "$success" =~ ^[0-9]+$ && "$success" -gt 0 ]]',text)

    def test_dispatch_only_preexisting_manual_approved_workflows(self):
        text=BRIDGE.read_text()
        self.assertEqual(text.count("gh workflow run "),15)
        self.assertIn("galaxy-p3-flex-deploy.yml",text)
        self.assertIn("galaxy-ephemeral-rls.yml",text)
        self.assertIn("galaxy-ai-readonly-release-smoke.yml",text)
        self.assertIn("galaxy-ai-preview-p53.yml",text)
        self.assertIn("galaxy-ai-runtime-diagnostics.yml",text)
        self.assertIn("galaxy-p57-flex-memory.yml",text)
        self.assertIn("--ref main -f confirm=DEPLOY",text)
        self.assertIn("--ref main -f confirm=TEST",text)
        self.assertIn("--ref main -f confirm=READONLY",text)
        self.assertIn("--ref main -f confirm=PREVIEW",text)
        self.assertIn("--ref main -f confirm=DIAGNOSE",text)
        self.assertIn("--ref main -f confirm=SCALE_2048",text)
        self.assertIn("--ref main -f confirm=ROLLBACK_512",text)
        self.assertIn("galaxy-ephemeral-live-ai.yml",text)
        self.assertIn('"TEST_AI_ONE_$EVENT_SHA"',text)
        self.assertIn('"DIAG_COLDSTART_$EVENT_SHA"',text)
        self.assertIn('"DIAG_HTTP_PHASES_$EVENT_SHA"',text)
        self.assertIn('"DIAG_LONG_NOCHARGE_$EVENT_SHA"',text)
        self.assertIn('"RESTART_ONCE_$EVENT_SHA"',text)
        self.assertIn('"TEST_WARM_THEN_TUTOR_$EVENT_SHA"',text)
        self.assertIn('"METRICS_P70_$EVENT_SHA"',text)
        self.assertIn("galaxy-p71-instance-metrics.yml",text)
        self.assertIn("galaxy-p70-warm-sequence.yml",text)
        self.assertIn('galaxy-p68-one-time-restart.yml',text)
        self.assertIn("galaxy-p66-long-anonymous.yml",text)
        self.assertIn("galaxy-p65-http-phase-readonly.yml",text)
        self.assertIn('galaxy-p63-coldstart-nocharge.yml',text)
        self.assertIn('"PREVIEW_AI_P61_$EVENT_SHA"',text)
        self.assertIn('"$healthy" -ge 2',text)
        self.assertIn('galaxy-ai-preview-p61.yml',text)
        self.assertNotIn("galaxy-p3-model-provision.yml",text)
        self.assertNotIn("galaxy-p3-flex-provision.yml",text)
        self.assertNotIn("az login",text)
        self.assertNotIn("az functionapp",text)
        self.assertNotIn("secrets.",text)

    def test_manual_workflows_keep_explicit_confirm_and_protected_environment(self):
        for filename, confirmation in (
            ("galaxy-p3-flex-deploy.yml","DEPLOY"),
            ("galaxy-ephemeral-rls.yml","TEST"),
        ):
            with self.subTest(workflow=filename):
                flow=(ROOT/".github/workflows"/filename).read_text()
                self.assertIn("workflow_dispatch:",flow)
                self.assertIn("environment: dev",flow)
                self.assertIn("inputs.confirm",flow)
                self.assertIn(confirmation,flow)


if __name__=="__main__":
    unittest.main()
