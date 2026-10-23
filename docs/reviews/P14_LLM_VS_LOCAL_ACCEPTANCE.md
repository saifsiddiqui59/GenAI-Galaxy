# P14 — AI vs local interview feedback (2026-10-23)

## What was wrong

The simulator always rendered a local keyword score immediately. It attempted the live model only when **all** of the following happened: the deployed public runtime evaluator URL was set, Supabase was initialized, a user had successfully signed in, and the model HTTP request returned valid JSON. A guest or failed API call still received `LOCAL CONCEPT CHECK · NOT A FACTUAL GRADE` with no persistent explanation. This looked like an LLM grade, even though no model was called.

## P14 behavior

- **Guest:** `Check concepts locally (free)`; shows `Guest mode` and a visible **Sign in for AI evaluation** button when the AI endpoint is configured.
- **Signed in:** `Evaluate with AI (uses model tokens)` is a deliberate action, with a second **Local check (free)** button to avoid spending model tokens.
- **Model success:** `SERVER MODEL REVIEW`, model-estimated accuracy and clarity (explicitly not independently fact-checked), missing concepts, feedback and improved answer.
- **Model request denied/failed:** HTTP 401/403 prompts to sign back in, 429 explains daily quota, 502/503/504 explains temporary service/quota failure; invalid payload and network failures have distinct descriptions. A provisional local score is displayed **with a persistent reason**. It never masquerades as LLM grading or grants mastered status.
- **Model not configured:** local check is explicitly labeled; it cannot quietly pretend to be a server review.
- **Security and cost:** existing Supabase user JWT remains mandatory for paid model path. No client-side provider API keys, no new AI deployment, no fine-tuning or payment gateway. The existing backend daily model quotas remain unchanged. The tests use entirely mocked requests, not real Azure OpenAI calls.

## Validation and deployment gate

The source PR runs the existing three offline CI jobs plus `tests/test_evaluator_ui.cjs`, which mocks guest, valid model results, deliberate free mode, expired sessions, invalid model output, 429, 503 and missing API config.

Existing static deploy initially required a successful paid smoke **for the exact new frontend Git SHA**, which would require new token spending. The P14 protected **manual-only** Azure static workflow instead can reuse the previously verified disposable model smoke at immutable commit `c12625931e99b8b00ffe6677f718fe263b1f1000` only if Git proves that all changed paths since that commit are among `app.js`, `docs/*`, `tests/*` and the explicitly reviewed `galaxy-static-deploy.yml` workflow. Any other changed path (backend, model, SQL, deploy scripts, new frontend framework, runtime-config, etc.) **fails closed**.

**Not a hosted deployment claim:** After merge, run `Galaxy static website deployment (manual, existing only)` on main with `confirm_deploy=DEPLOY` and `enable_evaluator=AI_READY`. No model smoke needs repeating if the strict allowlist passes. This action overwrites only the existing approved Galaxy Blob static site; storage request costs may be nonzero but there are no model requests. The connected GitHub app cannot dispatch this manual workflow in this conversation. Until it succeeds, the live website may still show the old UI.

The open Genie Guardian PR #47 touches `app.js` and the static workflow, so coordinate it separately; do not silently merge it or loosen the provenance allowlist.

## Real-browser check after the manual static deploy

1. Open <https://gengalaxy1429841605.z29.web.core.windows.net/> as guest, select a lesson, practice, and verify `Check concepts locally (free)` and an explicit local-not-AI message.
2. Open sign-in, use your existing legitimate Galaxy account; the new buttons should be `Evaluate with AI (uses model tokens)` and `Local check (free)`.
3. Use **Local check (free)** to verify no API call is attempted. You need not run a paid live AI check merely to confirm the UI. To validate a real model answer in normal product use, deliberately choose `Evaluate with AI` knowing Azure PAYG usage incurs token charges.
4. Never use a payment gateway or run paid golden-evaluation/LLM-judge workflows to satisfy P14.

No real phone microphone, password-reset email or SME signoff was attempted as part of this frontend accuracy fix.
