"""P76 Python health endpoint safety/contract — no live network or paid requests."""
import ast
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=(ROOT/"api/function_app.py").read_text(encoding="utf-8")

class NoModelHealthTests(unittest.TestCase):
    def test_liveness_is_independent_of_identity_quota_and_models(self):
        module=ast.parse(SRC)
        health=next((x for x in module.body if isinstance(x,ast.FunctionDef)
                     and x.name=="health"),None)
        self.assertIsNotNone(health)
        body=ast.get_source_segment(SRC,health)
        for forbidden in ("authenticate(", "request_json(", "RUBRICS[",
                          "enforce_eval_quota(", "chat_json(", "invoke_tutor(",
                          "os.environ", "SUPABASE", "model_review(", "tutor_model_response("):
            self.assertNotIn(forbidden,body)
        self.assertIn("trace_id=new_trace_id()",body)
        self.assertIn("'model_called':False",body)
        self.assertIn("make_response(req,",body)
        self.assertIn("200,trace_id=trace_id",body)
        route=next((x for x in health.decorator_list if isinstance(x,ast.Call)
                    and isinstance(x.func,ast.Attribute) and x.func.attr=="route"),None)
        self.assertIsNotNone(route)
        kws={x.arg:ast.literal_eval(x.value) for x in route.keywords}
        self.assertEqual(kws["route"],"health")
        self.assertEqual(kws["methods"],["GET"])
        self.assertLess(SRC.index("def health("),SRC.index("def evaluate("))

    def test_no_cloud_mutation_or_new_idle_capacity(self):
        self.assertNotIn("StreamingResponse",SRC)
        self.assertNotIn("PYTHON_ENABLE_INIT_INDEXING",SRC)
        self.assertNotIn("alwaysReady", SRC)
        workflow=(ROOT/".github/workflows/galaxy-ai-runtime-diagnostics.yml").read_text()
        self.assertIn("/api/health",workflow)
        self.assertIn("X-Galaxy-Trace-Id",workflow)
        self.assertNotIn("openai/deployments",workflow)
if __name__=="__main__":
    unittest.main()
