# Interface Contracts

Topic key: `${branch} / ${group} / ${title}`; persisted V3 keys are immutable.

`genai_study_progress`: user_id, topic_key, status (0–2), confidence (0–5), note, last_reviewed_at, next_review_at, updated_at. `genai_study_attempts`: user_id, topic_key, question_key, level (1–3), correct, response (max 2000), feedback (max 2000), created_at.

`genai_study_documents`: id UUID, user_id, title, category (`resume|project|topic|questions`), body <= 60000, filename, file_path, mime, created_at. Existing storage bucket `genai-study-docs`, private, max 8 MiB, path starts with `${auth.uid()}/`.

Future Speech token broker: `POST /api/speech/token` with `Authorization: Bearer <supabase_jwt>` and body `{"purpose":"galaxy-interview-stt"}`; returns `{ "token": "<short-lived>", "region": "<region>" }` after server JWT validation and rate limiting. **No implemented backend yet.**

Future answer evaluator: authenticated `POST /api/practice/evaluate`; input `{topic_key, question, response, rubric_version}`; output `{accuracy, missing_concepts, clarity, improved_answer, followup, evidence_refs, judge_version}`. Not implemented in this milestone; no fake live result.
