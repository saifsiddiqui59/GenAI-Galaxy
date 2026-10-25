"""P66: classify whether denied requests eventually return after long cold start.

Four exact anonymous requests, maximum one per operation: no credentials, no
quota reservation, no AI calls or automatic retries. 100-second windows are
diagnostic only; they do NOT change actual HTTP or UI deadlines.
"""
import argparse
import json
from diagnose_http_phases_nocharge import sample, PATHS

CASES = [
    (PATHS[0], "OPTIONS", 30),
    (PATHS[0], "POST", 100),
    (PATHS[1], "POST", 100),
    (PATHS[1], "OPTIONS", 30),
]

def run(probe=sample):
    outcomes=[]
    for path,method,timeout in CASES:
        result=probe(path,method,timeout)
        print(json.dumps(result,sort_keys=True),flush=True)
        outcomes.append(result)
    failed=sum(not r["passed"] for r in outcomes)
    print("P66",len(CASES),"one-shot, anonymous requests;",failed,
          "failures. No model call, no quota, no retry.")
    return 0 if failed == 0 else 1

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--confirm",choices=["LONG_READONLY"],required=True)
    parser.parse_args()
    raise SystemExit(run())
