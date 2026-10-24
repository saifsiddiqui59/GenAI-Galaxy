"""Regression: AI review scores must not reward missed question-critical concepts."""
from pathlib import Path
import unittest
R=Path(__file__).resolve().parents[1]
S=(R/"api/function_app.py").read_text()
class ScoringCalibration(unittest.TestCase):
 def test_direct_question_relevance_is_first_class(self):
  self.assertIn("Score primarily whether the answer directly resolves the ACTUAL QUESTION",S)
  self.assertIn("a definition of each approach without the reason",S)
  self.assertIn("accuracy at most 45",S)
 def test_model_admitted_missing_concepts_cannot_receive_85(self):
  self.assertIn("if reviewed['missing_concepts'] and reviewed['accuracy'] > 65:",S)
  self.assertIn("reviewed['accuracy']=65",S)
  self.assertIn("return reviewed, usage_counters(out)",S)
if __name__=="__main__": unittest.main()
