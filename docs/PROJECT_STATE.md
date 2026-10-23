# GenAI Galaxy Project State — 2026-10-22

## M6 — LIVE STATIC PREVIEW (verified 2026-10-22)

- All four initial development PRs (#1–#4) and preview PR #5 were merged into main. GitHub CI passed on the committed Galaxy code; earlier failed Playwright runs were addressed by pinning Ubuntu 24.04 and the Playwright-managed browser.
- The dedicated GitHub OIDC identity signed into Azure and read the GenAI_Galaxy resource group successfully: [Azure verification #39801831000](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39801831000). Azure region confirmed centralindia; the group was initially empty.
- Explicit owner approval permitted provisioning a single Standard_LRS GPv2 Storage account: gengalaxy1429841605, in GenAI_Galaxy. The one-time OIDC bootstrap [run #39803629502](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39803629502) succeeded and uploaded seven allowlisted public frontend files. The first immediate curl returned 404, but propagation was resolved.
- Public website: **https://gengalaxy1429841605.z29.web.core.windows.net/**. Independent [HTTP smoke #39804008329](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39804008329) returned HTTP 200 for homepage, index.html, styles.css, app.js, runtime-config.js, both curriculum/lesson JSON files and the speech adapter.
- Automatic bootstrap and website-smoke push triggers were removed immediately after scheduling. Future cloud workflows are manual-only. Azure resource charges apply; no production backend deployed, and no Vault private content or secrets were uploaded.
- Static preview is **not** evidence of live Supabase sign-in/RLS safety, production grading, backend model evaluation, speech token broker or scanned-PDF ingestion. 148/246 authored curriculum entries and 98 overview-only entries remain the prior tested editorial state. Human content review remains outstanding.


**M6 live hosted-browser acceptance:** [run #39804869900](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39804869900) passed Playwright on the *real public URL* for desktop 1440×900, mobile 390×844 and reduced-motion 1440×900. All 17 planets, chapter/lesson navigation, open-text practice feedback, guest vault gate and absence of page JavaScript exceptions were verified. This does not test live hardware STT, authenticated Supabase accounts or backend endpoints.

**Historical M3–M5 notes below are retained for provenance; their older local-only claims are superseded by M6.**

**M3 LOCAL DEVELOPMENT/TESTS — NOT GITHUB-PUBLISHED OR DEPLOYED.**

V3 source is preserved without modification. The 17 original chapter/planet identifiers and 230 original topic IDs remain; 16 reviewed-for-duplication discovery records yield 246 topic entries.

## M3 local changes

- Wrote 98 additional distinct topic-specific eight-part lesson records across RAG/prompt engineering, LangGraph/agents/MCP, banking speech, eval/quality, LLM internals, security and Databricks. **147 unique written lessons map to 148 topic entries** (Semantic similarity is in two chapters). The remaining **98 entries are overview-only**, not falsely marked complete.
- Open-answer practice now asks retry questions about **reference concepts not explicitly mentioned**, rather than a generic retry every time. Offline keywords still never award mastery.
- Added user-triggered retry of failed private PDF/DOCX text extraction when the optional authenticated server is configured. Stored files are not silently sent to another provider.
- Added a fail-closed gateway-attestation guard to **all three** Azure Function routes. Production additionally requires APIM per-user quotas, stripping/unforgeably injecting the secret header, and **network-level restriction of direct Function ingress**. A shared secret header alone is not security/proof of rate limiting.
- Regenerated server-owned rubrics and topic-by-topic coverage. Current content lacks SME signoff and live response-timing tests: 128 of 147 reference answers are 60–140 words.

## Verification and blockers

Local unit tests: **16 Python passed**; Node engine passed; app and Functions syntax checks passed; Playwright Chromium desktop/mobile/reduced-motion and simulated browser-STT checks passed. These validate a prototype, **not** cloud services or microphone hardware. Full staging test and two-user Supabase RLS / storage isolation remain unverified. No paid cloud resources created and existing Supabase project was not mutated.

GitHub private repository `saifsiddiqui59/GenAI-Galaxy` continues to return **404** through the connected GitHub account. The connector exposes no repository-creation operation. No remote PR, Actions run or Azure deployment happened. RetailGrowthAI and WineShopPOS were untouched.

Local served-site Playwright navigation was also attempted but **blocked by the execution environment's localhost restriction**; this is neither a product-pass nor an application failure and is excluded from completed test claims.

## M4 — GitHub coordination readiness (local only, 2026-10-22)

Read RetailGrowthAI `AGENTS.md`, CI documentation, parallel-work plan and coordinator state through the GitHub connection. Verified identity `saifsiddiqui59` and write permission on the separate private RetailGrowthAI repository; no changes to it. Verified that `saifsiddiqui59/GenAI-Galaxy` returns 404 and is absent from the authenticated repository list; the available GitHub connector has no `create_repo` operation.

Implemented a Galaxy-only Git Bash publishing helper, documented an M2/M3/M4 stacked draft-PR sequence, added read-only safety CI (third job), bounded CI timeouts/concurrency, static config/repository guard tests and the missing public runtime-config deploy asset. Local **20 Python tests** and Node learning-engine/syntax checks passed. Mocked Playwright desktop/mobile/reduced-motion navigation and microphone transcription also passed. Reproducible rubric and coverage artifacts matched committed state: **148/246 authored entries, 98 incomplete**.

No GitHub remote, PR, actual GitHub Actions run, Supabase mutation or Azure deployment was created or verified in M4. Browser tests still mock voice and backend. Production readiness remains blocked by the prerequisites in `NEXT_TASK.md`.

## M5 — existing Azure + GitHub Actions wiring (LOCAL ONLY, 2026-10-22)

Owner supplied `GenAI_Galaxy` for both Azure resource group and Azure application. Neither Azure object has been verified through a cloud connection. Read RetailGrowthAI's separate OIDC workflow and official GitHub/Microsoft OIDC guidance without changing RetailGrowthAI or WineShopPOS. Prepared Galaxy-specific manual read-only OIDC/RG-inventory workflow and a separately gated workflow to upload an allowlist of public static site files to an existing Storage account. Added fail-closed deploy helper, unit guard tests, and exact app/RG GitHub environment setup instructions (`docs/AZURE_GITHUB_OIDC.md`). Resource group, storage and Entra trust remain unverified. Galaxy repo remains 404: **no hosted GitHub Actions run, OIDC login, Azure deployment or cloud mutation occurred**.

## M7 — authentication synchronization safety (PR #9)

- Continued from the verified M6 static preview. Live `voice_agent_call` Galaxy table/policy metadata was inspected read-only: progress, attempts, and documents have RLS with user-id ownership policies; the private `genai-study-docs` bucket has an 8 MiB limit and user-prefix storage policies.
- Frontend patch explicitly scopes Galaxy progress, attempts and document reads to the signed-in user ID, rejects unexpected owner/path rows, scrubs private state on sign-out/account switch and invalidates slow reads from old sessions. Private document delete is scoped by both document ID and owner ID.
- Added deterministic two-account mock regression checks for account switching, foreign-row rejection and sign-out race, wired into GitHub Actions. These are not real authenticated two-user network/RLS tests; no Supabase records were created or modified, and no Azure backend deployed.
- PR #9 carries the fix and unit/CI verification; hosted two-user Supabase network verification remains a separate release gate.

## M7 verified merge and M7b live-isolation acceptance preparation

- Auth hardening PR #9 squash-merged to main at `479ba930` after code-bearing commit `592e4f14` passed all three CI jobs; commits after that passing run modified documentation only. Post-merge main Galaxy CI [#39807636506](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39807636506) **3/3 passed**.
- M7b adds an optional manually triggered, protected GitHub `dev` acceptance workflow using two existing, distinct Galaxy test accounts. It creates small random temporary fixtures only in `genai_study_*` tables and `genai-study-docs`, tests positive and negative user isolation and attempts cleanup. It does not create accounts or use privileged Supabase keys.
- **Not yet run live:** two real test account credentials and the publishable key must be configured securely in the protected GitHub `dev` environment. Passing static guard tests alone must not be recorded as a live RLS pass. No Azure service/provisioning change or Supabase mutation from this feature PR.

### M7b merge verification — 2026-10-22

Manual-only live-RLS harness PR [#10](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/10) merged to main at `0da4cea9528de267b3e1bfd1aa36665144368f9f` after its 3/3 PR jobs passed ([#39808370770](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39808370770)). Independent post-merge main CI **3/3 passed**: [#39808755655](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39808755655). The live two-account workflow has **not** been triggered; signed-in Supabase row/storage isolation is still unverified without test credentials. Cloud release and new paid resources remain unapproved.

## M10 — private extraction quota and owner-scoping hardening (feature PR)

- Strengthened existing undeployed Azure Function source: `vault/extract` refuses requests unless `GALAXY_VAULT_GATEWAY_RATE_LIMIT=active` is set, mirroring model-evaluation and speech-token gates. This environment marker is **not proof** the external gateway enforces user quotas.
- Both document SELECT and PATCH include server-verified `user_id` and UUID document ID filters in addition to existing Supabase RLS. Added pure owner-filter and static route-guard regressions.
- Production remains blocked by actual gateway quotas, direct Function ingress isolation, malware quarantine, dedicated authentication/RLS tests, owner deployment approval and CI. No cloud or hosted database action was performed.

## M8 — password reset UX (code prepared)

- Added account recovery request, same-origin/path Supabase reset redirect and password update from Supabase `PASSWORD_RECOVERY` session. Password input requires eight characters for recovery; no custom password storage or elevated credentials.
- Regression test `tests/test_auth_recovery.cjs` covers reset redirect, sign-in/sign-up compatibility, recovered session and expired-session refusal. Real reset email delivery and recovery remain unverified; hosted Auth redirect URL needs allowlisting.
- No two-user live RLS test, hosted Supabase mutation, Azure backend or website deployment occurred. PR CI must pass before merge.

## M9 — microphone lifecycle hardening (stacked feature PR)

- Browser SpeechRecognition and optional Azure Speech adapter already existed. This PR adds generation-based cancellation to stop stale results/errors, prevents old recognizers ending new sessions and closes active speech on topic change, retry, sign-out and view navigation.
- Optional token-broker startup now has a cancellable pending state; if startup finishes after cancellation its recognizer is stopped. Errors no longer discard the editable transcript.
- Offline simulated microphone regression added; no physical permission prompt, real audio transcription, Azure broker or speech key test has run. No cloud changes.

## M11 — ten individually authored priority curriculum lessons (feature PR)

- Added 10 domain-specific eight-section lessons: embedding migration, reranking, change tombstones, ReAct, Azure AI Search, APIM, DeepEval, adversarial regressions, LLM-judge cost, and human approval. Every new record includes practical workflow, mistakes, interview answer and follow-up questions.
- Coverage advanced to **158/246 expanded topic entries, 157 distinct authored lessons, 88 overview-only entries**. The added answers are each 60–140 words; content is **editorial unverified**, not expert signoff. Original 230 V3 topic IDs and 17 planets unchanged.
- Regenerated deterministic coverage CSV/report and server-owned rubrics (158 keys), and added topic-content assertions. No Azure deployment, Supabase data write, private document access or changes to other projects.

## M12 — Azure/security curriculum expansion (stacked feature PR)
- Added ten individually authored, editorial-unverified eight-part lessons covering Azure OpenAI deployment, PAYG/PTU, least privilege, regional failover, Functions, Container Apps/WebSockets, ADLS/Key Vault, provenance, tenant RLS and financial fallback.
- Current branch, **including dependent M11 content**, contains **167 unique authored lessons spanning 168/246 topic entries**; **78 overview-only entries remain**. The 17 planets and 230 original V3 topic IDs are unchanged.
- Regenerated 168 server-owned rubrics, 246-row coverage CSV, metrics and topic-specific regression tests. All new interview answers are 60–140 words, not independently timed or SME approved.
- Prior open PRs #12–#15 are unmerged due runner-allocation failures; this branch is stacked on M11 and must not merge to main independently. No GitHub CI success, Azure deployment, database writes or Supabase migrations claimed.

## M13 — public-repo CI restoration and integrated M8–M12 release checkpoint (2026-10-22)

**Current main:** `3a239544c93c28324f409314a41cce534422174b`. Repository visibility is **public** (owner-approved); this exposes repository code and history, but does not deploy the site or change private Supabase RLS. Supersedes historical PR/runner blockers recorded in earlier sections.

- Backend Vault ownership/negative guard: merged PR #14; post-merge [main CI #39826748602](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39826748602) passed all 3 jobs.
- Password recovery: conflict-free replacement PR #18 merged (old #12 closed); [main CI #39828044041](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39828044041) passed all 3.
- Microphone lifecycle: replacement PR #19 merged (old #13 closed); [main CI #39828617151](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39828617151) passed all 3.
- Editorial lessons M11: replacement PR #20 merged (old #15 closed); its post-merge CI #39829691948 became stalled during the Playwright `--with-deps` browser installation; no browser result should be inferred from that run while pending.
- Editorial lessons M12: replacement PR #21 merged (old #17 closed) after [PR CI #39830984771](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39830984771) **passed 3/3**. It avoids a repeated system-package bootstrap in browser smoke and retains actual Chromium and desktop/mobile/reduced-motion tests. Its post-merge [main CI #39831228218](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39831228218) **passed all three jobs** (curriculum-and-api, browser-smoke, release-safety).
- Curriculum source now contains **168/246 expanded topic entries**, **167 distinct eight-section lessons**, and **78 overview-only entries**. Content remains editorial-unverified and has not undergone SME sign-off or real speech timing checks. Original V3 230 topic IDs and 17 planets preserved.
- Runner dispatch problem [issue #16](https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/16) closed after switching the repository to public. No cloud deployment, Azure Functions/APIM provisioning, hosted Supabase RLS exercise, private file handling, or paid-resource changes were performed by these PRs.

**Release interpretation:** These are source and offline CI integrations. Azure Blob public preview has **not** been redeployed with the newly merged code; live authentication, two-user RLS, physical microphone, backend safety and editorial sign-off remain blocked on separate acceptance gates.

## P2 six-workstream integration checkpoint — 2026-10-22 (latest)

The user elected to have a **single coordinator chat** own all six previously separate branches. Those branches were developed and merged sequentially after actual three-job pull-request CI success. This section supersedes older pending P2 planning but preserves historical logs.

| Stream | Merged PR | Verified source change |
|---|---|---|
| A — content | #24 | Twelve individually authored Spark/ADF/lakehouse/SQL lessons, source rubrics, coverage CSV and topic regression tests |
| B — Auth/RLS readiness | #25 | Manual-only live RLS probe rejects privileged keys before network access; offline negative tests and explicit consent gate |
| C — microphone | #26 | Simulated permission rejection/retry/stale callback regressions and real-browser acceptance checklist |
| D — backend security | #27 | Reject owner-mismatched/traversal/control-character private Storage paths before undeployed Vault extraction, with tests |
| E — static release | #28 | Existing-only deploy script refuses every account except approved `gengalaxy1429841605` in `GenAI_Galaxy`; fake-CLI tests |
| F — review/cost | #29 | Public-source secret-shape guards, editorial review and evidence-based cost checklist |

**Content after P2 A:** 17 worlds; original 230 V3 topics preserved within 246 total; **180/246 expanded curriculum entries**, **179 distinct eight-section lessons**, **66 overview-only entries still incomplete**. Expanded does not mean SME-approved or spoken-verified.

**CI:** source PRs #24–#29 each passed all three PR checks. Final post-merge [main run #39838287412](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39838287412) **completed successfully with all three CI jobs green**. All new work is offline/source-only; old Azure static site has not been redeployed.

**Still blocked on separate owner approval/evidence:** actual hosted two-account RLS acceptance using dedicated accounts, real password reset email flow, physical microphone and speech-provider behavior, Azure backend gateway quotas/private ingress/malware scanning, approved static site upload, SME/source review and the remaining 66 lessons. No hosted Supabase migrations, resource provisioning or cross-project actions occurred in this P2 merge.

## P3 — 246/246 curriculum editorial expansion merged (latest — 2026-10-22)

- The entire **66-topic** incomplete backlog was authored with distinct eight-part reference lessons; old P2 counts above are historical and **superseded**. The curriculum now retains **17 planets**, **230 original V3 topic entries plus 16 gap topics**, **246/246 expanded entries**, **245 unique lesson records** (one shared title), **0 overview-only entries** and **245/245 written interview answers in the approximately 60–140-word band**. Source-derived detailed lesson content remains **editorial-unverified**, not timed or independently SME-approved.
- Content, corresponding `api/rubrics.json` (246 keys), `docs/TOPIC_COVERAGE.csv`, `docs/COVERAGE_REPORT.md`, P3 inventory and curriculum regression tests were merged in [PR #31](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/31) as `8e95c4c4e86e0ca8167fb3ef0e579358c8cfc90b`.
- Current exact integrated feature [main GitHub Actions run #39843350678](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39843350678) finished **3/3 passed**. No unfinished lesson authoring PR remains.
- **External release gates are not completed:** explicit approvals/credentials for two-user hosted Supabase RLS and email recovery, real mic testing, approved frontend-only existing Azure Blob deploy, secure gateway/backend provisioning with private ingress, malware quarantine and human technical/content review. The old public Blob preview does **not** automatically show PR #31. No hosting changes were executed in this release.

## P4 — independently reverified after P3 (2026-10-22)

Before P4, main `accdecd9` [run #39845004927](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39845004927) completed **3/3 success**. Read-only live Supabase policy inspection verified Galaxy owner-scoped RLS policies and a private 8 MiB study bucket; it is **not** a signed-in two-user test. Added hosted deployment byte-parity and exact lesson-count acceptance checks in this P4 source PR. The existing Azure site has **not been republished**, and no manual workflow, hosted database fixture, actual mic or Azure backend launch was executed. See `docs/reviews/P4_RELEASE_EXECUTION.md` for evidence and limits.

## P6 — temporary Galaxy test accounts via protected manual GitHub Action

- Last verified Azure static deployment run #39858392869: validate and deploy successful; seven allowlisted assets uploaded with OIDC and narrow Blob permissions. Hosted browser run #39858621086 cancelled while installing Chromium; owner deferred browser tests.
- Galaxy-only Supabase read-only audit on 2026-10-23: `genai_study_progress`, `genai_study_attempts`, `genai_study_documents` each RLS enabled with owner-scoped policies. Private bucket `genai-study-docs` exists with 8 MiB cap and per-user folder policies. This is **not** real cross-user acceptance.
- P6 adds a protected GitHub Actions-only workflow to create 2 temporary Galaxy Auth test users using a GitHub environment admin key, run the existing scoped negative RLS probe as those independently signed-in users, and delete both users. **Workflow code exists; no real users or hosted test have yet been created/run**. Manual `TEST` dispatch and GitHub dev secret setup required; do not confuse offline unit success with hosted RLS.

## P7 — Parallel auth, backend and editorial engineering (2026-10-23)

- Owner requested parallel progress, GitHub Actions for execution (no VS Code), and explicitly removed optional cost-monitoring work from current scope. Browser and physical microphone acceptance remain deferred.
- **Merged source PRs:** #38 curriculum editorial triage, #36 ephemeral Auth cleanup hardening, #37 Galaxy-pinned backend request security. Current integrated backend commit `d9da0e210287a3f0ecd7f8097e3fdbc0e6a476ff`; verified main CI #39922110990 succeeded 3/3 (Python/curriculum/API, browser-simulated CI, release-safety).
- **Auth:** existing ephemeral workflow remains protected manual `TEST`, requires GitHub `dev` secrets `GALAXY_SUPABASE_ADMIN_KEY` and `GALAXY_SUPABASE_PUBLISHABLE_KEY`. No real disposable Auth users have been created or two-user RLS acceptance completed, because tool permissions do not include setting environment secrets or dispatching workflows. Cancellation cleanup improved for ordinary SIGTERM, not forced termination.
- **Backend:** existing source-only evaluator, Speech broker and private Vault now reject redirects carrying credentials and disallow non-Galaxy Supabase project URLs. Actual private/secured Functions/APIM ingress, user-level quotas, provider credentials, malware quarantine and production end-to-end evaluation are not provisioned or deployed.
- **Lessons:** deterministic audit reviewed structure of all 245 reference lesson records and flagged language for version/accuracy/evidence review; domain-expert factual certification and actual spoken answer timing remain outstanding.
- **Frontend:** previously confirmed Azure static deploy run #39858392869 succeeded. No backend deployed or hosted Galaxy frontend republish was performed by P7.

## P8 — P3 consumption-first backend source (2026-10-23)

Owner requested minimum or consumption-based backend infrastructure instead of always-on APIM or paid dedicated plans. Added `GALAXY_BACKEND_PROFILE=direct-consumption` for authenticated, daily-quota-gated evaluator, pinned to the exact Galaxy Supabase project; shared `managed-gateway` mode remains fail-closed. The proposed SQL implements **5 model evaluations per user / 50 total per UTC day**, with transactional reservations before Azure model calls. Vault extraction and Azure Speech bearer token minting return 503 in direct mode; browser STT remains separate. No false claim of malware scanning or real model scoring.

Two GitHub `dev` main-only manual workflows prepare exactly one small Flex Consumption Function (512 MiB, 2 maximum on-demand instances, 0 always-ready) plus one private Standard_LRS host-storage account, then deploy code to that existing Function after `PROVISION` / `DEPLOY` confirmations. **Code/PR/CI are not cloud deployment.** Existing Galaxy OIDC identity currently needs appropriate narrowly scoped management permissions to create new backend resources, and provider keys and a real Azure OpenAI model deployment must be supplied as protected `dev` secrets. Proposed Supabase quota SQL has **not** been applied to the shared project. See `docs/acceptance/P3_MINIMUM_CONSUMPTION.md`.

Exclude owner-declined P4 monitoring; don't touch other projects or reactivate browser/mic acceptance.

## P9 — owner-approved Galaxy quota migration applied (2026-10-23)

- The owner explicitly approved all pending Galaxy-only P3 actions. Supabase project `vfoghlhtnifpnbevgufa` / `voice_agent_call` received **one** migration `20261023101156_galaxy_p3_consumption_eval_quota`; scope = ONLY two new `public.genai_study_eval_*_daily` tables and `public.genai_study_reserve_evaluation()`. No clinic data or other schema was changed. Corrected three PostgreSQL `COALESCE` expressions in the canonical SQL before applying.
- Live database inspection confirmed both counter tables have RLS enabled, no direct `anon` or `authenticated` SELECT grant, and the definer RPC is executable by `authenticated` but **not** `anon`. A rollback-only SQL test simulated signed-in JWT claims and verified requests 1–5 allowed, 6th rejected, global calls 1–50 allowed, 51st rejected. Both counter tables remained at **zero rows** after rollback. **Not** a true Supabase Auth login/API integration test.
- Azure Functions Flex provision/deploy workflows are still unexecuted. The currently connected GitHub integration has no workflow dispatch or GitHub protected-secret management action, and there is no connected Azure cloud-management action. The known OIDC principal has narrowly scoped existing storage rights; it does not have a verified resource-group deployment grant. No Azure backend resource, model endpoint or Speech service was provisioned/deployed in P9.

## P10 — WineShopPOS-inspired Galaxy evaluation quality and request traces (2026-10-23)

- Examined WineShopPOS's actual versioned Owner AI golden cases and gate thresholds, tracing/Foundry App Insights plan and authenticated trace-ingestion evidence. Reused only its **quality patterns**, not infrastructure, company datasets, model deployment or secrets.
- Galaxy backend source now produces one allowlisted structured logger event per evaluator request and returns the server-generated `X-Galaxy-Trace-Id`. Events include execution stage, duration, status, quota outcome, provider token counts when returned, and explicitly labeled `model_reported_accuracy`/`model_reported_clarity`. No raw answers, prompts, user IDs, bearer tokens, tenant IDs, document content, model response text or credentials in logs.
- Added Galaxy-specific versioned 10-case synthetic reference golden set, evaluation lock, 1–5 groundedness/relevance/coherence/factual accuracy targets and absolute security blocker policy, plus offline gate and privacy regression tests. Real independent judge results and Foundry trace ingestion are **NOT yet verified**; missing real golden evidence fails the gate rather than producing a fake pass.
- Existing pay-per-use, JWT, Supabase quota-before-model architecture unchanged; no always-on services or additional paid telemetry. The stdout logging mechanism is not a durable Foundry trace service. P4 monitoring remains excluded; this is limited request-level correlation and quality contract work. No Azure deployment performed by this PR.

## P11 — WineShopPOS-inspired Galaxy Auth + freemium + disposable real user tests (2026-10-23)

- Reviewed source-of-truth WineShopPOS V4 AuthContext/SaaSContext/SaaSAccessBoundary and server-owned subscriptions. Galaxy already has native Supabase Auth sign-in/sign-up/recovery and private per-user RLS; not creating duplicate Auth or touching WineShopPOS/clinic.
- Added Galaxy-only FREE/PLUS/PRO server entitlement design in `infra/azure/backend/galaxy_subscription_entitlements_REVIEW_ONLY.sql`: FREE 5, PLUS 10, PRO 20 model reviews/user/day and existing 50/day global cap; trusted private plan assignment only, subscription status/date validation, expired plans fallback to FREE and SUSPENDED blocks access. **Prices intentionally null and no payment provider/checkout/subscription charging.**
- Protected existing disposable two-Auth-user GitHub test with separate signed-in checks for per-user subscription RPC, cross-user subscription read denied, direct self-upgrade denied. New manual hosted Galaxy AI smoke reuses temporary real users to verify forged bearer denied and one authenticated paid evaluator result with trace header; finally deletes users. GitHub workflows have not been dispatched from this chat.
- Added Git Bash `scripts/galaxy_p3_one_shot.sh` to securely prompt for missing GitHub `dev` secrets, run Auth TEST, Flex PROVISION, model DEPLOY, hosted AI TEST and frontend static DEPLOY sequentially and stop on failure.
- Kept source `runtime-config.js` evaluator URL empty, modifying the manually approved static-deploy workflow to accept `enable_evaluator=AI_READY` only when its exact Git commit has a successful hosted live AI smoke run, then inject the fixed public endpoint into deploy artifact only. No premature public model integration, new monitoring or unrelated resource touch.


### P11 hosted Supabase verification

Applied Galaxy-only migration `20261023110022_galaxy_freemium_subscriptions_v1` in shared project `vfoghlhtnifpnbevgufa`. Verified three plan catalog rows, no user paid assignments, plan-owner RLS, no authenticated INSERT privilege and no anonymous `my_subscription()` execution. A rollback-only simulated authenticated JWT test verified FREE daily cap 5 with denial of request 6; user/global counter tables returned zero rows afterward. This is DB verification, not real Auth user or Azure runtime test. No checkout, recurring billing, pricing or platform monitoring enabled.


## P12 — Dedicated India Azure OpenAI model provisioning prepared (2026-10-23)
- Corrected deployment sequencing: real Supabase Auth smoke -> **dedicated model provisioning** -> backend Flex provisioning -> backend deploy with OIDC model endpoint and key discovery -> one real model smoke -> gated frontend release.
- Added manual-only GitHub Action `galaxy-p3-model-provision.yml` and idempotent `scripts/provision_galaxy_openai.sh`: target only `GenAI_Galaxy` RG, new Galaxy-specific OpenAI S0 `gengalaxy-ai-sin-1429841605` in `southindia` with `gpt-4.1-mini` version `2025-04-14`, regional `Standard` capacity 5, without provisioned PTUs. Azure model/quota availability is subject to subscription approval.
- Removed the unfulfillable requirement to paste an existing Azure OpenAI endpoint, deployment or API key. The deploy GitHub Action retrieves the endpoint and account key using approved Azure OIDC only **after model exists**, and stores them in backend Function app settings, without exposing them in the repo or frontend.
- **Cloud model and Functions NOT provisioned by this source change**, manual workflow must run and report real results. No WineShopPOS changes and no P4 monitoring.

## P13 — existing hosted P12 complete; zero-cost-only QA workstream (2026-10-23)
- Hosted protected Actions verification: six runs **all success** — #39952220136 (Auth), #39952291427 (South India model), #39952527715 (Flex), #39952768305 (API), #39952989858 (one previously authorized real model smoke), #39953104627 (static AI_READY release).
- User explicitly rejected adding a payment gateway, new paid AI model, fine-tuning or paid evaluation. P13 only modifies read-only acceptance/offline tests and supporting docs; does **not** repeat any model calls, spend on new Azure resources or invoke paid golden checks.
- Site runtime URL intentionally injected during protected staging; fixed public asset acceptance to compare only the exact approved change while requiring exact byte-parity elsewhere. Manual human mic/password reset and independent lesson fact-checking remain open. See P13 acceptance record.


## P21 KayKit V4 interactive review preview — 2026-10-23 (verified)

- The visually rejected P17/P19 skeleton was replaced **in an isolated, unmerged feature branch** by KayKit CC0 textured Mage (95 clips, 41 bones), with real hand/pelvis attachments and low-cost procedural planet materials; PR #96 remains draft.
- Versioned public interactive review: https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-3d-v4/index.html?demo=1 — Azure protected deployment [#40008968388](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40008968388) SUCCESS, exactly 14 hosted staged asset files verified byte-for-byte by SHA256. Root site untouched.
- Exact review build `9eb442613278f0eea3d5e57f63c832ef13f0ec4c` passed 3/3 CI jobs (runs #40008306320 and #40008299990) and Chromium desktop/mobile/reduced-motion acceptance. Owner-scoped progress unchanged; ?demo=1 explicitly synthetic. Art approval and hosted authenticated RLS remain incomplete.
