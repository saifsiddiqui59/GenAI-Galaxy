# P79 — Controlled 2 → 1 → 2 HTTP routing diagnosis

**Owner's objective:** make true GenAI-Galaxy AI tutor streaming live without compromising evaluator, document, speech or auth routes.

## Release blocker reproduced on 26 Oct 2026 local time

Protected [#40236388280](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40236388280) on existing 512 MB Flex, max 2, Always Ready 0:
- `GET /api/health`: Python **200** with `X-Galaxy-Trace-Id` (proof of Python execution).
- `OPTIONS /api/practice/evaluate`: **200**.
- Immediately subsequent *anonymous* `POST /api/practice/evaluate`: **40-second timeout**, **zero HTTP response bytes**.
- No JWT, quota reservation, AI model invocation or model tokens.

Earlier [#40229445287](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40229445287) showed anonymous evaluator POST **401**, tutor OPTIONS **40-second timeout**. The defect changes routes. A successful health response is **insufficient** to declare readiness.

## One bounded reversible hypothesis test

Official Microsoft Flex docs allow minimum maximum instance count of one, but warn that low caps under high load can cause request throttling:
https://learn.microsoft.com/en-us/azure/azure-functions/event-driven-scaling

The manually invoked protected workflow `galaxy-p79-one-instance-test.yml`:
1. Require exact Galaxy subscription, client, resource ID and observed instance config **512 MB / maximum 2 / Always Ready []**.
2. Temporarily reduce only the on-demand maximum from 2 to **1**. No Always Ready, model calls, new storage, resource, service plan or provider keys.
3. Send strictly **four sequential anonymous HTTP requests** (Python GET health expected 200; evaluator POST 401; tutor POST 401; evaluator POST 401). Treat missing app trace, 503 or timeout as failure. These can produce small existing Azure Functions execution charges.
4. **Always restore maximum 2** using a shell exit trap even if a request fails. Independently verify and repair back to maximum 2 using a second protected OIDC job if necessary. No automatic paid AI retries or model traffic.
5. **A successful run is not production readiness.** Two further independent baseline 2-instance clean runs are required before any model call or FastAPI streaming migration. A 1-instance cap may mask misrouting, reduce capacity or worsen load; retain max 2 after the diagnostic.

The owner bridge permits the exact-SHA `DIAG_SINGLE_INSTANCE_<current green main SHA>` command on owner issue #183, and does not permit branch-initiated cloud writes.

## Why not enable streaming prematurely

Microsoft states turning on Python v2 HTTP Streams switches the *entire app* away from legacy `azure.functions.HttpRequest/HttpResponse` and requires the FastAPI HTTP extension and `PYTHON_ENABLE_INIT_INDEXING=1`. Galaxy's four authenticated HTTP handlers use the legacy contract. Enabling streaming on the unhealthy app without a controlled migration, safe rollback and acceptance could break all production AI routes. Source-only real SSE transport is merged through PRs #230 and #231, **not activated**.

Do not mark P0 #192 resolved, claim signed-in model streaming works, or buy always-on instances because a synthetic test passes.
