# Decisions

- Maintain original V3 topic keys (`branch / group / title`) for cloud and guest progress compatibility.
- Keep exactly 17 original main chapters/planets; add discovered topics within the existing hierarchy (now 55 groups).
- Pure CSS planet surfaces, orbital transform animation and static Canvas starfield avoid a heavyweight WebGL dependency; use compositor transforms and honor OS reduced motion.
- **No multiple choice.** Open-answer textbox and speech recognition. Keyword rubric is explicitly not a semantic grading service.
- Browser SpeechRecognition is initial STT; optional Azure Speech adapter only with authenticated HTTPS token broker and time-limited access tokens, no frontend provider secrets.
- Store private documents only after sign-in; use existing RLS-enabled Supabase metadata table and private storage bucket; limit upload to existing 8 MiB bucket quota.
- Leave the V3 source as an immutable reference. No RetailGrowthAI or WineShopPOS changes.
- No Azure or GitHub resource creation without approval. Local Git work may proceed; remote remains blocked.
- M2: Distinguish conceptual keyword presence from correctness; **provisional answers may schedule study but never grant mastery**. A configured server model judge can mark strong attempts, requiring two for mastery; human/expert review remains a separate quality gate.
- M2: Browser voice recognition may be remotely processed. Add API code for authenticated Azure Speech short-lived tokens, but do not expose the subscription key in the static site.
- M2: Keep all document extraction behind a JWT-authenticated API, enforce user-owned Supabase object paths, parsed file sizes and content signatures. PDF/DOCX parsing does not replace malware scanning or scanned-document OCR.
- M2: Expensive Azure answer evaluation and Azure Speech token issuance **fail closed** until a real upstream per-user rate limiter/gateway is operational.
- M2: Avoid creating unrelated repositories/resources; no Azure provisioning/deployment without specific billing and security approval.

- M3: Expand high-priority topics through individually written content, not algorithmic generic filler. Treat lesson quality and user resume/project claims as **not independently SME verified**. Keep overview labels for remaining 98 entries.
- M3: Adaptive retries point to unmentioned rubric concepts but avoid claiming the omissions prove factual misunderstanding; a cloud reviewer is optional and gated.
- M3: Every Function route now rejects calls without backend-only gateway attestation. Production APIM must remove any inbound `X-Galaxy-Internal-Token` and inject a non-public one, enforce per-user quotas, and separately restrict direct Function network access.
- M3: A signed-in Knowledge Vault user may retry extraction of their own stored document when authorized API is deployed; never pretend extraction completed when endpoint absent.

## M4 — Git workflow adapted from the RetailGrowthAI coordinator (2026-10-22)

- Connected GitHub identity `saifsiddiqui59` was verified and private RetailGrowthAI was readable/writable. `saifsiddiqui59/GenAI-Galaxy` remains absent/inaccessible (`404`), and the connector has no repo-creation operation; no remote Git changes happened.
- Reuse RetailGrowthAI's coordinator/worker ownership, stacked PR dependency order, read-only CI, isolated paths, passing-test evidence and release-document checkpoints **without modifying** RetailGrowthAI or WineShopPOS.
- Preserve M1 `main`; tag the existing M2 commit as `feat/m2-interview-foundations`, retain `feat/m3-curriculum-hardening`, and put Git preparation on `chore/m4-github-readiness`. Stage separate draft PRs on the newly created private Galaxy remote.
- Git Bash `scripts/publish_github.sh` verifies the GitHub account, private visibility, exact origin URL and clean Git worktree; it never merges, deploys or pushes to unrelated repositories.
- Add read-only `release-safety` CI plus branch `chore/**`, concurrency cancellation, runner/job timeouts and shell checks. It is local-only until a verified GitHub Actions run exists.
- Fix `scripts/deploy_azure_static.sh` to include public `runtime-config.js` in future static uploads; do not deploy or provision resources under this milestone.

## M5 — Azure OIDC modeled on RetailGrowthAI (2026-10-22)

