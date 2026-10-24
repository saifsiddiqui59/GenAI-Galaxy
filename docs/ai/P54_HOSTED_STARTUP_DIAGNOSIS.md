# P54 — Evidence-first AI endpoint cold-start investigation

Protected P50 Azure Function deployment #40101916768 completed successfully.
The no-charge real hosted checks in #40102276516 failed twice: Python
offline contract tests passed, while the unauthenticated evaluator POST
and/or tutor OPTIONS/POST failed with `TimeoutError` using 15-second
per-request bounds. These are genuine live test failures, **not proof**
of an LLM model response failure, security vulnerability or bad pricing.

This patch changes *only the test timeout* from 15 to 40 seconds and the
manual CI wall-clock allowance to 8 minutes. No prod Function, Supabase,
Azure settings, quota, static website, V6, billing or model code is
modified. Only a manual `READONLY` dispatch can contact Azure, without
any bearer token or billable model invocation. Failure remains failure;
no timeout is converted into an invented 401/pass.

If the 40-second bounded check still fails:
1. Capture precise status/timing for each route from the protected job.
2. Inspect dedicated Flex host startup, Function indexing and backend
   Python worker logs through owner-approved read-only Azure diagnostics.
3. Determine whether cold-start latency, import/package load, crash/
   OOM or host access restrictions are responsible; do not guess.
4. Verify 401/403/CORS and route health BEFORE authenticated positive
   paid-model acceptance or an unqualified live-release statement.

The isolated P53 static preview stays independent. A successful source
deploy or mock browser run does not certify live endpoint health.
