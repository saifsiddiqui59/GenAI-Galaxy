# P48 — LangGraph AI Tutor, source-only

Branch: `feat/p48-ai-tutor-orchestration`
Related grading PR: #178, merged on main at `d9d3f256`.

## Existing resources reused

- Azure Functions authenticated JWT + Supabase Galaxy-only quota reservation.
- Server-owned 246 curriculum topic rubrics and one GPT-4.1 mini Azure deployment.
- Static JS interview screen. No changes to 3D Galaxy, Genie, or cinematic builds.
- No new subscription, resource group, service principal, Speech, billing
  gateway, model deployment, or background process.

## Flow

`POST /api/practice/tutor` with Supabase Authorization Bearer token:
`{topic_key,mode,message,history?}`.
Modes: `reference`, `quiz` (free, deterministic) and `explain`,
`clarify`, `followup` (exactly one LLM call, quota-controlled).
The graph uses deterministic routing; it does not ask the LLM to pick a route.
`reference` and `quiz` require JWT verification but do not consume model
tokens, model deployment configuration or a model quota.
Paid graph nodes first reserve the atomic per-user AND global daily quota.
A quota rejection is 429; a missing gateway/reservation is 503.
Model and provider keys remain private to the Azure Function process.
Free/guest client fallback remains existing local teach-me functionality.

Authenticated response (200):
`{tutor_status,mode,reply,next_question,model_called,reference_only}`.
Input mode and full topic key are server-allowlisted; history is bounded,
untrusted conversation data. No conversation content in logs.
No persisted LangGraph checkpointer or cross-session user state.
No user-supplied model URL, deployment or price selector.

## Cost and quality

- Routing, reference, quiz = 0 model calls.
- One deliberate AI tutoring button = at most 1 model call, not two-agent loops.
- System instruction asks for concise explanations; paid output cap 650 tokens.
- Existing server evaluation path retains one separate grading call.
- Provider usage is whitelisted into privacy-safe request telemetry, but
  a measured per-request INR cost and Azure billed matching are NOT yet provided.
- P48 deliberately does not run 120-case goldens or paid provider tests.
- Python and simulated JS tests prove routing, auth/quota source safeguards and
  UI interaction only; real provider reliability, invalid JSON rate, correctness,
  mobile hosted acceptance and actual spend require separate approval/testing.

## Release checklist

- Real GitHub core CI and hosted V5 read-only checks on the PR head.
- Review the 3D diff (must be empty).
- Verify new Azure Python dependency cold-start before cloud deployment.
- Confirm staging Function version, live route CORS, signed-in quota 429/503 and
  private tenant isolation only with explicit hosted release approval.
- Check approved region/model and a safe fallback before enabling tutor button
  on any public website. Static Blob preview will not update from a source merge.
