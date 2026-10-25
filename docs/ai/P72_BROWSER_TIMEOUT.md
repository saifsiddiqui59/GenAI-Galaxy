# P72 — Browser AI request timeout 30s → 90s (2026-10-25)

## Scope and reason

Owner requested a longer browser wait while investigating intermittent Azure Flex Consumption Python worker / gateway HTTP 503s. The isolated P61 frontend and main UI use `app.js` `aiJsonOnce()` for **both** evaluator and tutor. Raise only its default AbortController deadline **30,000 → 90,000 milliseconds**, and update the two user-facing timeout messages accordingly.

The 90s budget is long enough for the browser to *observe* a platform response after approximately 61s, but **does not repair** that response. A previously measured tutor request returned Azure HTTP **503 in 60.775s** with **no application trace**, after successful sequential anonymous 401 evaluator and tutor responses (issue #192, protected P70 second attempt, 2026-10-25 10:50–10:51 UTC). This is host/worker/routing evidence, **not proof** that a normal cold start caused it. A frontend timeout controls the caller; it does not modify the separate, nonconfigurable Flex host or language-worker startup limits. The backend `api/host.json` function execution timeout remains **45s**.

## Safety and cost

- Preserve a **single request** per explicit user action. **No automatic retry** after HTTP failure, abort or uncertain quota reservation.
- Preserve the 401/403/429/503 failure messages and provisional local-only fallback; do not display a fabricated AI grade.
- No changes to Function hosting, 512 MB, max two instances, alwaysReady zero, model quotas, Azure Functions code, app settings, secrets, storage or unrelated V6/Genie code.
- This is a **frontend wait-time adjustment**, not release acceptance. Interactive users may wait up to 90s for AI before fallback; HTTP 503 still fails promptly once received. Browser abort is not proof that the backend cancelled any in-flight work or avoided charges.
- Keep P0 issue #192 open; no paid Azure OpenAI evaluator/tutor call until the established no-charge reliability gates pass.

## Validation and deployment boundary

- Update `tests/test_p59_ai_timeout.cjs` to assert the new 90s default/messages while running **fast mocked 8ms abort tests** for both fetch and JSON-body hangs and verifying one network request. Include it in the routine GitHub CI job.
- Update the manual, protected, **isolated P61 preview** publisher's explicit source guard to require 90s and run P59 offline regression. This only permits publishing reviewed frontend bits and has **no automatic cloud deploy**.
- Merge only after actual 3/3 GitHub CI passes. Publish to existing P61 isolated preview only via its distinct approved protected workflow, then byte-verify hosted `app.js` and confirm the new timeout. Do not claim an already-hosted preview changed merely because GitHub `main` changed.

See https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/192 .