- Use a **Galaxy-only** Entra app registration for federated workload trust (owner supplied app name `GenAI_Galaxy`, but whether it is an Entra registration or App Service is unverified) for private GitHub Galaxy `dev` environment. Do **not** reuse RetailGrowthAI's federation or secrets. Exact post-July-2026 immutable OIDC subject needs real Galaxy repo ID after creation.
- Owner-supplied Azure RG `GenAI_Galaxy` is the *only* allowed resource group. Treat it as existing but **not independently verified** until a successful read-only action.
- No Azure operations during PR/push CI. Manual Azure discovery workflow is read-only; manual static-site upload requires main branch, exact DEPLOY text, protected environment, successful tests, actual existing storage name and restricted Azure RBAC. No automatic provisioning.
- `GenAI_Galaxy` contains an underscore and cannot be an Azure Storage account name; user has not identified storage destination, so deployment must refuse to proceed until configured.


## M6 — approved and verified public Blob preview (2026-10-22)

- Owner expressly approved creating a static Blob website with index.html in GenAI_Galaxy; this supersedes earlier restrictions against initial storage creation **for this one preview account only**.
- Provisioned gengalaxy1429841605 in centralindia with Standard_LRS GPv2, HTTPS-only and TLS 1.2 minimum. Kept account-wide anonymous Blob container access disabled while permitting $web static endpoint reads.
- Bootstrap action used existing RG-scoped Contributor through GitHub OIDC and a short-lived **in-memory account key** solely for website enabling and upload because it lacked Storage Blob Data Contributor. No persistent key/secret was added to GitHub or the frontend. Future deployments should use account-scoped Blob Data Contributor under the existing manual workflow.
- Published only seven public app assets, and confirmed HTTP 200 on all eight routes. No API, vault documents, resumes, V3_REFERENCE.html, migration files or other repositories were deployed.
- One-time push triggers were removed after queuing; retain manual-only Azure actions and do not provision further backend resources without separate security/cost review.

## M7 — cloud client isolation defense in depth

- Add explicit `user_id` filters to Galaxy progress, attempts and documents on every client read; this complements, never replaces, database RLS.
- Reject mismatched owner/path records; fail closed before replacing private state. A monotonically increasing auth epoch invalidates pending reads on sign-out or account switch to prevent stale results reappearing.
- Scope document metadata deletes by both UUID and the current user, and validate storage path prefix before removal.
- Develop/test entirely via GitHub with mock identities. Do not create real Supabase users, mutate the shared database, configure paid Azure services or assert real two-user isolation from mocks.

## M7b — real-user RLS gate is explicit, isolated and optional

- Never create production users or mine existing Supabase credentials for RLS probes. Use two different, pre-approved Galaxy test accounts passed only as protected GitHub `dev` secrets.
- A manual workflow with explicit `TEST` confirmation tests read/write isolation in the three Galaxy tables and owner-prefixed private bucket; its random fixtures must be cleaned after execution. No secret or service-role key is shipped to JavaScript or committed to Git.
- CI compiles and statically guards the script, but live cloud verification must be separately reported only when the manual job actually runs and succeeds.

## M10 — document extraction quota and owner filters

- Keep document extraction disabled unless the API is behind a verified external authenticated per-user quota gateway; the backend's `GALAXY_VAULT_GATEWAY_RATE_LIMIT=active` switch is only an additional fail-closed configuration gate.
- Always filter private `genai_study_documents` SELECT and PATCH by both authenticated owner and UUID document ID; keep Supabase RLS as authoritative. No custom privileges, elevated keys, private storage changes or cloud provisioning.

## M8 — Auth recovery decision

- Keep all password changes in Supabase Auth. Send recovery emails with a redirect built only from browser `location.origin` and `location.pathname`, excluding query or fragments. Accept password updates only after an active recovery session. No email-existence disclosure in the UI and no privileged backend/password handling.
- Offline mocks are regression evidence, not proof of real reset email delivery; dedicated Galaxy test account and allowlisted Auth redirect URL required.

## M9 — speech session ownership

- Treat recognition callbacks and late asynchronous token-broker starts as owned by a monotonically increasing client generation. Sign-out, navigation and retry invalidate old sessions and close recognizers; never overwrite the draft from stale callbacks. Preserve editable transcripts on microphone errors. Static mock tests are not live microphone or Azure provider validation.

## M11 — curriculum batching and provenance

