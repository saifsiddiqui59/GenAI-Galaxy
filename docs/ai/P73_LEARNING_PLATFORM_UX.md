# P73 — Mature learning UX research → focused Galaxy interview workspace

Date: 2026-10-25. Owner request: research three proven learning interfaces, then implement an original, uncluttered GenAI technical interview page. This phase changes **the AI interview page only**; not Galaxy planets, Genie, V6 cinematic source, models, authentication, data, Supabase schema or Azure Functions.

## Research shortlist and concrete adaptations

| Product | Primary sources (official) | Verified learning pattern | Our original design adaptation |
| --- | --- | --- | --- |
| Duolingo | [2024 Duolingo English Test guide](https://englishtest-static.duolingo.com/media/resources/test-taker-guide/DET%20Official%20Guide%202024%20English.pdf) | A prompt followed by answer and a later follow-up; visible steps/progress on writing test | Four restrained stage chips, one visible interview question, one main evaluation action, next step emphasized only after feedback |
| Codecademy | [Interactive learning platform](https://www.codecademy.com/), [AI assistant and free response feedback](https://help.codecademy.com/hc/en-us/articles/23400751016859-AI-Features-available-on-Codecademy) | Learn-by-doing, contextual hints and AI feedback inside the same workspace; interview response feedback | Large editable answer field, contextual help disclosure, local/AI scoring transparency |
| Khan Academy | [Practice and hints](https://blog.khanacademy.org/how-should-people-practice-on-khan-academy/), [May 2026 learner experience](https://blog.khanacademy.org/meet-the-new-khan-academy-classroom-experience/) | Clear next steps, help before/after answer, feedback, revision and mastery without skipping the learning process | Collapsed evidence, visible improved answer and one primary continuation action; explicit free concept checks are not verified factual grades |

This is **inspiration, not a reproduction** of copyrighted visual assets, icons, copy or internal code. Retain Galaxy's original cosmic identity and open-response (no multiple-choice) pedagogy.

## Implemented P73

1. Reduce editorial noise: compact heading and four stage chips, no fake mastery progress.
2. Make the question prominent; visibly keep skip as a secondary action.
3. Collapse hints, reference answer, and token-consuming LangGraph tutoring behind an optional, keyboard-accessible disclosure. Keep exact IDs and auth+quota logic unchanged.
4. Make the editable transcript and evaluation CTA the dominant center of the page. Keep microphone, explicit consent, no auto model retries, free concept scoring. Move retry/teach/alternative scoring under a disclosure.
5. Show feedback and improved answer immediately after an answer. Keep correct/incorrect claims, measured usage, concept checklist, misconceptions and score evidence accessible under a single summary.
6. Prioritize next question/next difficulty as the primary post-feedback action; place other actions under disclosure.
7. Single-column responsive layout with restrained accessible contrast, touch-sized CTA and visible keyboard focus. Existing Galaxy shell and 3D unaffected.
8. Preserve all 17 original chapter worlds and all topic keys, all existing control IDs, local fallback truthfulness, all 90-second timeout/no-repeat model safeguards.

## Verification contract

- Existing P60 source control and keyboard/visibility invariants in `tests/test_p60_interview_layout.cjs`.
- New P73 source contract verifies **all existing IDs**, exact number of progressive blocks, native details semantics, no multiple-choice and responsive focus styles.
- Protected P61 hosted guest-browser checks assert the default closed disclosures, visible skip+primary CTA, accessible answer field, visible post-answer feedback and improved answer, and zero calls to models. 1440×900 desktop and 390×844 phone screenshots are recorded both **before** and **after** submission.
- CI and manual protected DEV preview are separate. The current root website must remain byte-identical. Successful guest tests must **never** be described as a signed-in Azure OpenAI or LangGraph success.

## Remaining work outside P73

- P0 [#192](https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/192): intermittent Function 503/worker startup; **not fixed by UI**.
- Signed-in true AI evaluator/tutor, quota, answer quality and metered costs require independent reliable hosted testing.
- Physical-device/assistive-tech visual audit is not guaranteed by Chromium screenshots alone.
