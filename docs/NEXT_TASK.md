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

## M11 coverage continuation

- After the ten-topic editorial PR is reviewed and CI passes, remaining scope is **88 overview-only topic entries**, plus domain expert/source verification for all expanded lessons and spoken-answer timing checks. Do not claim complete verified curriculum merely from eight sections.
- Continue authored batches by domain, preserving original topic IDs, regenerating `api/rubrics.json` and `docs/TOPIC_COVERAGE.csv` via the existing scripts, and enforcing regression tests.

## M12 — next curriculum and integration gates
- Complete the **78 remaining overview-only topic entries** through substantive, topic-specific content batches; retain editorial-unverified markings until expert and source checks and spoken interview-timing validation.
- Merge prerequisites in review order when GitHub-hosted runner dispatch recovers: #12 auth recovery, then stacked #13 microphone, independent #14 Vault security, #15 curriculum, then this M12 branch retargeted to main. Require all three GitHub CI jobs to pass on each PR and after each merge.
- Live two-account Supabase RLS, actual hardware microphone tests, production APIM/Functions security, malware scanning and cost monitoring remain separate acceptance gates and require already established approvals.

## M13 — current priority list after integration (supersedes earlier pending-PR notes)

The owner made this repository public, restoring GitHub-hosted CI execution. M8–M12 changes are merged to main via PRs #14, #18, #19, #20 and #21; old PRs #12/#13/#15/#17 were closed as superseded. **No merge/rebase action remains for those old PRs.** The CI install optimization in #21 passed its full PR checks; [post-merge main run #39831228218](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39831228218) also passed **3/3**, verifying the final integrated feature main build.

1. **Security and access acceptance (owner-approved):** Configure two isolated, pre-approved Galaxy test accounts and protected GitHub dev secrets, then deliberately run the manual-only Galaxy two-user RLS test with `TEST` confirmation. Do not reuse unrelated user data. Verify password recovery redirect allowlist, link delivery and live signed-in progress.
2. **Speech acceptance:** Test real microphone permission, rapid start/stop, draft preservation, sign-out, and mobile behavior after explicit approval for a new static preview deployment. Mocked browser CI is not hardware proof.
3. **Private API release design:** Real APIM per-user quotas and direct-origin network restrictions, verified model and speech-broker configuration, private extraction malware scanning/quarantine, staging JWT and tenant-negative tests, and owner cloud authorization are still required. The backend is source-only.
4. **Content:** Author the **78 overview-only topics** individually; review 167 distinct reference lessons with domain experts, citations/evidence and timed spoken answers. Do not claim the 168 expanded entries are factually verified.
5. **Operational safety:** Cost budget/alert for the approved Blob account, scoped keyless deployment role only if owner approves, review public GitHub history for sensitive/personal content, and maintain a no-secrets public source policy. Do not deploy Azure or apply hosted migrations automatically.

The existing public static Blob preview is an older deployment and does not automatically reflect merged main.

## P2 — updated next steps after six merged workstreams (supersedes earlier backlog totals)

- **Six P2 source PRs #24–#29 are merged.** Source implementation/readiness checks are complete for those PRs, **not** hosted acceptance or deployment. Final [feature main CI #39838287412](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39838287412) **passed all 3 jobs** on integrated feature commit `18bf47f8`.
- **66 remaining overview-only lesson topics** still need distinct, evidence-based eight-part explanations. Preserve 17 worlds, 246 entries and original V3 IDs. Run coverage/rubric generators and full curriculum regression tests after each authored batch.
- **Auth:** owner-approve real A/B Galaxy-only test accounts and protected dev secrets, then separately authorize manual `TEST` two-user RLS workflow. Offline key validation is not proof of hosted policy correctness. Verify password recovery redirect/email delivery with a dedicated account.
- **Mic:** owner-approve updated preview publish and use real devices to test permissions, start/stop, language recognition, transcript retention and denial fallback. Simulated CI is not hardware proof.
- **Backend:** require independently reviewed APIM quotas, network-restricted origin, JWT/tenant negative acceptance and malware quarantine; obtain an explicit separate Azure deployment approval. Current API remains undeployed.
- **Static preview:** existing account `gengalaxy1429841605` only. Backup and owner's **frontend-only** deployment approval first; never run upload on PR/push. Follow with real URL smoke and rollback evidence.
- **Quality/cost:** review public Git *history* for leaks (working-tree regex checks are incomplete), rotate any proven compromised credential, get SME/source review of every lesson and verify actual Azure regional prices before approving a budget alert.

