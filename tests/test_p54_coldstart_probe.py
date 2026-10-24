"""P54: bound unauthenticated hosted probe while allowing Flex cold starts."""
import pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class ColdstartProbeGuard(unittest.TestCase):
    def test_bounded_no_model_only(self):
        s=(ROOT/"scripts/verify_ai_hosted_nocharge.py").read_text()
        workflow=(ROOT/".github/workflows/galaxy-ai-readonly-release-smoke.yml").read_text()
        self.assertIn("opener.open(req, timeout=40)",s)
        self.assertIn("timeout-minutes: 8",workflow)
        self.assertIn('method not in ("OPTIONS", "POST")',s)
        self.assertIn('no JWT, quota reservation or model call',s)
        self.assertNotIn("Authorization",s)
        self.assertNotIn("secrets.",workflow)
        self.assertIn("workflow_dispatch:",workflow)
        self.assertNotIn("  push:",workflow)
        self.assertNotIn("  pull_request:",workflow)
if __name__=="__main__":unittest.main()
