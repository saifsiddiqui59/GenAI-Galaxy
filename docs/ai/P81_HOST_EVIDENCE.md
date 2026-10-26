# P81 — Read existing Azure Flex host and worker diagnostics after P80 failure

## Verified problem (no paid AI)

The [P80 backend optimization](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/234) was deployed to the existing 512 MB, maximum 2, zero Always Ready Flex Function via [#40277863110](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40277863110).

Subsequent [read-only hosted #40278078727](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40278078727), October 26 06:08–06:09 UTC:
- GET /api/health: HTTP 200 with valid app trace, proving one Python handler executed.
- OPTIONS /api/practice/evaluate: HTTP 200.
- POST /api/practice/evaluate without JWT: **40-second timeout and zero bytes**.
- No token reservation, no model request or LangGraph invocation.
- **Cold start is plausible but not conclusively the root cause.** A separate 60-second Python-worker startup ceiling (Microsoft docs), request dispatch and instance lifecycle remain possibilities. Moving 394 KB server rubrics behind auth did **not** resolve pre-handler stalls.

## Safe existing-only P81 probe

Protected manual workflow `galaxy-p81-host-evidence.yml`, owner issue #183 exact-SHA command `DIAG_HOST_EVIDENCE_<current green main SHA>`, does **not** modify Azure or trigger an AI call.

1. Pin existing `GenAI_Galaxy/gengalaxy-p3-1429841605` with exact Entra client and subscription checks.
2. Read current nonsecret Flex runtime/scale and Function names (not settings values, JWTs, application keys).
3. Correlate free existing Azure Monitor `InstanceCount` (maximum) and `OnDemandFunctionExecutionCount` (sum) per-minute with the 06:08:53–06:09:33 UTC failure. Aggregate metrics do not reveal individual worker affinity; a zero counter is not direct proof of no host activity.
4. Query documented *existing* Microsoft.Web `runtimeavailability` and `sitecrashes` detector responses over the same UTC window, **only when already supported/accessible**. Print detector availability and count of abnormal periods, never raw logs, descriptions, stack traces or user content. Detectors may be unavailable on Flex or under the existing RBAC permissions. No Log Analytics, Application Insights, diagnostics settings or resources are created.
5. Leave the app at 512 MB/max2/zero idle; no repeat authenticated requests.

Official references: https://learn.microsoft.com/en-us/rest/api/appservice/diagnostics/get-site-detector-response?view=rest-appservice-2025-05-01 and https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale

## Go/no-go for streaming

Do not enable FastAPI HTTP streams, make paid Azure OpenAI calls, add Always Ready or close [P0 #192](https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/192) until sustained anonymous Python route health and authenticated quota/tenant safety are proved. If host detector responses or metrics cannot isolate the cause, the exact UTC response times and failed-worker context should be provided privately to Microsoft support. Never claim cold-start confirmed from duration alone.
