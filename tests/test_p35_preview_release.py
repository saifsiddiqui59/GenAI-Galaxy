from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class V6ReleaseBoundaryTests(unittest.TestCase):
 def test_pinned_source_owner_command_and_existing_only_destination(self):
  text=(ROOT/'.github/workflows/galaxy-p35-v6-preview.yml').read_text()
  for required in ('6614f7903c52b81f471083321a49f8870b5becdc','80577424','issue.number == 131',
                   'environment: dev','gengalaxy1429841605','previews/galaxy-3d-v6',
                   '--destination-path "$PREFIX"','--name "$PREFIX/$file"','persist-credentials: false'):
   self.assertIn(required,text)
  events=text.split('permissions:')[0]
  self.assertNotIn('push:',events);self.assertNotIn('pull_request:',events)
  for forbidden in ('az group create','az storage account create','az role assignment create','--account-key','--destination-path previews/galaxy-3d-v5'):
   self.assertNotIn(forbidden,text)
 def test_actual_source_ci_content_parity_and_hosted_acceptance_are_required(self):
  text=(ROOT/'.github/workflows/galaxy-p35-v6-preview.yml').read_text()
  for required in ('needs: source-ci',"jobs.get(name)=='success'",'Hosted SHA mismatch','homepage-before.sha256','homepage-after.sha256','cmp ',
                   'source/tests/p35_v6_browser.py','galaxy-v6-hosted-evidence'):
   self.assertIn(required,text)
if __name__=='__main__':unittest.main()
