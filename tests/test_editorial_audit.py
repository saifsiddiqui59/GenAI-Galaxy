"""Synthetic, offline tests for editorial triage, not factual endorsement."""
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from editorial_audit import audit


class EditorialAuditTests(unittest.TestCase):
    def test_existing_lesson_inventory(self):
        source = json.loads((ROOT / "data/lessons.json").read_text(encoding="utf-8"))
        result = audit(source)
        self.assertEqual(result["lesson_count"], 245)
        self.assertEqual(result["structural_issues"], [])
        self.assertEqual(len(result["flag_counts"]), 4)
        self.assertIn("time-sensitive wording", result["flag_counts"])

    def test_bad_lesson_flags_are_not_mistaken_for_sme_review(self):
        obj = {"short": {"simple": "x", "technical": "x", "example": "x", "project": "x",
                         "answer": "Always use the latest tool", "workflow": [],
                         "mistakes": [], "followups": [], "keywords": []}}
        result = audit(obj)
        self.assertTrue(result["structural_issues"])
        self.assertEqual(result["flag_counts"]["absolute wording"], 1)
        self.assertEqual(result["flag_counts"]["time-sensitive wording"], 1)


if __name__ == "__main__":
    unittest.main()
