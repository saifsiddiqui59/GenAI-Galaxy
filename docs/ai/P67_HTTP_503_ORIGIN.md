# P67 — Source of intermittent tutor HTTP 503 response

## Evidence
- [P65 #40174472620](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40174472620): Azure TLS handshake in ~0.6s; multiple unauthenticated request attempts stalled without first HTTP byte for 20s.
- [P66 #40175161718](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40175161718): evaluator anonymous POST returned HTTP 401 after 2.55s; tutor anonymous POST returned HTTP **503 after 60.912s**, while TLS completed in 0.68s. Browser-style OPTIONS returned Azure HTTP 204. No JWT/model requests.

## Safe attribution
Galaxy's `api/function_app.py` emits `X-Galaxy-Trace-Id` for application-handled POST outcomes (including authentication 401 and handler 503), but a gateway/host-generated 503 ordinarily lacks it. P67's curl probes now examine headers in a disposable temporary directory and emit **only the boolean** `app_trace_present`: neither trace values, cookies, Azure request IDs nor header contents are published. A missing trace suggests (but alone cannot prove) the response originated before application code.

## Next
Run only the existing protected `DIAG_LONG_NOCHARGE_<exact main SHA>` from owner issue #183 after the reviewed PR has merged and current-main CI passes. If tutor again returns 503 after ~61s without application trace, investigate Azure Functions host/worker availability and platform HTTP routing before modifying the Python tutor, memory or idle capacity. A standard Azure support request with aggregate timing and no personal data may be needed because Application Insights is intentionally disabled and no ingestion budget has been approved. Do not claim fix until two independent read-only route checks pass and the app returns real authenticated responses.

No new Azure resource, Azure configuration change, Always Ready, billable model invocation, automatic retry or V6 modification.
