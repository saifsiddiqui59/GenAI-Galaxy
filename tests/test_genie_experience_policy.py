"""No-cloud policy checks for the parallel Genie UX acceptance specification."""
from pathlib import Path
import json
import unittest
ROOT = Path(__file__).resolve().parents[1]
MATRIX = ROOT / "tests" / "experience" / "genie_acceptance_matrix.json"

class GenieExperiencePolicyTests(unittest.TestCase):
    def test_matrix_is_complete_and_no_cloud_claims(self):
        doc = json.loads(MATRIX.read_text(encoding="utf-8"))
        self.assertEqual(doc["feature_pr"], 47)
        cases=doc["cases"]
        ids={case["id"] for case in cases}
        self.assertEqual(len(ids),len(cases),"Scenario IDs must be unique")
        self.assertGreaterEqual(len(cases),14)
        for group in ("GEN-LOGIN","GEN-OWNER","GEN-STORY","GEN-UX","GEN-A11Y","GEN-VIEW","GEN-REPLAY","GEN-PERF","GEN-REAL"):
            self.assertTrue(any(item.startswith(group) for item in ids),group)
        for case in cases:
            self.assertIn(case["type"],("offline","synthetic_browser","manual"))
            self.assertTrue(case["blocking"])
        self.assertEqual(doc["performance_targets"]["third_party_runtime_requests_max"],0)
        self.assertLessEqual(doc["performance_targets"]["desktop_animation_ms_max"],950)
        self.assertLessEqual(doc["performance_targets"]["mobile_animation_ms_max"],950)
        self.assertIn("separate approval",doc["automation_scope"])

    def test_baseline_keeps_auth_and_reduced_motion(self):
        app=(ROOT/"app.js").read_text(encoding="utf-8")
        css=(ROOT/"styles.css").read_text(encoding="utf-8")
        self.assertIn("if(state.subjects.length!==17",app)
        self.assertIn("prefers-reduced-motion: reduce",app)
        self.assertIn("@media(prefers-reduced-motion:reduce)",css)
        self.assertIn(".eq('user_id',userId)",app)
        self.assertNotIn("GalaxyGenieGuide.show({userId:'",app,"Don't embed static test identities in production JS")

if __name__ == "__main__":
    unittest.main()
