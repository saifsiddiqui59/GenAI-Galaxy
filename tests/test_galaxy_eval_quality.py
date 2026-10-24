"""Offline evaluation/tracing quality checks; no model or telemetry network calls."""
import io
import json
import pathlib
import sys
import time
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "api"))
sys.path.insert(0, str(ROOT / "scripts"))

from eval_observability import new_trace_id, usage_counters, record_evaluation
from gate_galaxy_eval import load_contract, evaluate_evidence, SCORE_NAMES


class GalaxyEvaluationQualityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.policy, cls.cases = load_contract()

    def evidence(self):
        return {
            "dataset_version": self.policy["dataset_version"],
            "source": "independent_judge_call",
            "evaluator_version": "offline-mock-only",
            "deployment": "synthetic-fixture-not-real",
            "cases": [
                {"id": row["id"], "metrics": {k: 4.5 for k in SCORE_NAMES},
                 "security_blockers": {k: 0 for k in self.policy["release_blockers"]}}
                for row in self.cases
            ],
        }

    def test_contract_uses_real_galaxy_rubrics(self):
        rubrics = json.loads((ROOT / "api/rubrics.json").read_text())
        self.assertEqual(len(self.cases), 10)
        self.assertTrue(all(row["topic_key"] in rubrics for row in self.cases))
        self.assertEqual(evaluate_evidence(self.evidence(), policy=self.policy, cases=self.cases), [])

    def test_release_blocks_any_security_failure(self):
        result = self.evidence()
        result["cases"][0]["security_blockers"]["unauthorized_cross_user_access"] = 1
        failures = evaluate_evidence(result, policy=self.policy, cases=self.cases)
        self.assertTrue(any("security blocker" in failure for failure in failures))

    def test_release_blocks_missing_independent_metrics_or_provenance(self):
        for edit in ("missing_score", "fake_provenance", "missing_case", "poor_quality"):
            with self.subTest(edit=edit):
                result = self.evidence()
                if edit == "missing_score":
                    result["cases"][2]["metrics"].pop("groundedness")
                elif edit == "fake_provenance":
                    result["source"] = "model_self_report"
                elif edit == "missing_case":
                    result["cases"].pop()
                else:
                    for case in result["cases"]:
                        case["metrics"]["relevance"] = 3.0
                self.assertNotEqual(evaluate_evidence(result, policy=self.policy, cases=self.cases), [])

    def test_trace_is_server_generated_and_safe(self):
        t1 = new_trace_id()
        t2 = new_trace_id()
        self.assertNotEqual(t1, t2)
        self.assertEqual(len(t1), 36)
        raw = {
            "usage": {"prompt_tokens": 123, "completion_tokens": 44, "total_tokens": 167},
            "choices": [{"message": {"content": "patient secret, PRIVATE-ANSWER"}}],
            "api-key": "SUPER-SECRET-KEY",
        }
        usage = usage_counters(raw)
        self.assertEqual(usage, {"input_tokens": 123, "output_tokens": 44, "total_tokens": 167})
        with self.assertLogs("galaxy.evaluation", level="INFO") as captured:
            record_evaluation(trace_id=t1, status=200, stage="completed",
                              started_at=time.monotonic() - 0.05,
                              quota_result="reserved", usage=usage, accuracy=88, clarity=91)
        event = json.loads(captured.output[0].split(":", 2)[-1])
        self.assertEqual(event["trace_id"], t1)
        self.assertEqual(event["input_tokens"], 123)
        self.assertEqual(event["quota"], "reserved")
        self.assertEqual(event["model_reported_accuracy"], 88)
        self.assertNotIn("PRIVATE-ANSWER", captured.output[0])
        self.assertNotIn("SUPER-SECRET", captured.output[0])
        self.assertNotIn("patient", captured.output[0])
        self.assertNotIn("user_id", event)
        self.assertNotIn("question", event)
        self.assertNotIn("response", event)

    def test_token_usage_strict_bounded_int(self):
        v = usage_counters({"usage": {
            "prompt_tokens": True, "completion_tokens": -1,
            "total_tokens": 1_000_000_000, "foo": 5}})
        self.assertEqual(v, {})

    def test_live_evaluator_endpoint_not_fake_green_from_model_self_scores(self):
        code = (ROOT / "api/function_app.py").read_text()
        self.assertIn("'X-Galaxy-Trace-Id'", code)
        self.assertIn("record_evaluation(", code)
        self.assertIn("usage_counters=usage_counters", code)
        self.assertIn("chat_json(", code)
        self.assertIn("estimate_model_cost(", code)
        self.assertIn("quota='reserved'", code)
        self.assertIn("except QuotaExceeded", code)
        self.assertIn("model_review(RUBRICS[k],question,response,history=history)", code)


if __name__ == "__main__":
    unittest.main()
