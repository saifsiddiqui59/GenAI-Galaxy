"""P65 no-secret, no-paid Azure diagnostic contract."""
import pathlib
import sys
import unittest
from types import SimpleNamespace

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import diagnose_http_phases_nocharge as h

class PhaseProbeSafety(unittest.TestCase):
    def test_exact_allowlist_and_browser_preflight(self):
        command=h.build_command(h.PATHS[1],"OPTIONS",20)
        joined=" ".join(command)
        self.assertIn("Access-Control-Request-Method: POST",joined)
        self.assertIn("Access-Control-Request-Headers: authorization, content-type",joined)
        self.assertIn("--connect-timeout 8",joined)
        self.assertNotIn("--location ",joined)
        self.assertNotIn("--location-trusted ",joined)
        self.assertNotIn("Bearer",joined)
        self.assertNotIn("api-key",joined.lower())
        for path,method,timeout in (("/api/private","POST",20),
                                     (h.PATHS[0],"GET",20),
                                     (h.PATHS[0],"POST",300)):
            with self.assertRaises(ValueError):
                h.build_command(path,method,timeout)
    def test_fake_curl_metrics_and_no_headers_or_body_logged(self):
        data='{"code":"401","dns":"0.021","tcp":"0.083","tls":"0.137","ttfb":"0.72","total":"0.723","ip":"1.2.3.4","http_ver":"1.1"}'
        def fake(command,**kwargs):
            self.assertTrue(kwargs['capture_output'])
            return SimpleNamespace(returncode=0,stdout=data,stderr="SENSITIVE")
        result=h.sample(h.PATHS[0],"POST",20,runner=fake)
        self.assertTrue(result['passed'])
        self.assertEqual(result['ttfb_s'],0.72)
        self.assertEqual(result['azure_peer'],"1.2.3.4")
        self.assertNotIn("SENSITIVE",str(result))
    def test_timeout_can_never_pass(self):
        def fake(command,**kwargs):
            return SimpleNamespace(returncode=28,stdout='{"code":"000","dns":"0.03","tcp":"0.04","tls":"0.08","ttfb":"0","total":"20"}',stderr="FAIL")
        result=h.sample(h.PATHS[1],"OPTIONS",20,runner=fake)
        self.assertFalse(result['passed'])
        self.assertEqual(result['http_code'],"000")
        self.assertEqual(result["tls_s"],0.08)
        self.assertEqual(result["ttfb_s"],0)
    def test_one_coldstart_allowance_and_finite_series(self):
        items=list(h.cases())
        self.assertEqual(len(items),11)
        self.assertEqual(items[0],(h.PATHS[0],"OPTIONS",90))
        self.assertTrue(all(x[2]==20 for x in items[1:]))
        self.assertTrue(all(x[1] in ("OPTIONS","POST") for x in items))
    def test_manual_release_only_no_new_azure_resources(self):
        wf=(ROOT/".github/workflows/galaxy-p65-http-phase-readonly.yml").read_text()
        self.assertIn("workflow_dispatch:",wf)
        self.assertIn("environment: dev",wf)
        self.assertIn("az monitor metrics list",wf)
        self.assertIn("az resource show",wf)
        for name in ("  push:","  pull_request:","  schedule:","az functionapp create",
                     "az functionapp scale config set","--always-ready","az monitor log-analytics workspace create",
                     "GALAXY_OPENAI_KEY","gh workflow run"):
            self.assertNotIn(name,wf)
        app=(ROOT/"scripts/diagnose_http_phases_nocharge.py").read_text()
        for name in ("Authorization: Bearer","api-key:","/chat/completions"):
            self.assertNotIn(name,app)

if __name__ == "__main__":
    unittest.main()
