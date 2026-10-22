# Interface Contracts

Topic key: `${branch} / ${group} / ${title}`; persisted V3 keys are immutable.

`genai_study_progress`: user_id, topic_key, status (0–2), confidence (0–5), note, last_reviewed_at, next_review_at, updated_at. `genai_study_attempts`: user_id, topic_key, question_key, level (1–3), correct, response (max 2000), feedback (max 2000), created_at.

`genai_study_documents`: id UUID, user_id, title, category (`resume|project|topic|questions`), body <= 60000, filename, file_path, mime, created_at. Existing storage bucket `genai-study-docs`, private, max 8 MiB, path starts with `${auth.uid()}/`.

Future Speech token broker: `POST /api/speech/token` with `Authorization: Bearer <supabase_jwt>` and body `{"purpose":"galaxy-interview-stt"}`; returns `{ "token": "<short-lived>", "region": "<region>" }` after server JWT validation and rate limiting. **No implemented backend yet.**

Future answer evaluator: authenticated `POST /api/practice/evaluate`; input `{topic_key, question, response, rubric_version}`; output `{accuracy, missing_concepts, clarity, improved_answer, followup, evidence_refs, judge_version}`. Not implemented in this milestone; no fake live result.

## M2 implemented API drafts — NOT deployed

`POST /api/practice/evaluate`: `Authorization: Bearer <Supabase access token>`; `{topic_key,question,response,rubric_version}`; server checks exact full topic key against `api/rubrics.json` then model reviews against a server-owned reference. Output `{review_status:"model_reviewed",accuracy:0..100,clarity:0..100,missing_concepts:string[],has_factual_errors:boolean,feedback,improved_answer,followup,rubric_version}`. Non-2xx is not a factual grade; frontend uses a **provisional** local hint without auto-mastery. Requires actually configured per-user gateway rate limiting and backend model secrets.

`POST /api/vault/extract`: signed-in user and `{document_id:<UUID v4>}`; backend resolves metadata row through caller RLS, fetches only `${user_id}/...` from private `genai-study-docs`, parses a limited supported file with signature checks, patches metadata `body`. Output `{status:"text_extracted",characters,document_id}`. No `file_path` accepted from browser. Malware scanning, OCR and staging integration not yet implemented.

`POST /api/speech/token`: signed-in user; `{purpose:"galaxy-interview-stt"}`; output `{token,region}` with short-lived Azure Speech token. Requires backend-only Speech key and real quota enforcement.

Configuration `runtime-config.js` holds public URLs only; the site cannot host Functions endpoints itself.
