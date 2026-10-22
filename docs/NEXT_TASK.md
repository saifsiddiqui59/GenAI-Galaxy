# Next Tasks — after Azure static preview (2026-10-22)

## Completed, independently checked
- Private Galaxy repo, GitHub Actions CI, feature PRs #1–#5, and dedicated Entra GitHub OIDC trust.
- Resource group GenAI_Galaxy in centralindia, one low-cost GPv2 Standard_LRS account gengalaxy1429841605, and Blob $web static website.
- Website: https://gengalaxy1429841605.z29.web.core.windows.net/ ; GitHub Actions HTTP smoke #39804008329 verified all eight routes as HTTP 200. No additional cloud backend resources deployed.

## Remaining, in dependency order
1. **Browser acceptance:** Owner inspect real site on mobile/desktop, planet clicks, content, reduced-motion setting and microphone permission. GitHub browser test uses simulated STT, not live hardware.
2. **Live authentication / isolation:** Verify existing Supabase voice_agent_call sign-in, progress rows, RLS, vault permissions, password/reset and negative two-user tests using Galaxy-only fixtures. Never modify unrelated tenants/projects.
3. **Repeat deployments:** Set GitHub dev environment variable GALAXY_STORAGE_ACCOUNT=gengalaxy1429841605; assign narrowly scoped Storage Blob Data Contributor only on this account to the Galaxy OIDC service principal if using existing manual keyless deploy workflow. The initial bootstrap's temporary account key was not persisted.
4. **Private API architecture:** Scope and approve secure Azure Functions + APIM/gateway, per-user quotas, JWT checks, direct-ingress restrictions, Speech broker, model judge, malware scanning and secure document extraction. Do not turn these on merely because the website is live.
5. **Content:** Author the remaining 98 overview-only topics individually. Complete reference verification, SME sign-off, interview-answer timing and regression checks; no generic filler or claiming model review is a factual grade.
6. **Monitoring/cost:** Set Azure spending alert and estimate blob capacity/request costs; retain explicit manual control over further Azure provisioning.

**Site is a publicly accessible frontend preview, not production readiness.**

**Automated browser acceptance update:** Live guest-mode Playwright passed in GitHub Actions #39804869900 for desktop/mobile/reduced motion. Manual owner review of UX, actual microphone/STT permission, real Supabase sign-in and user isolation are still outstanding.

## M7 — completed client safety PR #9; live verification still pending

- Implement owner-scoped cloud reads, fail-closed foreign-row checking and sign-out race cancellation; wire two-account mock tests into CI. Verify the PR's real GitHub Actions run before merge.
- **Still blocked from marking live isolation complete:** Obtain two consented Galaxy-only auth test accounts and perform real signed-in positive/negative progress, attempts and private bucket tests including unauthorized insert/upsert/read/delete. Do not touch unrelated `voice_agent_call` data.
- Follow-up: password/reset UX and authenticated browser smoke; then microphone hardware/STT and an approved gateway-backed service architecture. Backend provisioning and paid Azure deployment require explicit approval.

## M7b — manual live Supabase RLS acceptance (test harness only)

- M7 client safety PR #9 merged; post-merge main CI #39807636506 passed 3/3. Do not mistake this for live sign-in/RLS verification.
- The manual-only `.github/workflows/galaxy-live-rls.yml` requires the exact typed `TEST`, protected GitHub `dev` environment, and existing *dedicated* Galaxy test accounts A/B. Set only `GALAXY_SUPABASE_PUBLISHABLE_KEY`, `GALAXY_TEST_A_EMAIL`, `GALAXY_TEST_A_PASSWORD`, `GALAXY_TEST_B_EMAIL`, `GALAXY_TEST_B_PASSWORD` as protected environment secrets. Never put them in code.
- Only after those accounts are provided and owner opts in, run `Galaxy two-account RLS acceptance (manual)` from `main`, inspect true results, and remedy failures. This runner performs only scoped Galaxy fixture writes and cleanup; it is not scheduled on pushes, PRs or deployments.
- Password recovery/account setup UX, actual microphone hardware, secure model judge/gateway, private PDF extraction, 98 lessons, and cost monitoring remain separate unfinished tasks.

### Status checkpoint after PR #10

- PR #9 **merged**; actual main CI #39807636506 passed 3/3.
- PR #10 **merged**; actual main CI #39808755655 passed 3/3. The manual signed-in Galaxy two-account RLS workflow is now available on main, but has **NOT** run and requires existing dedicated test accounts/secrets in the protected `dev` environment.
- Only run the protected `Galaxy two-account RLS acceptance (manual)` workflow after dedicated A/B credentials are available; typed confirmation `TEST`. No cloud backend or other paid Azure resources approved.

## M10 backend release gates

- Deploying private extraction remains blocked on actual gateway quota policy and ingress restrictions, malware/quarantine scanning for private uploads, real account auth/RLS and owner approval. The env marker alone is insufficient proof of security.
- Validate read/update owner filters and negative cross-user tests with dedicated Galaxy fixtures after approval; no hosted service has been changed by this PR.

## M8 follow-up — Auth recovery / release gates

- Auth password recovery code added. Verify Supabase Auth URL allowlist, deliver reset email and finish recovery using a consented dedicated Galaxy test account before claiming live auth acceptance.
- M7b two-user real RLS remains blocked on two dedicated test users and protected GitHub `dev` secrets. Do not run on unrelated credentials.
- Next independent work: speech recognition reliability and microphone UX tests; backend model review/security architecture still needs deployment approval; 98 lessons and cost monitoring remain.

## M9 follow-up — real microphone acceptance

- After M8 lands and M9 CI passes, manually test Chrome/Edge microphone permission allow/deny, interim/final transcript edits, rapid start/stop, navigation and sign-out on the real HTTPS site after an approved static deploy.
- Browser-native recognition remains dependent on browser provider/remote processing. Azure fallback remains disabled until a secured authenticated HTTPS broker and quota gateway are approved and deployed.
