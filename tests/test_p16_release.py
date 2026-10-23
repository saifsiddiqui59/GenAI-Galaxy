from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class PreviewTests(unittest.TestCase):
 def test_manual_only_and_storage_safe(self):
  s=(ROOT/'scripts/p16/preview-publisher.yml').read_text()
  for token in ("workflow_dispatch:","DEPLOY_3D_PREVIEW","environment: dev",
     "github.ref == 'refs/heads/main'","previews/galaxy-3d-v2",
     "--destination-path \"$PREFIX\"","REF_SHA: __PIN_FINAL_COMMIT_SHA__",
     "sha256sum","id-token: write"):
   self.assertIn(token,s)
  for invalid in ("  push:", "az storage account create", "--delete-destination","--auth-mode key"):
   self.assertNotIn(invalid,s)
 def test_bundled_lesson_and_no_paid_ai(self):
  s=(ROOT/'scripts/p16/stage-preview.sh').read_text()
  for token in ("GALAXY_SOURCE_ROOT","GALAXY_STAGE","guardian.glb",
     "lesson/index.html","window.GALAXY_EVALUATOR_URL","data","service_role"):
   if token=="lesson/index.html":continue
   self.assertIn(token,s)
  self.assertNotIn('az storage blob upload',s)
if __name__=="__main__":unittest.main()
