"""P80 startup improvement: keep heavy technical rubrics off Python worker indexing.

Offline only. This runs with standard-library AST and never imports the Azure
Functions SDK, LangGraph, Supabase or provider adapters.
"""
import ast
import json
from functools import lru_cache
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
API=ROOT/"api"/"function_app.py"
CODE=API.read_text(encoding="utf-8")

class LazyRubricStartupTests(unittest.TestCase):
    def test_no_curriculum_parse_during_module_indexing(self):
        tree=ast.parse(CODE)
        for n in tree.body:
            if isinstance(n,(ast.Assign,ast.AnnAssign,ast.Expr)):
                self.assertNotIn("rubrics.json",ast.get_source_segment(CODE,n) or "")
        fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef)
                and n.name=="rubric_catalog")
        self.assertEqual(len(fn.decorator_list),1)
        self.assertIn("lru_cache(maxsize=1)",ast.unparse(fn.decorator_list[0]))
        self.assertIn("'rubrics.json'",ast.get_source_segment(CODE,fn))

    def test_post_auth_load_and_pre_quota_order(self):
        tree=ast.parse(CODE)
        for name in ("evaluate","tutor"):
            method=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==name)
            source=ast.get_source_segment(CODE,method)
            self.assertIn("rubrics=rubric_catalog()",source)
            self.assertLess(source.index("authenticate(req)"),source.index("rubrics=rubric_catalog()"))
            self.assertLess(source.index("rubrics=rubric_catalog()"),source.index("enforce_eval_quota("))
            self.assertIn("except QuotaExceeded:",source)
            self.assertIn("return result({'error':'Daily evaluation limit reached'},429)",source)
        # Preflight and health must remain independent of authenticated rubric work.
        for name in ("health","preflight","authenticate"):
            n=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==name)
            self.assertNotIn("rubric_catalog(",ast.get_source_segment(CODE,n))

    def test_same_verified_curriculum_cached_without_network(self):
        tree=ast.parse(CODE)
        rubric=next(n for n in tree.body if isinstance(n,ast.FunctionDef)
                   and n.name=="rubric_catalog")
        counters={"loads":0}
        class JsonSpy:
            def loads(self,text):
                counters["loads"]+=1
                return json.loads(text)
        space={"Path":Path,"__file__":str(API),"json":JsonSpy(),"lru_cache":lru_cache}
        exec(compile(ast.Module(body=[rubric],type_ignores=[]),str(API),"exec"),space)
        first=space["rubric_catalog"]()
        second=space["rubric_catalog"]()
        self.assertIs(first,second)
        self.assertGreater(len(first),200)
        self.assertEqual(counters["loads"],1)
        self.assertIn("LLM & Transformer Fundamentals / Model mechanics / Tokens & tokenization",first)
if __name__=="__main__":
    unittest.main()
