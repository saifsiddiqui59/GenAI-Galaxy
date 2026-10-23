# P13 — no-payment, no-paid-testing release plan (2026-10-23)

## Owner's hard boundaries

- **NO payment gateway.** No Razorpay, Stripe, payment redirects, card collection, checkout, invoices or recurring billing. FREE/PLUS/PRO are internal entitlements only; `price_inr_monthly` stays NULL, and end users cannot self-assign an upgrade.
- **NO new paid AI model**, fine-tuning, paid evaluation pipeline, or Azure service provisioning. The dedicated model already deployed in P12 is not created or invoked by P13 QA. Real user requests to the existing model can still incur normal PAYG token charges; the app's authenticated quota is a *request cap*, not a cost-free guarantee.
- **Zero paid tests:** new source changes are tested with Python/Node unit tests, browser simulation, golden-case structure and existing reference rubrics. Do not run `galaxy_p3_one_shot.sh`, `galaxy-ephemeral-live-ai.yml`, or provisioning workflows again for P13. Do not claim synthetic/model-reported scores are independent quality results.
- Do not alter WineShopPOS, RetailGrowthAI or shared non-Galaxy Supabase data.

## Existing deployed result already independently proven

All six protected Galaxy workflows completed successfully on source commit `c12625931e99b8b00ffe6677f718fe263b1f1000`:

| Feature | GitHub Actions run | Result |
| --- | --- | --- |
| Disposable 2-user Auth/RLS and plan protection | [39952220136](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39952220136) | PASS |
| Dedicated India PAYG LLM provisioning | [39952291427](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39952291427) | PASS |
| Flex Consumption backend | [39952527715](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39952527715) | PASS |
| Authenticated evaluator backend deploy | [39952768305](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39952768305) | PASS |
| One earlier paid smoke (NOT repeated) | [39952989858](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39952989858) | PASS |
| Static site with approved AI_READY injection | [39953104627](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39953104627) | PASS |

This is deployment evidence, **not** proof that every UX/device/editorial scenario passed.

## P13 free/offline improvements

1. Hosted guest browser's byte-for-byte parity previously rejected the intentional AI_READY injection to `runtime-config.js`. `tests/public_asset_policy.py` now permits exactly that documented replacement, while requiring all other static assets to match the release commit, and keeps Vault/Speech endpoints blank. Tested offline, no paid evaluation or secret required.
2. `tests/test_zero_cost_acceptance.py` independently checks the approved config, payment-gateway absence, CI no-cloud/no-paid-call posture, server rubric coverage for ten golden questions, and manual read-only guest browser behavior. **No independent AI judge runs.**
3. Hosted browser acceptance remains a **separate optional read-only manual GitHub workflow**; it browses guest routes with no Supabase login or billable model evaluation. Not automatically triggered on CI or merged PR.
4. Domain lesson audit `scripts/editorial_audit.py` is structural/heuristic only. **245 unique lessons need SME factual/temporal/source checks**; do not mark them expert-certified using keywords or unreviewed content. Actual speech microphone acceptance requires a person's device/permission and cannot be certified by simulated browser CI.
5. Password recovery delivery must be exercised with an account owner/consented test user; the disposable accounts confirm emails by admin and **do not** validate real password-reset email delivery.

## Manual human follow-up, without new cloud charges

- Open <https://gengalaxy1429841605.z29.web.core.windows.net/> in desktop and mobile browsers; verify 17 planet navigation, guest-mode practice, reduced-motion preference, and that no paid model call is made without signing in. **Do not generate model evaluations just for QA.**
- Test microphone start/stop, permission denied, stop/retry, transcript edit, and mobile fallback with real hardware. Browser STT provider may process audio externally; obtain consent.
- Verify password reset email delivery with a dedicated own account, not other tenants' accounts.
- Require separate named technical reviewers and dated citations for lesson factual certification. Start with the high-risk editorial queue in `docs/reviews/P7_EDITORIAL_TRIAGE.md`, then review remaining lessons.
- No payment provider or paid upgrade workflow planned. Any paid tier, recurring billing or new AI spending needs a **new explicit request**; this P13 excludes it.

## Known limitations

- The hosted `AI_READY` site can call the existing PAYG model **when a real authenticated user explicitly selects AI evaluation**. This is a separate normal product operation, not a scheduled QA run; no-cost is not guaranteed for actual AI calls.
- Per-user FREE 5/day, PLUS 10/day, PRO 20/day, global 50/day are server-side request caps; P13 has **not** executed another paid quota acceptance (sixth-request) test.
- A separate APIM-style gateway, document malware scanner, durable Azure monitoring, paid model judges and server-side Speech broker are **not** deployed. Vault extraction and Speech broker remain disabled by design.
- Current branch is a code/QA release only; static site deployment of a new commit is not needed to ship these changes because public assets are unchanged.
