# P65 — isolate Azure Function HTTP stalls without idle capacity

**Confirmed prior evidence:** [P63 anonymous cold-vs-warm #40169322045](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40169322045)
returned evaluator OPTIONS 200 in 2.66 s, anonymous POST 401 in 2.75 s,
tutor POST 401 in 0.99 s, and a repeated evaluator OPTIONS 200 in 0.99 s.
Two tutor OPTIONS requests timed out at 40 seconds. Each OPTIONS route exits
before JWT verification, imports of LangGraph, quota reservation and LLM requests.
Cold starts are explicitly acceptable to the owner; **do not increase idle cost**.

## New no-charge diagnostics

Owner-only issue #183 command: `DIAG_HTTP_PHASES_<exact green main SHA>`.
Protected `galaxy-p65-http-phase-readonly.yml` uses only the already-present
Galaxy Azure resource `GenAI_Galaxy/gengalaxy-p3-1429841605`. No app settings,
keys, model calls, new telemetry resource, log ingestion, cross-project access
or always-ready changes are requested.

1. Reads nonsecret scale/runtime controls and, when available, existing Azure
   platform request/HTTP 5xx counters (Azure Monitor *platform metrics*,
   not newly provisioned Log Analytics/Application Insights).
2. Sends real browser-style CORS OPTIONS with
   `Access-Control-Request-Method: POST` and
   `Access-Control-Request-Headers: authorization, content-type`, plus
   anonymous POST guaranteed to be denied before model/quota.
3. Reports for each fixed route/operation: HTTP status, curl exit code,
   DNS, TCP connect, TLS handshake, first response byte and total latency,
   plus public Azure peer IP (no client IP, payload, secret or headers).
   This distinguishes **transport/TLS** stalls from requests that connected
   over TLS but got **no first HTTP response byte**.
4. First request permits a bounded 90-second cold start; subsequent requests
   have independent 20-second budgets. There is **no automatic retry** of
   authenticated requests, no continuous ping and no scheduled workflow.

Expect OPTIONS 200 with approved public origin and anonymous POST 401; all
unexpected/timeout results fail the run. Separate cheap endpoints help decide
whether delays are shared by all HTTP routes or specific to the tutor.

## Release decision

If TLS completes quickly but first-byte waits occur intermittently, inspect
Azure Functions host/worker health and route affinity. A successful request on
another route does **not** prove a separate on-demand instance is healthy.
Don't claim root cause until evidence distinguishes platform, scaling,
host initialization, and Python runtime behavior. Don't lower max instances
or increase memory as a speculative fix—both can change throughput/charges.
Preserve 512 MB, max instances 2, alwaysReady empty.

Only after two independent full anonymous probes succeed should an explicitly
bounded signed-in evaluator/tutor quality smoke run. Real grading correctness
requires independent human assessment beyond a successful HTTP response.
