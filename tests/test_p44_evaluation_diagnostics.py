"""P44 evaluator UX and grounded token-cost interview answer regressions."""
import json
import re
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
APP=(ROOT/'app.js').read_text()
LESSONS=json.loads((ROOT/'data/lessons.json').read_text())
RUBRICS=json.loads((ROOT/'api/rubrics.json').read_text())

class EvaluationDiagnostics(unittest.TestCase):
 def test_browser_distinguishes_network_cors_and_missing_api(self):
  self.assertIn("err instanceof TypeError",APP)
  self.assertIn("CORS preflight",APP)
  self.assertIn("status===404",APP)
  self.assertIn("No model review was received",APP)
 def test_cost_question_reference_is_pricing_not_definition_only(self):
  answer=LESSONS['Tokens & tokenization']['answer'].lower()
  for term in ('input tokens','output tokens','per-million-token prices','1,000,000','cached input'):
   self.assertIn(term,answer)
  matching=[v for v in RUBRICS.values() if v['topic']=='Tokens & tokenization']
  self.assertEqual(len(matching),1)
  self.assertIn('estimate token cost',matching[0]['question'].lower())
  self.assertEqual(matching[0]['reference_answer'],LESSONS['Tokens & tokenization']['answer'])
 def test_local_fallback_does_not_masquerade_as_model(self):
  self.assertIn("Only the local concept check is shown; no factual grade was produced.",APP)
  self.assertIn("serverReviewed:true",APP)
  self.assertIn("LOCAL CONCEPT CHECK · NOT A FACTUAL GRADE",APP)

if __name__=="__main__":
 unittest.main()
