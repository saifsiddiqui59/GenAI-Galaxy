# P76 — Python-level health trace to diagnose intermittent Azure Flex 503

## Reproduced incident (2026-10-25 20:10 UTC)
Manual owner-authorized, zero-token [Azure runtime diagnostic #40229445287](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40229445287):
- Existing `gengalaxy-p3-1429841605` reported **Running**, Always Ready `[]`.
- Evaluator OPTIONS returned HTTP **200**, evaluator no-bearer POST returned application **401**.
- Immediately following tutor OPTIONS timed out after **40.001s, zero HTTP bytes received**, without any model call.

This is consistent with a host/worker/platform path fault, **not proof of a specific Azure service component**. The browser 90-second wait, 512→2048 MB→512 experiment, restart and warm-up have not resolved it. Azure Functions Flex docs state initial host and language-worker startup ceilings are separate from `functionTimeout`.

## Minimal P76 addition
- New **GET /api/health** route returns only `{"status":"ok","component":"galaxy-ai-function","model_called":false}`, no-store and app-generated `X-Galaxy-Trace-Id`. No identity, token, tenant, IP, instance ID, configuration, model or quota call.
- Existing manual authenticated Azure diagnostics probe this route once (75-second bound), capturing only HTTP status and boolean trace presence; then retain the original evaluator and tutor anonymous probes.
- 200 + valid app trace establishes real Python handler execution; a 503/timeout without it leaves upstream/worker/host issue unresolved. One health pass does not imply subsequent calls will succeed or share an instance.
- No changes to Python dependency set, async Function hosting model, LangGraph import path, Azure settings, 512 MB/max 2/Always Ready 0, public site, or billed AI.
- Azure Function code deployment only via existing owner-authorized `DEPLOY_BACKEND_<SHA>` after reviewed exact-main 3/3 CI. This is a **targeted diagnostic**, not a root-cause fix. P0 [issue #192](https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/192) remains open.

## Escalation
Microsoft [Flex Consumption guidance](https://learn.microsoft.com/en-us/azure/azure-functions/flex-consumption-how-to) recommends Function App **Diagnose and solve problems → Function App Down or Reporting Errors**, **Flex Consumption Deployment**, and `traces`, `requests`, `exceptions` if Application Insights is connected. This repo currently lacks accessible worker-level telemetry. Do **not** purchase monitoring, create ingestion, alter plan, or claim host-level root cause without further owner approval and verified diagnostics.
