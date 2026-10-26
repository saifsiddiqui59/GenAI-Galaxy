# P80 — Conservative Python cold-start / worker-indexing optimization

## Why this experiment is warranted

One-instance P79 protected live workflow [#40237129727](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40237129727) showed:

| Sequential anonymous call | Result |
| --- | --- |
| Python `GET /api/health` | HTTP 200, app trace true |
| Evaluator POST | HTTP 503 after ~60.96 s, **no Python trace** |
| Tutor POST | HTTP 401, app trace true |
| Evaluator POST again | HTTP 503 after ~61.02 s, **no Python trace** |

Approved 512 MB, maximum 2, zero Always Ready **restored** and independently verified. An already responsive Python worker did not guarantee subsequent evaluator delivery; this **does not prove cold start**. Microsoft's official [Functions scale/timeout documentation](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale) states Python worker startup has a separate non-configurable 60s limit, whereas `host.json` `functionTimeout` controls *invocation execution*.

## Only backend code change

Historically `api/function_app.py` parsed the ~394 KB, >200-topic `api/rubrics.json` at **module import** for every Python worker and every anonymous/OPTIONS/health request even though neither needed it. Replace that eager parse with a `@lru_cache(maxsize=1)` `rubric_catalog()` function:

- Health, preflight and no-bearer HTTP authorization never load rubric JSON.
- Evaluator and tutor load the same server-reviewed rubric only **after successful authentication**. Cache is process-local and reused; no persistent state or shared cache.
- All topic IDs, grading prompts/contracts, LangGraph graph, identity, quotas, signed-in model count, API return shape, and no-auto-retry safeguards remain unchanged.
- No environment settings, new Azure resources, App Insights ingestion, parallel workers, new model providers, CORS or hosting changes.
- The improvement removes startup work, **not necessarily the ~61s platform 503**. Python worker/process startup may be blocked elsewhere. Treat outcome as experimental until two independent actual Azure tests prove no-charge route reliability.

## Acceptance

- Offline tests prove no module-level rubric read; actual dictionary contents loaded once after successful auth; no health/preflight/model call; quota checks remain after auth.
- Existing 3/3 GitHub CI and read-only hosted V5 browser tests.
- Deploy only to same existing DEV Function using exact-SHA owner-command bridge and protected workflow. Then run anonymous `DIAG_BACKEND_<SHA>` and `TEST_WARM_THEN_TUTOR_<SHA>`; no paid inference. If 503s persist, do not keep retrying or claim cold-start fix.
- P0 [issue #192](https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/192) remains open until robust Azure readiness is demonstrated.