A single coordinator can complete the remaining branch/PR/documentation tasks; the owner does **not** need six simultaneous ChatGPT chats. Do not claim those final live acceptance gates were automatically completed.

## P3 — CURRENT action list (supersedes the earlier 66-topic backlog)

**Completed:** Every one of the 246 curriculum entries now has an expanded eight-section lesson; there are 245 unique lesson records and zero overview-only entries. Source PR #31 merged, and current main [run #39843350678](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39843350678) passed 3/3. No more content *authoring* remains for the original 66-topic backlog.

**Still gated on external resources, explicit approval or human/device evidence:**
1. **User-approved live Auth/RLS:** set up two consented Galaxy-only Supabase users and protected dev credentials, confirm redirect allowlist, explicitly approve the manual `TEST` workflow, verify cross-user denial, cleanup and real recovery email. No claim of real acceptance yet.
2. **User-approved frontend-only Azure release:** back up the existing static files; verify least-privileged storage-account-scoped OIDC login; obtain explicit approval before uploading P3 `main` assets to existing `gengalaxy1429841605`; verify the actual public HTTPS content, SPA and rollback. GitHub merge alone does not deploy it.
3. **Real microphone acceptance:** after authorized static deployment, test Chrome/mobile hardware, permission-denied/retry/rapid stop and actual STT provider paths with consented test data.
4. **Azure backend readiness:** provision and validate JWT/authenticated APIM throttling, private Function ingress, vault malware quarantine, provider secrets/identity, monitored rollback and regional cost controls only after separately approved scope/budget. Existing backend is **source-only**.
5. **Expert/editorial validation:** review 245 technical lessons for factual/source/version accuracy, 60-second spoken timing, safe/accurate user project claims, and golden/regression questions; structural coverage is not SME certification.
6. **Public-repo security review:** audit Git history as well as current files for sensitive content; rotate actual compromised secrets if found. Cost budgets/alerts need owner approval and current verified regional prices.

Do not change RetailGrowthAI or WineShopPOS or conflate offline mocks with approved hosted/hardware evidence.

## P4 — release execution (supersedes previously requested authoring)

- **Offline:** P4 strengthens live preview SHA-256 parity checks for seven static assets and 246/246 topic coverage and updates stale README counts. Merge only on 3/3 GitHub PR checks and verify 3/3 fresh main CI.
- **Hosted:** After this change, run the protected *manual-only* existing-site deployment and then the read-only live hosted browser workflow. These two manual runs cannot be started by the currently connected GitHub tool; do not add automatic push deployment as a workaround.
- **Real users/hardware:** Complete the separate manually invoked Galaxy A/B RLS workflow with dedicated test credentials and live recovery email; capture physical microphone results on desktop/mobile. The shared project's RLS policy catalog is not this evidence.
- **Backend/security:** Source-only Azure Functions still need genuine APIM quotas, private ingress, malware scanning, SKU/budget constraints, staged negative tests and key management. Record expert lesson review and real spoken-duration results for 245 unique lessons.
- Detailed release checklist: `docs/reviews/P4_RELEASE_EXECUTION.md`.

## P5 — Diagnose repeated existing Blob publish failures, preserve OIDC

