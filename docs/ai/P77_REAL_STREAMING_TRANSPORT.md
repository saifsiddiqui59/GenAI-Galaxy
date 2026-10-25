# P77 — Genuine model-delta transport, source-only until backend reliability passes

## Working offline implementation

- `experimental/ai_streaming/stream_protocol.py` consumes **real Azure Chat Completions SSE format**, yielding each `delta.content` text fragment as an actual event, as opposed to simulated text or displaying the final JSON character by character. It rejects malformed/truncated frames, abnormal finish reasons, tool calls, unsupported fields, unbounded output and incomplete streams. `complete` requires Azure's `finish_reason=stop`, a nonempty answer and terminal `[DONE]`. It optionally records valid provider token usage; missing usage is *unknown*, not zero.
- `verified_stream_request()` refuses to build a provider `stream=true` request without an explicit authenticated atomic quota-reservation indicator. The caller must still verify the real user session, tenant, allowed Azure model endpoint and per-user/global quota **before** any network request or SSE 200 status. It makes **no** network request itself.
- `experimental/ai_streaming/client.js` consumes actual UTF-8 bytes from `ReadableStream.getReader()`, decodes SSE framing across arbitrary byte boundaries, emits text deltas immediately to a callback and recognizes terminal/error frames. Client may show drafts with `textContent` only, labeled *provisional AI tutor text*; **never** treat them as a factual grade or mastery event. A missing/invalid terminal event rejects. No auto-retry or credential handling.
- Unit tests use mocked provider streams split into Unicode bytes; no identity, Azure login, model deployment, quota mutation or paid inference.

## Critical deployment boundary

**Not connected to the live P61 site, not deployed to Azure.** Current `api/function_app.py` uses the original `azure.functions.HttpRequest/HttpResponse` contract. Microsoft states Python v2 HTTP streams require `azurefunctions-extensions-http-fastapi`, `PYTHON_ENABLE_INIT_INDEXING=1`, `StreamingResponse`, and replacing the original routes because enabling it changes the HTTP handling mode:

https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger#http-streams

A safe actual Azure deployment MUST migrate and validate **all four existing HTTP Functions** and preserve each JWT, RLS, document-disabled, CORS, quota and backend contract. P0 issue #192 still shows intermittent failures *before* Python on a no-token tutor OPTIONS; adding experimental streaming settings while the app is unhealthy risks multiplying failures. No new paid Function App or third-party relay is authorized.

## Remaining integration checklist

1. Stabilize existing Function: two independent HTTP tests proving that Python handles evaluator, tutor, and /health without platform 503.
2. In an isolated staging environment or equivalently faithful Function host, test FastAPI extension with all four existing routes and protected account credentials; do not modify production hostname without a safe rollout/rollback.
3. Connect approved tutor's single privately keyed Azure OpenAI `stream=true` request **after** real auth+quota reservation. The existing server-owned rubric and deterministic LangGraph graph remain authoritative; free reference/quiz do not call model.
4. Add streaming response endpoint with `text/event-stream`, `Cache-Control:no-store`, `X-Content-Type-Options:nosniff`, matching origin CORS; never expose Azure key or quota receipt.
5. Parse/provider SSE and enforce bounded provisional text, finish reason, usage; if provider stream ends abnormally, output `error`, never `complete`. Client should mark or discard incomplete drafts and warn quota may have been reserved; never silently retry paid model calls.
6. Verify live desktop/mobile signed-in browser, authentication isolation, 401/403/429, stream interruption and billing, plus end-to-end LangGraph state and follow-up. Only then enable it on a private/isolated preview and measure actual performance.

**Do not conflate this correct, real incremental SSE code with a currently deployed or production-tested streaming service.**
