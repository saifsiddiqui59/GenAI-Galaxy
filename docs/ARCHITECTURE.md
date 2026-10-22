# Architecture

Azure Blob `$web` (planned; not provisioned): static `index.html`, CSS, JS, local curriculum and expanded lessons. 17 interactive chapter planets are generated from the V3-derived JSON and use CSS 3D-style surfaces. A Canvas starfield stays behind the app.

Browser workflow: chapter → topic → eight-part lesson (if expanded) → microphone/transcript/edit → transparent local coverage rubric → weak retry or harder follow-up → guest localStorage or existing `genai_study_progress` + `genai_study_attempts` under user RLS.

Knowledge Vault: authenticated `supabase-js` → private bucket `genai-study-docs` at `auth.uid()/UUID-originalName` + `genai_study_documents` metadata. TXT/MD read locally and yield simple source-based draft questions. PDF/DOCX extracted content and verified lesson/question generation require an authorized isolated server worker; they are NOT implemented.

Azure Speech production path, not live: browser with Supabase JWT → HTTPS token broker that validates JWT, authorizes usage and returns short-lived Speech token/region → browser Speech SDK. No subscription key crosses into frontend.

Security boundaries: static file public, curriculum public, progress/documents private under Supabase Auth and RLS. No frontend service-role key or third-party API secret. Browser keyword grader has no private backend privileges.

## M2 backend (source implemented, hosting deferred)

The public Blob Static Website serves read-only HTML/CSS/JS/lesson JSON and *public endpoint URLs* from `runtime-config.js`.

Authenticated requests -> HTTPS API gateway with real per-user quotas -> Python Azure Functions -> Supabase Auth `/auth/v1/user` token validation. Document extraction looks up a caller-owned row under RLS, fetches a caller-owned private Storage path and patches extracted body under the same JWT. Model grading takes only server-owned `api/rubrics.json` source references, uses privately configured Azure OpenAI access and checks the output schema. Speech token route mints Azure STS tokens with a server-only subscription key. All provider calls, file parsing and privileged checks stay server-side. Require malware quarantine, observability, rate limits and staging negative-auth tests before production deployment.


## M3 security/content revision

API auth now enforces an additional fail-closed internal gateway shared-header check (`GALAXY_GATEWAY_SHARED_SECRET`) before verifying Supabase JWT. Actual deployment must enforce **network isolation of direct Function origin**, APIM stripping/injection and per-user quotas: a static header by itself is insufficient. The private document retry UI invokes the same UUID/RLS-bound extraction path; it cannot directly choose another user's file.

Content is expanded to 147 unique eight-part lessons covering 148 of 246 entries. The remaining 98 topic entries explicitly show overview-only material and the lesson examples are not yet domain expert signed off. Offline hints only inspect concept mentions; strong factual grading remains disabled unless trusted services are deployed and calibrated.

## M7 — browser-side cloud session safety (feature PR)

Auth transitions increment a client-local epoch. Each async Supabase progress/attempt/document load captures the epoch and verified user ID, uses explicit `eq('user_id', userId)` filters, and refuses to commit a result once a newer identity transition occurs. Sign-out immediately clears private data and restores guest-only state. Document removal additionally requires an owned document with a path inside the current user's storage prefix. These are defense-in-depth client protections; server-side RLS must independently enforce ownership, and fully authenticated network testing remains a release gate.

## M7b — opt-in two-account RLS acceptance

`tests/live_rls_check.py` is a separate GitHub Actions manual-only workflow with protected `dev` environment, exact `TEST` acknowledgement and credentials for two existing consented Galaxy auth identities. Uses publishable key + per-user Supabase JWT only. Exercises scoped progress, attempts, metadata and private Storage with randomized temporary fixtures and own-user cleanup. No service-role escalation, new accounts, non-Galaxy tables, Azure backend or automatic PR/push cloud operations.
