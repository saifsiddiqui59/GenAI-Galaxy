"""P70: post warm-up is not a fake OPTIONS-only readiness check."""
import pathlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import p70_warm_then_tutor_nocharge as p

class OrderedNoModelWarmup(unittest.TestCase):
 def test_sequence_real_worker_then_tutor_then_same_tutor(self):
  paths=[]
  def success(path,method,seconds):
   paths.append((path,method,seconds))
   return {'passed':True,'http_code':'401','app_trace_present':True,
           'ttfb_s':1,'total_s':1,'tls_s':0.2,'azure_peer':'20.192.171.0'}
  self.assertEqual(p.run(success),0)
  self.assertEqual(paths,list((path,method,timeout) for _,path,method,timeout in p.CASES))
  self.assertEqual(len(paths),4)
  self.assertTrue(all(method=='POST' for _,method,_ in paths))
  self.assertEqual(paths[1][0],paths[2][0])
  self.assertNotEqual(paths[0][0],paths[1][0])
 def test_platform_503_and_absent_trace_cannot_pass_after_warmup(self):
  count=[0]
  def bogus(path,method,seconds):
   count[0]+=1
   if count[0]==2: return {'passed':False,'http_code':'503','app_trace_present':False,'total_s':60.9}
   return {'passed':True,'http_code':'401','app_trace_present':True}
  self.assertEqual(p.run(bogus),1)
  self.assertEqual(count[0],4)
 def test_cors_platform_204_is_not_function_warmth(self):
  def options(path,method,seconds):
   return {'passed':True,'http_code':'204','app_trace_present':False}
  self.assertEqual(p.run(options),1)
 def test_manual_only_and_no_provider(self):
  wf=(ROOT/'.github/workflows/galaxy-p70-warm-sequence.yml').read_text()
  script=(ROOT/'scripts/p70_warm_then_tutor_nocharge.py').read_text()
  self.assertIn('workflow_dispatch:',wf)
  self.assertIn('github.ref == \'refs/heads/main\'',wf)
  self.assertIn('timeout-minutes: 9',wf)
  for banned in ('  push:','  pull_request:','  schedule:','secrets.','azure/login',
                 'functionapp create','always-ready','az functionapp','GALAXY_OPENAI_API_KEY'):
   self.assertNotIn(banned,wf)
  for banned in ('Authorization','Bearer ','api-key','chat/completions','for _ in range'):
   self.assertNotIn(banned,script)
if __name__=='__main__':unittest.main()
