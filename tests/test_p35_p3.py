import json, unittest
from pathlib import Path
from scripts.p35_editorial_triage import triage
ROOT=Path(__file__).resolve().parents[1]
class P35EditorialTests(unittest.TestCase):
 def test_real_inventory_and_heuristic_triage(self):
  lessons=json.loads((ROOT/"data/lessons.json").read_text(encoding="utf-8"))
  report=triage(lessons)
  self.assertEqual(report["lesson_count"],245)
  self.assertEqual(report["structural_issues"],[])
  self.assertIn("SME/source review",report["warning"])
  self.assertEqual(len({x["topic"] for x in report["review_queue"]}),len(report["review_queue"]))
 def test_milestones_offline(self):
  import subprocess
  subprocess.run(["node","tests/test_p35_p3.cjs"],cwd=ROOT,check=True,timeout=10)