- Hosted Galaxy static deploy runs #39848334416, #39850171368, #39852100182, #39852486881, #39852746132 and #39853141328 all failed before uploading, although validation and OIDC login succeeded. The manually verified storage-scope Storage Blob Data Contributor grant exists for `GenAI_Galaxy` service principal client ID `737d67b7-4984-48bb-bb1f-5f62599f645c` / object ID `e7ea672f-4566-42c4-901e-9550eaf6e3f0`. The original deployment helper checked `staticWebsite.enabled` via a **data-plane** `az storage blob service-properties show --auth-mode login`, which failed with an undifferentiated Blob authorization error before the actual upload.
- P5 changes: pin the protected GitHub `AZURE_CLIENT_ID` to the approved application ID (fail fast if incorrect), inspect website enablement using Azure ARM `az storage account blob-service-properties show`, separately test direct Blob access to the existing `$web` container using OIDC, and give a stage-specific error. No storage keys, new IAM roles, network broadening or automatic deployment are introduced.
- After PR merge and 3/3 post-merge CI, re-run **only once** the manual GitHub static deployment using `DEPLOY`. If the identity check fails, correct the existing `dev` secret. If OIDC Blob access fails, investigate RBAC propagation, role inheritance, storage firewall and Azure deny assignments based on specific logs before choosing any alternate credential. Once successful, run manual live-browser parity acceptance. Do not claim deployed until real run logs confirm seven file uploads.

## P6 — GitHub Actions-only disposable RLS test users (2026-10-23)

