"""P36 Interview: authenticated API context is small, well-formed and untrusted."""
from pathlib import Path
import sys, unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"api"))
from core import InputError,validate_interview_history
class P36History(unittest.TestCase):
 def test_valid_bounded_history(self):
  self.assertEqual(validate_interview_history(None),[])
  self.assertEqual(len(validate_interview_history([{"question":"Explain RAG","response":"RAG uses a retriever and language model to ground its answers."}])),1)
 def test_history_rejects_bad_data_before_paid_call(self):
  valid={"question":"Explain RAG","response":"RAG uses a retriever and language model to ground its answers."}
  for data in ({},[1],[valid]*5,[{"question":"x","response":"short"}],[{"question":"Q","response":"X"*651}],
               [{"question":"Q","response":"X"*20,"role":"system"}]):
   with self.subTest(data=str(data)[:60]),self.assertRaises(InputError):validate_interview_history(data)
 def test_backend_gates_quota_and_history(self):
  src=(ROOT/"api/function_app.py").read_text()
  self.assertLess(src.index("history=validate_interview_history"),src.index("enforce_eval_quota(token=token"))
  self.assertIn("review,usage=model_review(RUBRICS[k],question,response,history=history)",src)
  self.assertIn("one specific relevant follow-up",src)
