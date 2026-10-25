"""P70: owner-requested real Function warm-up -> actual tutor authentication route.

The warm-up MUST be an anonymous POST that reaches the Python application
(401 and an app trace), not OPTIONS (Azure may answer 204 itself). Test
uses no JWT/model/quota. Exactly four bounded requests in one manual run:
warm evaluator, actual tutor, immediate tutor repeat, evaluator control.
No automatic retries, schedules, extra idle capacity or user-generated data.
"""
from __future__ import annotations
import argparse
import json
import sys
import subprocess
from diagnose_http_phases_nocharge import PATHS, sample

# Deliberately use real POSTs, NOT preflights. All deny before model calls.
CASES = (
    ("warm_evaluator", PATHS[0], "POST", 95),
    ("actual_tutor_after_warm", PATHS[1], "POST", 95),
    ("same_tutor_second_request", PATHS[1], "POST", 75),
    ("evaluator_control_after_tutor", PATHS[0], "POST", 35),
)

def run(probe=sample):
    results = []
    for label, path, method, seconds in CASES:
        try:
            result = probe(path, method, seconds)
        except (OSError, TimeoutError, ValueError, subprocess.SubprocessError):
            result = {"route":path, "method":method,"http_code":"000",
                      "total_s":seconds,"app_trace_present":False,"passed":False}
        # Application trace means the request actually reached Python, and
        # 401 means it was denied before quota or any billable model call.
        verified = (result.get("passed") is True
                    and result.get("http_code") == "401"
                    and result.get("app_trace_present") is True)
        record = {
            "phase":label,
            "route":path,
            "http_code":result.get("http_code","000"),
            "first_byte_s":result.get("ttfb_s",0),
            "total_s":result.get("total_s",seconds),
            "app_trace_present":result.get("app_trace_present",False),
            "tls_s":result.get("tls_s",0),
            "azure_peer":result.get("azure_peer","unknown"),
            "python_authenticated_denial":verified,
        }
        print(json.dumps(record,sort_keys=True),flush=True)
        results.append(record)
    # Never equate a gateway 204 or 503 with a warmed Python worker.
    if all(x["python_authenticated_denial"] for x in results):
        print("PASS: warmed evaluator -> actual tutor -> repeat tutor -> evaluator control, all Python 401; NO model call.")
        return 0
    print("FAIL: Function reliability unproven after warm-up; do NOT issue a paid Azure OpenAI test.")
    return 1

if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--confirm",required=True,choices=["WARM_NOCHARGE"])
    p.parse_args()
    sys.exit(run())