- The owner chose to skip browser acceptance temporarily and requested all future executable testing through **GitHub Actions**, not VS Code. Azure static website deployment **succeeded** in manual run [#39858392869](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39858392869); the newer live-browser run #39858621086 was **cancelled before its hosted checks** and is intentionally deferred.
- New protected manual workflow `.github/workflows/galaxy-ephemeral-rls.yml` uses `TEST` confirmation and only `main`; not triggered by push/PR. On GitHub runners, the `dev` environment secret `GALAXY_SUPABASE_ADMIN_KEY` is used strictly for **Auth admin create and delete** of two new random, disposable, email-confirmed `@example.com` test identities. It does not access clinic tables or new databases. `GALAXY_SUPABASE_PUBLISHABLE_KEY` is used with each real user's JWT for existing `tests/live_rls_check.py` progress, attempts, documents and private-bucket isolation checks. Cleanup uses Admin API and masks credentials.
- **Not run against hosted Supabase yet.** Set both GitHub `dev` environment secrets through GitHub Settings → Environments → dev: `GALAXY_SUPABASE_ADMIN_KEY` (new Supabase `sb_secret_...` or project-specific legacy service-role key; do not paste in chat), `GALAXY_SUPABASE_PUBLISHABLE_KEY` (public key/legacy anon). Then use Actions → `Galaxy ephemeral two-account RLS test (manual)` → Run workflow → `main`, input `TEST`. Require actual success and verify account cleanup. Never add push trigger to an admin-key job, expose admin key in web assets, or reuse clinic account credentials.
- If the test is cancelled before cleanup, review residual `galaxy-rls-*` dummy users in Supabase Auth; do not delete other users. No protected keys or test passwords are ever committed.

## P7 — Current execution plan; parallel PRs landed (2026-10-23)

**Completed source work:** #36 Auth cleanup tests; #37 private API redirect/project safety; #38 editorial triage across 245 lessons. Integration main commit `d9da0e2` GitHub CI run #39922110990 **3/3 passed**.

**Next executable gates (GitHub Actions UI, not local VS Code):**
1. Configure protected `dev` GitHub environment secrets `GALAXY_SUPABASE_ADMIN_KEY` and `GALAXY_SUPABASE_PUBLISHABLE_KEY` securely. The connected GitHub tool cannot create environment secrets or manually dispatch Actions. Then run `Galaxy ephemeral two-account RLS test (manual)` on `main` with `TEST`. Only real success and cleanup prove login/tenant isolation.
2. P3 infrastructure remains source-only. Review an explicit secured Azure Functions/APIM + Foundry model + Speech deployment design: per-user authenticated quota, direct-origin block, legitimate gateway identity and backend credential isolation. Implement independent malware scan/quarantine before Vault extraction. Provider test costs/network configuration and cloud provisioning require an explicit deployment approval; no such action has happened.
3. Expert-review all 245 lesson records with source/version proof and spoken timing; use `docs/reviews/P7_EDITORIAL_TRIAGE.md` for initial risk grouping. Heuristic flags are not a passing domain audit.

**Intentionally excluded by owner:** P4 spending/monitoring work. Browser and physical microphone tests deferred. Basic authentication, authorization and API security remain mandatory for safe backend deployment. Do not alter clinic or other shared Supabase tables or other repositories.

## P8 — cost-first P3 backend actions (2026-10-23)

**Implemented in source:** direct-consumption evaluator guard; atomic per-user AND global daily paid-call cap; 503 on absent quota, 429 on exhausted limit; disabled Speech token and unscanned Vault in cheap mode; reviewed SQL draft; manual `PROVISION` and `DEPLOY` Actions, zero Always Ready, no APIM.

**Hosted prerequisites:** Approve/apply the **Galaxy-only** quota SQL to the already shared Supabase project; configure protected `dev` publishable/model secrets; validate an actual existing Azure OpenAI pay-as-you-go deployment and Central India Flex availability; grant narrowly scoped Azure RG management permissions to the known Galaxy OIDC principal. Then manually run the new workflows in GitHub Actions with `PROVISION` and `DEPLOY`. These workflows are not run by PRs or pushes; the GitHub connector cannot dispatch them.

**Remaining after backend release:** Negative real JWT tests, actual quota 429/503 tests, consented two-user Supabase RLS workflow, and a separately reviewed frontend runtime URL change. Browser/physical mic tests deferred and P4 monitoring excluded at owner's request. No backend cloud provisioning or database migration has yet occurred.

## P9 — live quota migration complete; Azure backend still blocked (2026-10-23)

**Completed:** Supabase migration `20261023101156_galaxy_p3_consumption_eval_quota` applied only to Galaxy quota objects. RLS/grants inspected and quota behavior tested in a rollback-only transaction (5/6 per-user and 50/51 global; zero retained test counters). Added GitHub source fix to `COALESCE`, remote Python build, and Flex-region/Always Ready checks.

**Pending before real paid AI execution:** Verify RG-scoped Azure provisioning privileges for existing Galaxy OIDC principal, configure protected GitHub `dev` model/publishable secrets, and manually dispatch `galaxy-p3-flex-provision.yml` with `PROVISION`, then `galaxy-p3-flex-deploy.yml` with `DEPLOY`. These actions may incur usage costs and require a real existing Azure OpenAI pay-per-token deployment. Workflow triggers remain manual-only; we cannot call GitHub workflow_dispatch through the currently connected app, alter protected dev secrets or authenticate to the owner's Azure subscription in this chat.

**Separate incomplete:** Two-user hosted Auth/RLS test using disposable users; actual signed-in AI requests and real HTTP 429/503 checks. Do not count synthetic database JWT simulation as real sign-in. P4 monitoring and manual browser/mic acceptance remain deferred per owner.

## P10 — lightweight evaluator tracing and release quality gate

**Source completed:** Privacy-safe per-request `X-Galaxy-Trace-Id` and structured Function-stage/token/latency/result telemetry, 10-case versioned golden dataset, independent-score quality policy, fail-closed gate checker and offline automated tests. Root guide: `docs/ai/evaluation/README.md`.

**Needs actual evidence:** Deploy the consumption evaluator via protected Github Actions after model secrets configured; verify real authenticated responses plus correlation headers. Run real independent ground-truth/LLM judge evaluation across all cases (never treat model-reported accuracy/clarity as groundedness), then provide actual safely aggregated results to `python scripts/gate_galaxy_eval.py <actual-scored-evidence.json>`. No synthetic CI fixture represents independent quality success. Optional Foundry/Log Analytics trace ingestion is **not** configured or claimed, since owner opted out of P4 monitoring resources.

**Existing blockers remain:** Galaxy P3 Azure Function/AI deployment and disposable two-account hosted login/RLS acceptance. Avoid WineShopPOS resources/secrets.

## P11 — Supabase plans and five protected Galaxy Actions

Source: WineShopPOS's AuthContext, SaaSContext, SaaSAccessBoundary and V4 schema. Existing Galaxy Supabase login and password recovery remain intact. New Galaxy-only FREE 5, PLUS 10, PRO 20 daily model-call caps use server-side Auth and RLS; global 50/day stays. Prices and checkout are not implemented. Verify subscription migration in shared Galaxy Supabase before running the launcher.

In VS Code Git Bash, from the Galaxy main branch run bash scripts/galaxy_p3_one_shot.sh. It verifies/prompt-for protected GitHub dev secrets, runs disposable user login/RLS+plan TEST, Azure Flex PROVISION, model DEPLOY, one real AI TEST and finally gated static frontend DEPLOY. Every stage stops on failure. No GH workflow has been dispatched here. Browser/microphone acceptance and P4 monitoring remain excluded.


**P11 database update:** Galaxy subscription migration `20261023110022_galaxy_freemium_subscriptions_v1` is NOW applied and synthetic SQL FREE cap test passed. Real Auth login/2-user RLS/plan test and actual Azure model deployment remain for the GitHub one-shot runner. Never treat synthetic SQL tests as real login acceptance.


## P12 — unblock missing LLM before Functions (2026-10-23)
- A user read-only CLI check confirmed no Azure OpenAI/AIServices resource within `GenAI_Galaxy`. The previous launcher mistakenly prompted for an endpoint that did not exist. Fixed: manual `galaxy-p3-model-provision.yml` and source script create/reuse an isolated Azure OpenAI S0 resource in South India, deploy `gpt-4.1-mini` regional Standard at bounded 5 throughput capacity and verify expected model/version/location.
- The Galaxy one-shot now launches dedicated model provisioning BEFORE backend deployment, which fetches the real endpoint and model key using OIDC, never prompting for them. This remains conditional on Azure model quota/access. Do not copy WineShopPOS endpoint/keys or create global deployment as fallback.
- Run `bash scripts/galaxy_p3_one_shot.sh` from a clean `main` checkout (use separate local Galaxy deploy clone to preserve work in `chore/m5-azure-actions`). Only actual GitHub Actions results prove cloud completion. User-owned subscription is pay-per-use; verify charges directly in Azure.

## P13 — no payment gateway and no additional paid AI QA (2026-10-23; supersedes stale hosted status above)
- **Hosted baseline is already live**: Supabase disposable RLS #39952220136, India PAYG model provisioning #39952291427, backend Flex provision #39952527715, API deploy #39952768305, one earlier live AI smoke #39952989858 and static AI_READY publish #39953104627 all passed. Do **not** repeat these paid/provisioning steps for routine QA.
- **Hard cost boundary**: owner says NO payment gateway, checkout, recurring payment, new paid LLM, fine-tuning or billable evaluation tests. Existing model token usage is not free and user-triggered AI evaluations should remain bounded by server quota; do not claim zero operating cost.
- P13 source work: pure, free hosted asset parity verifier accepts only the explicitly staged public evaluator endpoint; all other public files must match exactly. Offline Python checks assert no payment provider, no paid workflows in push CI, and 10 golden-question topic coverage without an independent model call.
- **Human-only remaining**: actual microphone hardware/browser permission checks, real password-reset email, SME factual reviews of 245 lessons. Optional manual *read-only guest* website browser test incurs no LLM call. Vault extraction and paid Speech broker stay disabled until separately planned.
- See `docs/reviews/P13_ZERO_COST_ACCEPTANCE.md`. No payment integration planned.


## P21 V4 preview — follow-up acceptance gates

1. Review the real [isolated KayKit preview](https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-3d-v4/index.html?demo=1) at 1440x900 and 390x844 on physical devices; do not call stylized low-poly art photoreal.
2. Validate natural character turning, repeated miniature planet pickup and sack deposit, exact hand alignment and mobile GPU frame rate with manual screen recording before merging source PR #96.
3. Use consented Galaxy test accounts for authentic progress and two-user isolation validation; demo progress is not authentic mastery.
4. Keep root $web/index.html unchanged; release future approved revisions under a new preview prefix with an immutable tested SHA.
