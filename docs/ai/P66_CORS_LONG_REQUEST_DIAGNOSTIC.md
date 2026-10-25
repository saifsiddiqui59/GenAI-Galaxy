# P66 — read-only refinement after live P65 network phases

## Actual P65 evidence (2026-10-25 UTC)
Protected diagnostic [#40174472620](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40174472620)
confirmed existing Function state Running, runtime Python 3.11, on-demand
memory 512 MB, maximumInstanceCount 2, `alwaysReady=[]`.
All requests used the public Azure HTTP address; the same public Azure
gateway IP `20.192.171.0` was observed in this run.

TLS established in ~0.56–0.64 seconds. Multiple anonymous POST and one
OPTIONS reached TLS but received **zero first response bytes within 20
seconds**. This rules out DNS/TCP/TLS negotiation as the direct cause for
those particular stalls. It does NOT prove whether the root cause is Flex
host startup, worker load, Azure gateway routing, or instance scale churn.

Browser-style OPTIONS with `Access-Control-Request-Method` and
`Access-Control-Request-Headers` received HTTP **204**, unlike earlier
minimal Origin-only OPTIONS which received 200. Both can be legitimate
depending on the Azure platform CORS handler. P65's initial requirement
for only HTTP 200 caused a false failure count; P66 fixes that checker.
This **does not** automatically establish that the returned CORS headers
are authorized or correct; the existing strict-Origin smoke still
performs independent CORS security checks.

Built-in Flex `Microsoft.Web/sites` metrics listed these valid metric
names: `MemoryWorkingSet`, `AverageMemoryWorkingSet`,
`InstanceCount`, `OnDemandFunctionExecutionCount`,
`OnDemandFunctionExecutionUnits`, `CpuPercentage`,
`AlwaysReadyFunctionExecutionCount`,
`AlwaysReadyFunctionExecutionUnits`, `AlwaysReadyUnits`.
The P65 query for `Requests,Http5xx` was invalid for this plan and
does not establish zero failures; P66 switches to the existing, valid
`OnDemandFunctionExecutionCount` metric and reads only the
nonsecret site-level CORS allowlist.

## Controlled long-connection classification

`DIAG_LONG_NOCHARGE_<main SHA>` on protected owner issue #183 sends:
one approved-Origin OPTIONS, one anonymous evaluator POST, one anonymous
tutor POST and one more tutor OPTIONS. Each anonymous POST has **one
100-second response window** and is never retried, even on timeout.
No user JWT or quota is sent, and consequently no billable AI invocation
can occur. The test cannot prove authenticated LLM quality.

If 100-second anonymous requests return 401 while 20-second ones
timeout, the service may be starting too slowly for the UI's 30-second
limit; measure operational impact before changing frontend waits.
If they also stall, investigate host-instance startup/routing with
Azure-supported telemetry or support. The owner rejected extra idle
cost: do not enable Always Ready or costly telemetry by default.

No Azure Function deployment, resource sizing change, user-secret
access, model call, invoice read, V6 code or unrelated project write is
part of this PR.