- Prioritize distinct, technically specific lessons rather than auto-generating filler for 98 overview-only records. Keep an unverified editorial marker until independent fact/source and spoken-duration review. Preserve the 17 planets and original V3 topic identifiers; regenerate server-owned rubrics and topic coverage for each authored batch. Ten substantive topics are in this independent PR; after merge 88 overview-only entries remain.

## M12 — source-aware security lessons
- Introduce explicit discussion of provider-region restrictions, APIM bypass prevention, multi-layer identity permissions, two-user isolation and financial-policy abstention. Do not imply Galaxy has a deployed model gateway, a live two-account Supabase test result or SME-reviewed content.
- Use a stacked PR based on M11 to avoid rewriting its newly expanded lessons while CI runner dispatch is blocked. Only retarget and merge after dependency and complete three-job checks pass.

## M13 — visibility, CI and release sequencing

- Owner switched the isolated Galaxy repository to **public** to restore zero-usage-billing-limit GitHub-hosted Actions access. Source and Git history are public; private Galaxy study data must remain inside RLS-protected Supabase and the private storage bucket. Do not commit credentials, real uploaded resumes or customer data.
- Keep backend, client auth, microphone and content PR integration strictly sequenced with GitHub CI: actual merged replacements were #14/#18/#19/#20/#21. Close stale stacked or conflicting PRs instead of merging duplicate changes. The first three main runs passed 3/3; #20's old browser install was blocked during `--with-deps` setup, so #21 removed repeated system-package setup and demonstrated passing new browser PR CI.
- Require the current branch's three GitHub CI jobs and the new main run before reporting a final green checkpoint. A prior run, another commit or pending Chromium installer is never green evidence.
- Preserve no-auto-deploy rule: public visibility, GitHub CI and source-only API code do **not** authorize a new Azure static upload, live Supabase migration/test, paid Azure provisioning or private document processing.

## P2 — single coordinator, six isolated GitHub branches

- Six workstreams can be authored and coordinated inside one conversation using their separate GitHub branches and exclusive file ownership; no independent ChatGPT chats or background agents are required. Coordinator alone checks reviews, resolves shared-file conflicts, merges sequentially and verifies fresh main CI after each merge.
- Merged P2 source PRs #24–#29. Keep content, Auth/RLS readiness, microphone mock tests, private extraction hardening, static deployment safety and public repository audits isolated. One PR's passing CI is not evidence of a real credentialed/hosted test.
- The existing Azure Blob preview is never updated automatically by GitHub source merges. Approval for a frontend-only deployment is separate from backend provisioning, paid Azure resource configuration and live Supabase fixture writes.
- Public repository scanning is a narrow guard; owners must independently audit old commit history and revoke any exposed real secrets. Lesson coverage counts represent structure, not SME/source verification.

## P3 — Content completeness is not production authorization (2026-10-22)

- Treat [PR #31](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/31) as the completed structural editorial scope: 66 new distinct eight-section lessons; 246/246 covered topic entries; 245 unique lesson keys, 0 incomplete. Existing original 230 topic IDs and 17 planets preserved. All 245 answers have approximate 60–140-word written length, which **does not** prove spoken timing, factual correctness or SME signoff.
- Release process remains **separately owner-approved** for Azure static hosting, Azure backend infrastructure, real Supabase auth/RLS fixture writes and microphone/provider checks; project-level source development permission alone does not bypass these gates.
- Continue tracking actual CI result attached to each merge commit; main run #39843350678 passed all three jobs for P3 content integration. Public repository sources are separate from existing deployed Blob files and private Supabase data.

## P4 — do not confuse previous hosted smoke with release parity

- Broad owner permission to pursue remaining Galaxy work does not manufacture dedicated authentication credentials, actual device microphone access, subscription budget limits or a GitHub workflow-dispatch capability. Preserve protected manual `DEPLOY`/`TEST` gates and existing-only Azure storage targeting rather than changing CI to auto-deploy.
- A hosted HTTP 200 or guest navigation pass is insufficient to claim P3 deployment. Require exact SHA-256 parity for all seven allowlisted public files against the selected main checkout plus 17 worlds/245 unique hosted lessons/246 mapped topics. No cloud launch is claimed from P4 source commits.
- No changes to unrelated objects in shared Supabase project; catalog verification is safe read-only evidence, not live user-isolation proof.
