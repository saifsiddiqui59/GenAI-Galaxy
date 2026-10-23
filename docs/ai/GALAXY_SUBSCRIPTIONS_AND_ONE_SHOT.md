# GenAI-Galaxy — Supabase Auth, freemium entitlement, and one-shot P3 rollout

**Source model:** WineShopPOS `src/context/AuthContext.jsx`, `src/context/SaaSContext.jsx`, `src/components/SaaSAccessBoundary.jsx` and its V4 `saas_shop_subscriptions` migrations. We adapted their **authentication + server-side plan decisions**, not WineShopPOS credentials, shop schemas, pricing or paid customer data.

## What's already implemented

- Galaxy's existing `app.js` uses Supabase `signInWithPassword`, `signUp`, `onAuthStateChange`, `resetPasswordForEmail`, normal-user Auth access tokens, owner-scoped progress, attempts and private documents. It did not need a second Auth system.
- `genai_study_plan_catalog` and `genai_study_user_subscriptions` are new Galaxy-only tables with RLS; only the signed-in owner can read their subscription. Browser clients have **no write permissions** to activate/upgrade a plan.
- `genai_study_my_subscription()` checks the **actual** Supabase user JWT; with no subscription record the user is FREE/ACTIVE with 5 AI evaluations/day. ACTIVE paid accounts must have an unexpired end date; TRIALING users an unexpired trial end date. Expired/cancelled/overdue plans revert to FREE; SUSPENDED accounts are blocked from paid evaluation. No browser plan parameter is trusted.
- Existing `genai_study_reserve_evaluation()` enforces the selected server-side DAILY plan cap plus a hard **50-total evaluations per UTC day**, atomically. FREE = 5, PLUS = 10, PRO = 20. `price_inr_monthly` is deliberately NULL because pricing was not provided/approved. There are **no payment gateways, payment links, recurring charges, invoices or checkout**. Paid entitlement rows can only be provisioned by trusted database administrators later.
- Existing golden evaluation / version lock / privacy-safe trace headers carry forward unchanged. No Application Insights, APIM or always-ready infrastructure is created.

## Actual test accounts (no stored passwords in git)

The protected manual workflow `galaxy-ephemeral-rls.yml` temporarily creates two confirmed `galaxy-rls-...` Auth users in only `vfoghlhtnifpnbevgufa`. It signs in with **normal user-level sessions**, tests Galaxy progress, attempts, private document RLS, both FREE subscription RPCs, negative cross-user reads, and an attempted forged upgrade that must be denied. The admin key is used **only** for Auth creation/deletion. Both identities are deleted in a `finally` cleanup; a killed runner can leave orphans, so inspect Galaxy-labeled accounts after interrupted runs. No test users are permanently created.

The separate manual workflow `galaxy-ephemeral-live-ai.yml` repeats those real login/RLS/plan checks **after backend deploy** and executes exactly one positive billable evaluation with a disposable confirmed user. It first verifies a fake JWT is rejected, then checks a genuine signed-in model response and safe `X-Galaxy-Trace-Id`. Only after a successful AI smoke run on **the same Git commit** can `galaxy-static-deploy.yml` receive `enable_evaluator=AI_READY` to publish the public evaluator URL. The repo's default `runtime-config.js` deliberately stays disabled.

## Run from VS Code / Git Bash

The launcher `scripts/galaxy_p3_one_shot.sh` verifies existing GitHub secret **names** without overwriting their values, securely prompts for missing keys, reads the already-public Galaxy publishable key from `app.js`, then runs five protected workflows in dependency order: Auth TEST → Flex PROVISION → evaluator DEPLOY → Auth + AI TEST → static DEPLOY with gated `AI_READY`. Every step must succeed before the next runs. No WineShopPOS or other repo is modified.

It requires GitHub CLI login, the existing Galaxy RG-scoped Azure OIDC Contributor permission, a Supabase admin secret for temporary Auth users and an **existing** Azure OpenAI pay-per-use model endpoint/deployment/API key. **It does not create an Azure OpenAI model or configure payment processing.** If a required secret or Azure resource is missing, the workflow fails visibly rather than claiming a deployed system.

**Hosted status:** Verify from GitHub Actions and the shared Supabase migration history before saying any accounts were created or any Azure resources deployed. CI source tests alone are not hosted verification.
