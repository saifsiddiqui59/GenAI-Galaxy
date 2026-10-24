"""P58: fail-closed, human-reviewed interview-grade calibration gate.

Requires externally collected, consented actual model scores + independent
expert judgment. Never calls Azure, creates fake human labels or stores PII.
This is separate from the existing *RAG evaluation* groundedness gate.
"""
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATASET=ROOT/"docs/ai/evaluation/golden-galaxy-v1.jsonl"
DIMENSIONS=("direct_answer","technical_correctness","essential_coverage",
            "decision_reasoning","clarity")
MAX_MEAN_ABSOLUTE_ERROR=15.0

def expected_case_ids():
    return [json.loads(s)["id"] for s in DATASET.read_text(encoding="utf-8").splitlines() if s.strip()]

def validate_review(data):
    errors=[]
    if not isinstance(data,dict):
        return ["Independent grading evidence object missing"]
    if data.get("dataset_version")!="galaxy-golden-v1":
        errors.append("Wrong evaluation dataset version")
    if data.get("source")!="human_domain_expert_independent":
        errors.append("Independent human reviewer provenance not confirmed")
    reviewer=data.get("reviewer_id")
    if not isinstance(reviewer,str) or not 3<=len(reviewer)<=80:
        errors.append("Independent reviewer identifier missing")
    if data.get("attested_independent_of_grading_model") is not True:
        errors.append("Reviewer independence not attested")
    if not isinstance(data.get("actual_model_version"),str) or not data["actual_model_version"].strip():
        errors.append("Actual model version missing")
    cases=data.get("cases")
    if not isinstance(cases,list):
        return errors+["Case evidence missing"]
    ids=expected_case_ids()
    observed=[c.get("id") for c in cases if isinstance(c,dict)]
    if len(observed)!=len(cases) or len(observed)!=len(ids) or set(observed)!=set(ids) or len(set(observed))!=len(ids):
        errors.append("Case coverage missing or duplicated")
    differences=[]
    for c in cases:
        if not isinstance(c,dict):
            errors.append("Malformed case");continue
        key=c.get("id")
        try:
            model_score=c.get("model_score")
            reviewer_score=c.get("expert_score")
            dimensions=c.get("expert_dimensions")
            if type(model_score) is not int or not 0<=model_score<=100:
                raise ValueError("Unverified actual model score")
            if type(reviewer_score) is not int or not 0<=reviewer_score<=100:
                raise ValueError("Missing expert score")
            if not isinstance(dimensions,dict) or set(dimensions)!=set(DIMENSIONS):
                raise ValueError("Incomplete expert grading dimensions")
            if any(type(dimensions[k]) is not int or not 0<=dimensions[k]<=4 for k in DIMENSIONS):
                raise ValueError("Invalid expert grading dimension")
            notes=c.get("expert_notes")
            if not isinstance(notes,str) or not 8<=len(notes.strip())<=1000:
                raise ValueError("Reviewer explanation missing")
            if type(c.get("unsafe_claim_detected")) is not bool:
                raise ValueError("Human safety review missing")
            if c.get("actual_model_response_verified") is not True:
                raise ValueError("Actual response evidence missing")
            # Require independent score to agree with the five human dimensions.
            weights={"direct_answer":35,"technical_correctness":30,
                     "essential_coverage":25,"decision_reasoning":5,"clarity":5}
            recomputed=round(sum(dimensions[k]*weights[k]/4 for k in DIMENSIONS))
            if abs(recomputed-reviewer_score)>1:
                raise ValueError("Expert score contradicts expert rubric dimensions")
            differences.append(abs(model_score-reviewer_score))
        except ValueError as exc:
            errors.append(f"Case {key}: {exc}")
    if differences and len(differences)==len(ids) and sum(differences)/len(differences)>MAX_MEAN_ABSOLUTE_ERROR:
        errors.append("Mean absolute model-vs-expert disagreement exceeds 15 points")
    # Externally attained human evidence must also be manually audited; these
    # schema checks do not authenticate who provided the evidence.
    return errors

def main(argv=None):
    argv=list(sys.argv[1:] if argv is None else argv)
    if len(argv)!=1:
        print("Usage: python scripts/gate_human_interview_grading.py <independent-evidence.json>")
        return 2
    try:
        verdict=validate_review(json.loads(Path(argv[0]).read_text(encoding="utf-8")))
    except (OSError,ValueError,TypeError,KeyError):
        verdict=["Independent evidence missing or unreadable"]
    if verdict:
        print("GALAXY_HUMAN_INTERVIEW_CALIBRATION=FAIL")
        for item in sorted(set(verdict)): print(" - "+item)
        return 1
    print("GALAXY_HUMAN_INTERVIEW_CALIBRATION=STRUCTURAL_PASS")
    print("Note: reviewer identity and actual graded model responses still require external verification")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
