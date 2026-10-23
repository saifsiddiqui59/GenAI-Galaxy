"""Privacy-first, dependency-free GenAI Galaxy evaluation diagnostics.

Adapted from WineShopPOS request correlation / quality-evidence principles.
NO user IDs, prompts, answers, credentials, model output, request bodies,
document paths or session identifiers in traces. No telemetry service added.
These are single, small structured Function log events, NOT verified Foundry traces.
"""
from __future__ import annotations

import json
import logging
import math
import time
import uuid

LOGGER = logging.getLogger("galaxy.evaluation")
ALLOWED_STAGE = frozenset(("preflight", "auth", "validation", "quota", "model", "completed"))
MAX_TOKENS = 10_000_000


def new_trace_id() -> str:
    return str(uuid.uuid4())


def bounded_tokens(value):
    if type(value) is int and 0 <= value <= MAX_TOKENS:
        return value
    return None


def usage_counters(result):
    """Whitelisted provider accounting fields; never log provider response text."""
    usage = result.get("usage") if isinstance(result, dict) else None
    if not isinstance(usage, dict):
        return {}
    pairs = (
        ("input_tokens", "prompt_tokens"),
        ("output_tokens", "completion_tokens"),
        ("total_tokens", "total_tokens"),
    )
    return {dest: bounded_tokens(usage.get(src)) for dest, src in pairs
            if bounded_tokens(usage.get(src)) is not None}


def record_evaluation(*, trace_id, status, stage, started_at, quota_result, usage=None,
                      accuracy=None, clarity=None):
    """One bounded log event per accepted HTTP request, including failures.

    Does not persist traces or send to Azure Monitor; platform log retention and
    ingestion are separate infrastructure choices with different billing.
    """
    if not isinstance(trace_id, str):
        return
    event = {
        "event": "galaxy_ai_evaluation",
        "schema": "v1",
        "trace_id": trace_id if len(trace_id) == 36 else "invalid",
        "status": int(status) if type(status) is int and 100 <= status <= 599 else 503,
        "stage": stage if stage in ALLOWED_STAGE else "unknown",
        "duration_ms": max(0, min(120_000, round((time.monotonic() - started_at) * 1000))),
        "quota": quota_result if quota_result in ("none", "reserved", "denied", "unavailable") else "unavailable",
    }
    for name, value in (usage or {}).items():
        if name in ("input_tokens", "output_tokens", "total_tokens"):
            token_count = bounded_tokens(value)
            if token_count is not None:
                event[name] = token_count
    # These are MODEL-REPORTED scores, not independent RAGAS/Foundry metrics.
    for name, value in (("model_reported_accuracy", accuracy), ("model_reported_clarity", clarity)):
        if type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 100:
            event[name] = round(value)
    LOGGER.info("%s", json.dumps(event, separators=(",", ":"), sort_keys=True))
    return event
