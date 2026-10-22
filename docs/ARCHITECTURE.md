# Architecture

Azure Blob `$web` (planned; not provisioned): static `index.html`, CSS, JS, local curriculum and expanded lessons. 17 interactive chapter planets are generated from the V3-derived JSON and use CSS 3D-style surfaces. A Canvas starfield stays behind the app.

Browser workflow: chapter → topic → eight-part lesson (if expanded) → microphone/transcript/edit → transparent local coverage rubric → weak retry or harder follow-up → guest localStorage or existing `genai_study_progress` + `genai_study_attempts` under user RLS.

Knowledge Vault: authenticated `supabase-js` → private bucket `genai-study-docs` at `auth.uid()/UUID-originalName` + `genai_study_documents` metadata. TXT/MD read locally and yield simple source-based draft questions. PDF/DOCX extracted content and verified lesson/question generation require an authorized isolated server worker; they are NOT implemented.

Azure Speech production path, not live: browser with Supabase JWT → HTTPS token broker that validates JWT, authorizes usage and returns short-lived Speech token/region → browser Speech SDK. No subscription key crosses into frontend.

Security boundaries: static file public, curriculum public, progress/documents private under Supabase Auth and RLS. No frontend service-role key or third-party API secret. Browser keyword grader has no private backend privileges.

## M2 backend (source implemented, hosting deferred)

The public Blob Static Website serves read-only HTML/CSS/JS/lesson JSON and *public endpoint URLs* from `runtime-config.js`.

Authenticated requests -> HTTPS API gateway with real per-user quotas -> Python Azure Functions -> Supabase Auth `/auth/v1/user` token validation. Document extraction looks up a caller-owned row under RLS, fetches a caller-owned private Storage path and patches extracted body under the same JWT. Model grading takes only server-owned `api/rubrics.json` source references, uses privately configured Azure OpenAI access and checks the output schema. Speech token route mints Azure STS tokens with a server-only subscription key. All provider calls, file parsing and privileged checks stay server-side. Require malware quarantine, observability, rate limits and staging negative-auth tests before production deployment.
