"""P56: ensure Azure Function does not compile LangGraph on evaluation/OPTIONS imports."""
import ast
import pathlib
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
CODE=(ROOT/"api/function_app.py").read_text()
class LazyTutorColdstartRegression(unittest.TestCase):
    def test_no_eager_graph_import_in_function_worker_module(self):
        tree=ast.parse(CODE)
        for statement in tree.body:
            if isinstance(statement,ast.ImportFrom):
                self.assertNotEqual(statement.module,"tutor_graph")
            if isinstance(statement,ast.Import):
                self.assertNotIn("tutor_graph",[x.name for x in statement.names])
        tutor=next(node for node in tree.body
                   if isinstance(node,ast.FunctionDef) and node.name=="tutor")
        source=ast.get_source_segment(CODE,tutor)
        self.assertIn("from tutor_graph import invoke_tutor, validate_tutor_request, FREE_MODES",source)
        self.assertLess(source.index("authenticate(req)"),source.index("from tutor_graph import"))
        self.assertLess(source.index("pending=preflight(req)"),source.index("from tutor_graph import"))
    def test_evaluator_remains_quota_gated_and_graph_free(self):
        tree=ast.parse(CODE)
        evaluator=next(node for node in tree.body
                       if isinstance(node,ast.FunctionDef) and node.name=="evaluate")
        body=ast.get_source_segment(CODE,evaluator)
        self.assertNotIn("tutor_graph",body)
        self.assertLess(body.index("authenticate(req)"),body.index("enforce_eval_quota("))
        self.assertLess(body.index("enforce_eval_quota("),body.index("model_review(RUBRICS[k]"))
    def test_no_model_payment_automatic_ci(self):
        workflow=(ROOT/".github/workflows/galaxy-ci.yml").read_text()
        self.assertIn("python -m unittest discover",workflow)
        self.assertNotIn("azure/login@",workflow)
        self.assertNotIn("GALAXY_RUN_AI_SMOKE",workflow)
if __name__=="__main__":unittest.main()
