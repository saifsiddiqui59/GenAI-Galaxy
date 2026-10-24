"""P58: no fabricated human-certified grading scores or paid inference."""
import pathlib,sys,unittest,json
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from gate_human_interview_grading import validate_review, expected_case_ids
DIMENSIONS={"direct_answer":4,"technical_correctness":4,"essential_coverage":4,
            "decision_reasoning":4,"clarity":4}
def fake_structural_evidence():
    return {"dataset_version":"galaxy-golden-v1","source":"human_domain_expert_independent",
            "reviewer_id":"fixture-not-a-real-reviewer",
            "attested_independent_of_grading_model":True,
            "actual_model_version":"synthetic-not-deployed",
            "cases":[{"id":i,"model_score":95,"expert_score":100,
                      "expert_dimensions":DIMENSIONS.copy(),
                      "expert_notes":"Synthetic fixture only, NOT human judgment.",
                      "unsafe_claim_detected":False,
                      "actual_model_response_verified":True}
                     for i in expected_case_ids()]}
class HumanReviewContractTests(unittest.TestCase):
    def test_case_count_and_basic_structure(self):
        self.assertEqual(len(expected_case_ids()),10)
        self.assertEqual(validate_review(fake_structural_evidence()),[])
    def test_missing_human_labels_fail(self):
        e=fake_structural_evidence()
        for key in ("reviewer_id","source","actual_model_version"):
            with self.subTest(key=key):
                d=json.loads(json.dumps(e)); d.pop(key)
                self.assertTrue(validate_review(d))
        e["cases"][2]["expert_dimensions"]["direct_answer"]=None
        self.assertTrue(validate_review(e))
    def test_reject_fake_structural_inconsistent_score(self):
        e=fake_structural_evidence(); e["cases"][1]["expert_score"]=5
        self.assertTrue(any("contradicts" in s for s in validate_review(e)))
    def test_reject_model_human_large_divergence(self):
        e=fake_structural_evidence()
        for c in e["cases"]: c["model_score"]=20
        self.assertTrue(any("disagreement" in s for s in validate_review(e)))
    def test_extra_or_duplicate_case_fails(self):
        e=fake_structural_evidence(); e["cases"][3]["id"]=e["cases"][2]["id"]
        self.assertTrue(validate_review(e))
    def test_no_hosted_or_fabricated_generated_test_data(self):
        text=(ROOT/"scripts/gate_human_interview_grading.py").read_text()
        self.assertNotIn("azure.functions",text)
        self.assertNotIn("request_json(",text)
        self.assertNotIn("model_review(",text)
if __name__=="__main__":unittest.main()
