"""Explicitly billed, protected hosted acceptance: 10 Galaxy golden prompts and FREE limits.

Runs only with 2 disposable, distinct Supabase users, within the existing
ephemeral Auth runner's finally cleanup. No tokens, answers or provider response
bodies are written to disk or logs. The model reports its own diagnostic scores;
these are NOT independent quality-gate metrics.
"""
from __future__ import annotations
import json
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from live_rls_check import CheckFailed, sign_in
from live_ai_smoke import EXPECTED_URL

ROOT = Path(__file__).resolve().parents[1]
GOLDEN = ROOT / "docs/ai/evaluation/golden-galaxy-v1.jsonl"
RUBRICS = ROOT / "api/rubrics.json"
ORIGIN = "https://gengalaxy1429841605.z29.web.core.windows.net"
MAX_DAILY_USER_CALLS = 5


def issue(token, data):
    req = Request(
        EXPECTED_URL, data=json.dumps(data, ensure_ascii=False).encode("utf-8"),
        method="POST", headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json", "Origin": ORIGIN})
    try:
        with urlopen(req, timeout=80) as response:
            return response.status, response.headers, response.read(60_000)
    except HTTPError as exc:
        return exc.code, exc.headers, exc.read(60_000)
    except URLError:
        raise CheckFailed("Galaxy evaluator network failure") from None


def run_golden_and_quota(key, a_email, a_pw, b_email, b_pw):
    _, a_jwt = sign_in(a_email, a_pw, key)
    _, b_jwt = sign_in(b_email, b_pw, key)
    cases = [json.loads(line) for line in GOLDEN.read_text(encoding="utf-8").splitlines()
             if line.strip()]
    rubrics = json.loads(RUBRICS.read_text(encoding="utf-8"))
    if len(cases) != 10 or len({case["id"] for case in cases}) != 10:
        raise CheckFailed("Unexpected golden dataset; refusing paid test")
    if any(case["topic_key"] not in rubrics for case in cases):
        raise CheckFailed("Golden dataset contains topic without server rubric")
    if len(cases) != MAX_DAILY_USER_CALLS * 2:
        raise CheckFailed("Golden count would exceed approved two-user FREE quotas")

    def body(case):
        return {"topic_key": case["topic_key"], "question": case["question"],
                "response": case["candidate_answer"]}

    denied, _, _ = issue("invalid-test-token", body(cases[0]))
    if denied not in (400, 401, 403):
        raise CheckFailed("Invalid bearer was not rejected before a billed model call")
    malformed, _, _ = issue(a_jwt, {
        "topic_key": cases[0]["topic_key"], "question": cases[0]["question"], "response": "x"})
    if malformed != 400:
        raise CheckFailed("Malformed answer did not return HTTP 400 before quota reservation")

    results = []
    for index, case in enumerate(cases):
        token = a_jwt if index < MAX_DAILY_USER_CALLS else b_jwt
        status, headers, raw = issue(token, body(case))
        if status != 200:
            raise CheckFailed("Golden case " + case["id"] + ": HTTP " + str(status))
        try:
            payload = json.loads(raw)
            if payload["review_status"] != "model_reviewed":
                raise ValueError("Model review missing")
            if type(payload["accuracy"]) not in (int,float) or not 0 <= payload["accuracy"] <= 100:
                raise ValueError("Invalid reported accuracy")
            if type(payload["has_factual_errors"]) is not bool:
                raise ValueError("Invalid factual error field")
            trace = str(uuid.UUID(headers.get("X-Galaxy-Trace-Id","")))
        except (ValueError, KeyError, TypeError, AttributeError):
            raise CheckFailed("Golden model output invalid at " + case["id"]) from None

        results.append({"id":case["id"], "model_reported_accuracy":payload["accuracy"],
                        "model_reported_factual_errors":payload["has_factual_errors"],
                        "trace_id":trace})
    # User A already had five model reservations. An additional call MUST fail
    # before the paid LLM is contacted. User B has five independently too.
    for token in (a_jwt, b_jwt):
        status, _, raw = issue(token, body(cases[0]))
        if status != 429:
            raise CheckFailed("FREE plan exceeded five model calls without HTTP 429")

    # These are diagnostic outcomes, not independent groundedness metrics.
    print("HOSTED GOLDEN BASELINE: 10/10 model calls, invalid bearer/answer denied,")
    print("both FREE users denied sixth evaluation with HTTP 429.")
    print("MODEL-REPORTED DIAGNOSTICS (not independent release scores):")
    for result in results:
        print(json.dumps(result, sort_keys=True))
    print("Independent reference fact-checking and human SME signoff still required.")
