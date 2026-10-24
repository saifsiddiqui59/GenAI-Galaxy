"""New V6.1 review publisher cannot alter the old V6 or website root."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class ProtectedV61Publisher(unittest.TestCase):
 def test_only_owner_can_dispatch_validated_exact_source_to_isolated_prefix(self):
  workflow=(ROOT/'.github/workflows/galaxy-v61-protected-preview.yml').read_text()
  self.assertIn("github.event_name == 'workflow_dispatch'",workflow)
  self.assertIn("github.actor_id == '80577424'",workflow)
  self.assertIn("github.ref == 'refs/heads/main'",workflow)
  self.assertNotIn('issue_comment',workflow)
  self.assertIn('PUBLISH_V61_REVIEWED_430ec4e',workflow)
  sha='430ec4e131bd6490433b19a6e735ec4c896b2aa8'
  self.assertIn('REF_SHA: '+sha,workflow)
  self.assertIn("sha='"+sha+"'",workflow)
  self.assertIn('PREFIX: previews/galaxy-3d-v61',workflow)
  self.assertIn('GALAXY_V6_URL: https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-3d-v61/index.html?demo=1',workflow)
  self.assertIn('cmp "$RUNNER_TEMP/homepage-before.sha256" "$RUNNER_TEMP/homepage-after.sha256"',workflow)
  self.assertIn('hosted-sha256.txt',workflow)
  self.assertIn('No successful exact-source CI run',workflow)
  self.assertIn('id-token: write',workflow)
  self.assertIn('environment: dev',workflow)
  self.assertNotIn('--destination-path previews/galaxy-3d-v6 ',workflow)
  self.assertNotIn('az storage account create',workflow)
  self.assertNotIn('az group create',workflow)
if __name__=='__main__':unittest.main()
