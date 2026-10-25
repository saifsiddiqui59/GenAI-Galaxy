"""P63: don't accidentally turn cold-start probes into model calls or paid keep-alive."""
import pathlib
import sys
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import diagnose_flex_nocharge_latency as p

class ColdStartTests(unittest.TestCase):
 def test_allowed_routes_and_expected_status_without_retry(self):
  seen=[]
  def fake(path,method,timeout):
   seen.append((path,method,timeout))
   return (200 if method=="OPTIONS" else 401,
           {"Access-Control-Allow-Origin":p.ORIGIN},0.4)
  self.assertEqual(p.run_once(fake),[])
  self.assertEqual(len(seen),6)
  self.assertEqual(seen[0][2],120)
  self.assertTrue(all(t==40 for _,_,t in seen[1:]))
  self.assertTrue(all(x[0] in p.PATHS for x in seen))
 def test_bad_route_method_timeout_rejected(self):
  for path,method,timeout in ((p.PATHS[0],"GET",40),("/api/vault/extract","POST",40),
                              (p.PATHS[0],"POST",360)):
   with self.assertRaises(ValueError):p.probe(path,method,timeout)
 def test_runtime_failure_remains_failure(self):
  def fake(path,method,timeout):
   if method=="POST":raise TimeoutError("no HTTP bytes")
   return (200,{"Access-Control-Allow-Origin":p.ORIGIN},1)
  self.assertEqual(len(p.run_once(fake)),2)
 def test_manual_only_no_idle_no_paid(self):
  flow=(ROOT/".github/workflows/galaxy-p63-coldstart-nocharge.yml").read_text()
  script=(ROOT/"scripts/diagnose_flex_nocharge_latency.py").read_text()
  self.assertIn("workflow_dispatch:",flow)
  for bad in ("  push:","  pull_request:","  schedule:","secrets.","azure/login"):
   self.assertNotIn(bad,flow)
  for forbidden in ("Authorization","AZURE_OPENAI_API_KEY","alwaysReady","/chat/completions"):
   self.assertNotIn(forbidden,script)
if __name__=="__main__":unittest.main()
