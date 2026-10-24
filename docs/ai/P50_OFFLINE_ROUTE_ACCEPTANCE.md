# P50 — Offline API Route Acceptance and Token Telemetry Consistency

**Scope:** Zero-cost, no-network, source-only acceptance for the existing Azure
Functions evaluator and LangGraph tutor. This is NOT live Azure or Supabase acceptance,
proof of LLM grading accuracy, human-reviewed calibration, or a published release.

## Tests performed by regular PR CI

`tests/test_p50_api_route_acceptance.py` executes the actual Functions route
handlers under a minimal synthetic Azure Functions host, using synthetic
identity / quota / provider doubles. Any unexpected call through
`request_json` raises immediately, making accidental billable traffic a test failure.

Scenarios:
- Missing bearer -> 401; no quota reservation, no model call.
- Invalid topic, question or too-short answer -> 400; no quota/model.
- Atomic quota rejects evaluation -> 429; no model.
- Quota service unavailable -> 503, fail closed.
- Successful evaluation -> one reserved quota and one model-review invocation;
  model score has explicit non-independent provenance, provider usage counters
  and correlation header, with no invented INR cost.
- Provider failure -> 503, without fabricated evaluation score.
- Free reference and quiz LangGraph routes -> no quota, no paid model call.
- Explicit paid tutor -> one quota reservation and one model invocation.
- Tutor quota denial/model failure -> 429/503 without a fabricated answer.
- CORS preflight only authorizes the configured HTTPS Galaxy origin.

In addition, `api/eval_observability.py` rejects internally inconsistent
provider-reported totals instead of exposing them as measured tokens. The
existing explicit-verified-rate estimator already refuses malformed or
inconsistent cost usage; a regression ties these layers together.

## Exit criteria still unresolved

1. Owner-approved deployment of merged P47–P50 backend and static frontend.
2. Hosted signed-in tests for real Supabase JWT and atomic per-user/global
   quota, 429/503, CORS, response headers, accessible mobile UI, session
   transitions and rollback. These offline doubles are **not** those tests.
3. Real model answers reviewed by a human for directness, correctness,
   essential concepts, hallucinations and unjustly low concise-answer grades.
   The requested 120-case golden suite remains explicitly deferred.
4. Actual model-request tokens, owner-verified regional pricebook, and
   successful *private* Azure Cost Hub actual-bill report reconciliation.
5. The separate cinematic V6 review and mobile graphics QA remain owned by
   their existing draft-PR workstream. This PR does not edit any V6 files.

**Do not dispatch manual cloud workflows, secrets, paid AI or provision/deploy
resources through normal PR validation.** Never invent measured bill totals.
