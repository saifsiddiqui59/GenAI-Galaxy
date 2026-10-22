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
