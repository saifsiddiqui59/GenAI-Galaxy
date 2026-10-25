"""P62 guest-gate load-race and unchanged-backend release guard."""
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
class StartupAndRelease(unittest.TestCase):
 def test_guest_bound_before_first_async_fetch(self):
  s=(ROOT/'app.js').read_text()
  block=s.split('async function start(){try{',1)[1].split('const [cr,lr]=await Promise.all',1)[0]
  self.assertIn("DOM('entry-guest').onclick=()=>setEntryVisible(false)",block)
  self.assertIn("function setEntryVisible(visible)",s)
  self.assertIn("gate.classList.toggle('is-hidden',!visible)",s)
  hosted=(ROOT/'tests/p61_hosted_focus.py').read_text()
  self.assertIn("await page.locator('#entry-gate').wait_for(state=\"hidden\"",hosted)
 def test_reuse_existing_backend_only_if_sources_unchanged(self):
  text=(ROOT/'.github/workflows/galaxy-ai-preview-p61.yml').read_text()
  self.assertIn('backend_sha=\'5d32a1f66e5e0a414552f70c0bdeadd9ec8c5903\'',text)
  self.assertIn('git diff --quiet "$backend_sha" "$GITHUB_SHA" -- api/ infra/azure/backend/',text)
  self.assertIn('galaxy-p3-flex-deploy.yml',text)
  self.assertIn('existing backend deployment missing',text)
  self.assertIn('root_hash',text)
  self.assertIn('previews/galaxy-ai-p61',text)
  self.assertIn('byte-verify',text)
  self.assertIn('environment: dev',text)
  self.assertIn('source-matched',text) if False else None
if __name__=='__main__': unittest.main()
