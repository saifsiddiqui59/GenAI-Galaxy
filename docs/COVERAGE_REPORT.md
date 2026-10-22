# V4 topic-coverage audit — 2026-10-22

**Scope:** V3 `GenAI_Adaptive_Tutor_Interactive.html` recovered from the available Library, the user's resume and available prior interview-conversation summaries/questions. The original V3 ZIP and complete historical transcripts were not accessible, so an exhaustive audit of *every* conversation **cannot be claimed**.

| Measure | Count | Evidence / interpretation |
|---|---:|---|
| Original V3 chapter count | 17 | Programmatically parsed from recovered V3 HTML |
| Original V3 topic records | 230 | Programmatically parsed, source retained in `V3_REFERENCE.html` |
| Original V3 subject groups | 45 | Programmatically parsed |
| New, non-duplicate gap records | 16 | Prior GenAI conversations/resume, added to appropriate chapters |
| V4 total topics | 246 | Verified unique hierarchical keys |
| V4 groups | 55 | Includes 10 dedicated gap-audit groups |
| Expanded curriculum entries | 148 | Uses authored `data/lessons.json`; **not SME verified** |
| Distinct eight-section lesson records | 147 | A shared title appears in two curriculum locations |
| Incomplete curriculum entries | 98 | Existing topic has only short overview/interview question |
| Duplicated chapter/group/topic keys | 0 | Checked by automated test |
| Interview answer length 60–140 words | 128 / 147 | Approximate 30–60-second speaking range; **not timed or spoken-verified** |
| Complete verified technical coverage | **not established** | Requires a topic-by-topic SME review |

## Gap themes discovered and added

Changes to long-context prefill; embeddings migration and stale-chunk cleanup; reranking trade-offs; STT WER and browser fallback; short-lived Azure Speech tokens; idempotent tool side effects and authorization; LLM-judge calibration; end-to-end speech/answer testing; indirect prompt injection; distributed tracing; private document processing; Supabase RLS; defensible project-ownership statements.

## Not yet fully audited

All interview conversations beyond the accessible snippets/summaries; unpublished study PDFs; the missing V3 ZIP/Git history; user-provided project documents outside this Project; source/version correctness for each new content example. Existing V3 content is largely a one-sentence summary and a question, **not** eight-part production lesson content.

## M3 editorial expansion

Added individually written reference lessons for prompt design, RAG production lifecycle, LangGraph and multi-agent architecture, evaluation, speech/banking workflows, cloud/agent tool security and Spark/Delta optimization. Incomplete topics remain labeled as incomplete in the UI; breadth is not technical sign-off.

## Publishing gate

Do not mark the curriculum complete until every row of `TOPIC_COVERAGE.csv` has eight substantive sections, domain SME verification, an interview-answer timing check, and regression test questions. Do not equate deterministic keyword coverage with factual accuracy.
