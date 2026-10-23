"""Galaxy release quality gate; modeled on WineShopPOS golden/gate contracts.

This checker NEVER invokes a paid judge and NEVER treats a model's self-reported
accuracy/clarity as an independent metric. Feed it real, independently collected
scored evidence; missing evidence MUST fail. No raw candidate answers in output.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "docs/ai/evaluation/golden-galaxy-v1.jsonl"
POLICY = ROOT / "docs/ai/evaluation/quality-gates-galaxy-v1.json"
SCORE_NAMES = ("groundedness", "relevance", "coherence", "factual_accuracy")


def load_contract():
    policy = json.loads(POLICY.read_text(encoding="utf-8"))
    cases = [json.loads(line) for line in DATASET.read_text(encoding="utf-8").splitlines()
             if line.strip()]
    ids = [row["id"] for row in cases]
    if len(ids) != len(set(ids)) or len(ids) < policy["targets"]["minimum_cases"]:
        raise ValueError("Golden dataset has too few unique cases")
    if any(not row.get("topic_key") or not row.get("question") or
           not row.get("candidate_answer") or not row.get("expected_behavior") for row in cases):
        raise ValueError("Incomplete golden dataset")
    return policy, cases


def evaluate_evidence(evidence, *, policy, cases):
    problems = []
    if not isinstance(evidence, dict):
        raise ValueError("Expected versioned evidence object")
    if evidence.get("dataset_version") != policy["dataset_version"]:
        problems.append("dataset_version mismatch")
    if evidence.get("source") != "independent_judge_call":
        problems.append("independent evaluator provenance missing")
    if not isinstance(evidence.get("evaluator_version"), str) or not evidence["evaluator_version"].strip():
        problems.append("pinned evaluator_version missing")
    if not isinstance(evidence.get("deployment"), str) or not evidence["deployment"].strip():
        problems.append("judge deployment missing")
    observed = evidence.get("cases")
    if not isinstance(observed, list):
        return ["case evidence missing"]
    expected_ids = {row["id"] for row in cases}
    actual_ids = [row.get("id") for row in observed if isinstance(row, dict)]
    if len(actual_ids) != len(observed) or len(set(actual_ids)) != len(actual_ids) or set(actual_ids) != expected_ids:
        problems.append("golden case coverage mismatch")
    for row in observed:
        if not isinstance(row, dict):
            problems.append("case payload invalid")
            continue
        if set(row) != {"id", "metrics", "security_blockers"}:
            problems.append("case evidence contains unexpected/missing fields")
            continue
        metrics = row["metrics"]
        blockers = row["security_blockers"]
        if not isinstance(metrics, dict) or set(metrics) != set(SCORE_NAMES):
            problems.append("required independent quality scores missing")
            continue
        for name in SCORE_NAMES:
            score = metrics[name]
            if type(score) not in (int, float) or not math.isfinite(score) or not 1 <= score <= 5:
                problems.append("invalid quality score: " + name)
        if not isinstance(blockers, dict) or set(blockers) != set(policy["release_blockers"]):
            problems.append("required security blocker observations missing")
            continue
        for name, maximum in policy["release_blockers"].items():
            count = blockers[name]
            if type(count) is not int or count < 0 or count > maximum:
                problems.append("security blocker triggered: " + name)
    if problems:
        return sorted(set(problems))
    for name in SCORE_NAMES:
        scores = [row["metrics"][name] for row in observed]
        average = sum(scores) / len(scores)
        if average < policy["targets"][name + "_min_1_to_5"]:
            problems.append("quality threshold not met: " + name)
    return problems


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    if len(args) != 1:
        print("Usage: python scripts/gate_galaxy_eval.py <actual-scored-evidence.json>", file=sys.stderr)
        return 2
    try:
        policy, cases = load_contract()
        evidence = json.loads(Path(args[0]).read_text(encoding="utf-8"))
        problems = evaluate_evidence(evidence, policy=policy, cases=cases)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print("GALAXY_AI_QUALITY_GATE=FAIL (evidence unavailable/invalid)", file=sys.stderr)
        return 1
    if problems:
        print("GALAXY_AI_QUALITY_GATE=FAIL", file=sys.stderr)
        for issue in problems:
            print(" - " + issue, file=sys.stderr)
        return 1
    print("GALAXY_AI_QUALITY_GATE=PASS")
    print("CASES_VERIFIED=" + str(len(cases)))
    print("POLICY_VERSION=" + policy["policy_version"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
