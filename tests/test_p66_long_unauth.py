"""P66 diagnostic correctness: Azure platform CORS 204 is valid, JWT never used."""
import pathlib
import sys
import unittest
from types import SimpleNamespace

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import diagnose_http_phases_nocharge as phases
import diagnose_long_unauth_nocharge as prolonged

class LongNoChargeTests(unittest.TestCase):
    def test_204_platform_cors_preflight_is_success(self):
        def ok(cmd,**kw):
            return SimpleNamespace(returncode=0,stdout='{"code":"204","dns":"0.01","tcp":"0.1","tls":"0.4","ttfb":"0.6","total":"0.6"}',stderr="")
        value=phases.sample(phases.PATHS[1],"OPTIONS",30,runner=ok)
        self.assertTrue(value["passed"])
        self.assertEqual(value["expected"],"200/204")
    def test_long_probe_has_bounded_denied_post_without_retry(self):
        calls=[]
        def stub(path,method,timeout):
            calls.append((path,method,timeout))
            return {"passed":True}
        self.assertEqual(prolonged.run(stub),0)
        self.assertEqual(len(calls),4)
        self.assertEqual(calls,[ (phases.PATHS[0],"OPTIONS",30),
                               (phases.PATHS[0],"POST",100),
                               (phases.PATHS[1],"POST",100),
                               (phases.PATHS[1],"OPTIONS",30) ])
        for _,method,limit in calls:
            self.assertLessEqual(limit,100)
            self.assertIn(method,("OPTIONS","POST"))
    def test_manual_only_and_no_identity(self):
        wf=(ROOT/".github/workflows/galaxy-p66-long-anonymous.yml").read_text()
        py=(ROOT/"scripts/diagnose_long_unauth_nocharge.py").read_text()
        self.assertIn("workflow_dispatch:",wf)
        for forbidden in ("  push:","  pull_request:","  schedule:","azure/login","secrets.",
                          "az functionapp","--always-ready","api-key"):
            self.assertNotIn(forbidden,wf)
        for forbidden in ("Authorization","Bearer ","token=","max_tokens","for _ in range"):
            self.assertNotIn(forbidden,py)
    def test_correct_platform_metric_names(self):
        wf=(ROOT/".github/workflows/galaxy-p65-http-phase-readonly.yml").read_text()
        self.assertIn("--metric OnDemandFunctionExecutionCount",wf)
        self.assertNotIn("--metric Requests,Http5xx",wf)
        self.assertIn("az functionapp cors show",wf)

if __name__=="__main__":unittest.main()
