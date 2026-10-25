"""P67: sanitize Azure 503 provenance, never emit raw headers."""
import pathlib
import sys
import unittest
from types import SimpleNamespace
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import diagnose_http_phases_nocharge as p

class OnlyOneSafeHeaderFlag(unittest.TestCase):
    def test_function_generated_401_is_detectable(self):
        def run(command,**kwargs):
            filename=command[command.index("--dump-header")+1]
            pathlib.Path(filename).write_text(
                "HTTP/1.1 401 Unauthorized\r\n"
                "X-Galaxy-Trace-Id: aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee\r\n"
                "Set-Cookie: SENSITIVE_DO_NOT_LOG\r\n")
            return SimpleNamespace(returncode=0,stdout='{"code":"401","dns":"0.02","tcp":"0.13","tls":"0.20","ttfb":"1","total":"1"}',stderr="SENSITIVE")
        result=p.sample(p.PATHS[1],"POST",20,runner=run)
        self.assertTrue(result["app_trace_present"])
        self.assertTrue(result["passed"])
        self.assertNotIn("SENSITIVE",str(result))
        self.assertNotIn("aaaa",str(result))
    def test_platform_503_has_no_application_trace(self):
        def run(command,**kwargs):
            filename=command[command.index("--dump-header")+1]
            pathlib.Path(filename).write_text("HTTP/1.1 503 Service Unavailable\r\nServer: azure\r\n")
            return SimpleNamespace(returncode=0,stdout='{"code":"503","dns":"0.02","tcp":"0.13","tls":"0.20","ttfb":"60.9","total":"60.9"}',stderr="")
        result=p.sample(p.PATHS[1],"POST",100,runner=run)
        self.assertFalse(result["app_trace_present"])
        self.assertFalse(result["passed"])
        self.assertEqual(result["http_code"],"503")
    def test_bad_trace_format_does_not_count(self):
        def run(command,**kwargs):
            filename=command[command.index("--dump-header")+1]
            pathlib.Path(filename).write_text("X-Galaxy-Trace-Id: malicious\r\n")
            return SimpleNamespace(returncode=28,stdout='{"code":"000","total":"20"}',stderr="")
        self.assertFalse(p.sample(p.PATHS[1],"POST",20,runner=run)["app_trace_present"])
if __name__=="__main__":unittest.main()
