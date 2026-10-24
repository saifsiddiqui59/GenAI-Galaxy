"""Synthetic no-network contract for the optional hosted AI preflight."""
import pathlib
import sys
import unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from verify_ai_hosted_nocharge import HOST, ORIGIN, ROUTES, evaluate_probe, request_once


class ReadonlyAIProbeTests(unittest.TestCase):
    def test_accepts_all_positive_expected_controls(self):
        calls = []
        def probe(url, method, origin):
            calls.append((url,method,origin))
            code = 200 if method=="OPTIONS" and origin==ORIGIN else (
                   403 if method=="OPTIONS" else 401)
            headers = {"Access-Control-Allow-Origin": ORIGIN} if origin==ORIGIN else {}
            return code, headers
        self.assertEqual(evaluate_probe(probe), [])
        self.assertEqual(len(calls), 6)
        self.assertTrue(all(url.startswith(HOST+"/api/") for url,_,_ in calls))
        self.assertTrue(all(method=="OPTIONS" or method=="POST" for _,method,_ in calls))

    def test_any_public_ai_response_is_a_release_failure(self):
        def probe(url, method, origin):
            code = 200 if method in ("OPTIONS","POST") and origin==ORIGIN else 403
            return code, ({"Access-Control-Allow-Origin":ORIGIN} if origin==ORIGIN else {})
        failures = evaluate_probe(probe)
        self.assertEqual(len(failures), 2)
        self.assertTrue(all("expected 401" in s for s in failures))

    def test_wide_open_cors_is_rejected(self):
        def probe(url, method, origin):
            code = 200 if method=="OPTIONS" and origin==ORIGIN else (
                   403 if method=="OPTIONS" else 401)
            return code, {"Access-Control-Allow-Origin":"*"}
        failures = evaluate_probe(probe)
        self.assertEqual(len(failures), 6)
        self.assertTrue(any("untrusted origin" in s for s in failures))

    def test_connection_failure_is_not_pass(self):
        def probe(*args):
            raise OSError("network unavailable")
        self.assertEqual(len(evaluate_probe(probe)),6)

    def test_never_follow_arbitrary_urls(self):
        for url in ("http://"+HOST[8:]+"/api/"+ROUTES[0],
                    "https://evil.example/api/"+ROUTES[0],
                    HOST+"/api/vault/extract"):
            with self.subTest(url=url),self.assertRaises(ValueError):
                request_once(url,"POST",ORIGIN)
        with self.assertRaises(ValueError):
            request_once(HOST+"/api/"+ROUTES[0],"GET",ORIGIN)

    def test_manual_only_trigger_and_no_provider_secrets(self):
        workflow=(ROOT/".github/workflows/galaxy-ai-readonly-release-smoke.yml").read_text()
        self.assertIn("workflow_dispatch:",workflow)
        self.assertNotIn("pull_request:",workflow)
        self.assertNotIn("  push:",workflow)
        self.assertIn("READONLY",workflow)
        self.assertNotIn("secrets.",workflow)
        script=(ROOT/"scripts/verify_ai_hosted_nocharge.py").read_text()
        self.assertNotIn("Authorization",script)
        self.assertNotIn("api-key",script)


if __name__=="__main__":
    unittest.main()
