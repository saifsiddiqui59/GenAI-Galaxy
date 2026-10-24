# Interface Contracts

Topic key: `${branch} / ${group} / ${title}`; persisted V3 keys are immutable.

`genai_study_progress`: user_id, topic_key, status (0–2), confidence (0–5), note, last_reviewed_at, next_review_at, updated_at. `genai_study_attempts`: user_id, topic_key, question_key, level (1–3), correct, response (max 2000), feedback (max 2000), created_at.

`genai_study_documents`: id UUID, user_id, title, category (`resume|project|topic|questions`), body <= 60000, filename, file_path, mime, created_at. Existing storage bucket `genai-study-docs`, private, max 8 MiB, path starts with `${auth.uid()}/`.

Future Speech token broker: `POST /api/speech/token` with `Authorization: Bearer <supabase_jwt>` and body `{"purpose":"galaxy-interview-stt"}`; returns `{ "token": "<short-lived>", "region": "<region>" }` after server JWT validation and rate limiting. **Backend source exists locally; not deployed.**

Future answer evaluator: authenticated `POST /api/practice/evaluate`; input `{topic_key, question, response, rubric_version}`; output `{accuracy, missing_concepts, clarity, improved_answer, followup, evidence_refs, judge_version}`. Local backend source exists; requires reviewed gateway and provider deployment.

## M2 implemented API drafts — NOT deployed

`POST /api/practice/evaluate`: `Authorization: Bearer <Supabase access token>`; `{topic_key,question,response,rubric_version}`; server checks exact full topic key against `api/rubrics.json` then model reviews against a server-owned reference. Output `{review_status:"model_reviewed",accuracy:0..100,clarity:0..100,missing_concepts:string[],has_factual_errors:boolean,feedback,improved_answer,followup,rubric_version}`. Non-2xx is not a factual grade; frontend uses a **provisional** local hint without auto-mastery. Requires actually configured per-user gateway rate limiting and backend model secrets.

`POST /api/vault/extract`: signed-in user and `{document_id:<UUID v4>}`; backend resolves metadata row through caller RLS, fetches only `${user_id}/...` from private `genai-study-docs`, parses a limited supported file with signature checks, patches metadata `body`. Output `{status:"text_extracted",characters,document_id}`. No `file_path` accepted from browser. Malware scanning, OCR and staging integration not yet implemented.

`POST /api/speech/token`: signed-in user; `{purpose:"galaxy-interview-stt"}`; output `{token,region}` with short-lived Azure Speech token. Requires backend-only Speech key and real quota enforcement.

Configuration `runtime-config.js` holds public URLs only; the site cannot host Functions endpoints itself.

## M3 trust boundary (source only, not deployed)

Every API request must pass **both** (a) a verified Supabase JWT and (b) an internal APIM-injected `X-Galaxy-Internal-Token` matching the backend-only `GALAXY_GATEWAY_SHARED_SECRET` (minimum 32 characters, constant-time compare). The gateway must strip the same client-supplied header, enforce real per-user quotas, and use network/private ingress rules to keep clients from reaching the Function origin directly. The header alone is **not** evidence that an APIM quota was enforced. No such gateway exists yet; routes must fail closed.

When `genai_study_documents.body` remains empty after an upload, a signed-in frontend user can click **Retry extraction**; the client sends only the UUID, never a storage path. No server is configured in the shipped `runtime-config.js`.

## M7 — client session invariants

The client reads Galaxy `genai_study_progress`, `genai_study_attempts`, and `genai_study_documents` through user-id-filtered requests, includes `user_id` in responses for an ownership check, and keeps private snapshot writes atomic only for the current auth generation. `SIGNED_OUT` clears private state and cancels obsolete read completions. A document metadata deletion must filter by both `id` and `user_id`; storage deletion is permitted only for `${user_id}/` paths. RLS/storage policies remain authoritative; mocked JS tests are not live isolation verification.

## M7b — live acceptance probe scope

The optional signed-in two-account test covers owner CRUD for `genai_study_progress`, owner insert/read for `genai_study_attempts`, owner insert/read for `genai_study_documents`, and owner upload/download of `genai-study-docs/{auth.uid()}/...`. Cross-user reads, writes, deletes and storage accesses are expected to be rejected or affect zero rows. All test IDs are randomly namespaced and deleted using each authentic test user's JWT. No live pass is claimed until the protected manual Action actually succeeds.

## M10 — private extractor release contract

The undeployed `/api/vault/extract` route returns HTTP 503 unless the backend-only `GALAXY_VAULT_GATEWAY_RATE_LIMIT=active` marker is configured. It is an additional safety switch, **not** a verified quota enforcement mechanism. A real gateway must independently enforce authenticated per-user limits, strip/inject the trusted internal header, and block direct Azure Function ingress. Document metadata SELECT and PATCH apply both verified `user_id` and validated v4 document UUID filters, in addition to live Supabase RLS. Do not deploy until malware quarantine, secure isolation tests and owner approval are complete.

## V6 preview release contract

Release command `PUBLISH_V6_REVIEWED_6614f79` is bound to owner 80577424, PR #131 and full source SHA `6614f7903c52b81f471083321a49f8870b5becdc`. Preview handoff carries only chapter index 0–16 to its isolated nested lesson document. The demo seek interface changes ephemeral presentation time only; authentic mastery is never fabricated.

## V6 hosted interface verification

#40022442803 verified the actual V6 URL and bounded nested lesson handoff to `lesson/index.html?galaxyWorld=1`, all 17 navigation entries and visibly labeled demo progress. The presentation-only seek/clock never writes mastery. Real authenticated owner/progress contracts were preserved; signed-in V6 runtime acceptance was not performed.


## P47–P49 AI endpoint additions (source, NOT hosted release)

`POST /api/practice/evaluate` retains its existing authenticated request and response fields; additional model-assessed values include `score_breakdown` (weighted dimensions), `correct_points`, `incorrect_claims`, `why_score`, `score_provenance`, and optional measured `token_usage`. This is an LLM assessment, not validated human judgement. Malformed/inconsistent model output fails closed.

`POST /api/practice/tutor` accepts authenticated JWT plus `{topic_key,mode,message,history?}`, mode in `reference|quiz|explain|clarify|followup`. `reference` and `quiz` are server-owned free answers; the other three reserve the same atomic per-user/global model quota and make at most one model call. Response: `{tutor_status,mode,reply,next_question,model_called,reference_only,token_usage?,estimated_model_cost?}`. Auth and topic allowlisting apply even to free modes.

For the evaluator and tutor, `token_usage` is provider-reported input/output/total (+ optional cached) token counts, not invoice evidence. `estimated_model_cost` is omitted unless optional recently verified INR/1M rate metadata is provided in private backend configuration; its numeric-string cost is explicitly **not billed Azure Cost Management actuals**. No new frontend secrets, paid automatic CI, or public website release.
