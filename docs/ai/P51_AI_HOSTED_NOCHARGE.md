# P51 — Manual no-charge hosted API acceptance

The existing **old** published Function build may still be reachable while
P47–P50 source remains undeployed. To avoid accidentally spending money or
modifying unrelated workloads, this workstream adds a **manual-only** smoke.

Run after deploying a reviewed backend: GitHub Actions -> **Galaxy AI endpoints
free read-only production smoke (manual)** -> main -> enter `READONLY`.

It calls **only** the fixed approved Galaxy Azure Function host, sending:
1. Two CORS OPTIONS requests per route (expected exact-site 200, hostile-origin 403).
2. One unauthenticated POST per route (expected 401, never 200).

These six requests contain **no access tokens, provider credentials, other
real users, or valid topic keys**. The bearer-auth guard rejects POST before
any billable model/quotas. No Azure/Supabase writes, user creation, invoices
or paid LLM evaluation are performed. Normal PR CI runs only simulated unit
tests; it does **not** invoke the hosted URLs. The workflow must be dispatched
separately, only on main, so a PR cannot invoke live endpoints.

This verifies just: CORS and anonymous authorization for the deployed
`/api/practice/evaluate` and `/api/practice/tutor` routes. It **cannot**
establish that the latest P50 code was deployed: old versions may return
404 or not include the tutor route. A 401 on the tutor path is stronger proof
of live route availability than static source review, but still not a signed-in
tutor or actual score.

**Not yet done:** approved Function/backend deploy, protected static site
publish with live AI endpoint enabled and rollback, consented two-user
positive/negative signed-in tests, real model-quality review, actual regional
model token prices and private Azure Cost Management reconciliation.
Keep all 3D V6 release branches isolated.
