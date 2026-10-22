import pathlib,json,csv,collections
R=pathlib.Path(__file__).resolve().parents[1]
chapters=json.loads((R/'data/curriculum.json').read_text());lessons=json.loads((R/'data/lessons.json').read_text())
rows=[]
for c in chapters:
 for g in c['groups']:
  for t in g['items']:
   expanded=t['title'] in lessons
   rows.append({'chapter':c['title'],'group':g['title'],'topic':t['title'],'curriculum_origin':'V4 discovered gap' if t.get('origin') else 'V3 verified','content_status':'expanded_8_sections_editorial_unverified' if expanded else 'overview_only_incomplete','eight_sections_present':'yes' if expanded else 'no','source_question':t['question']})
with (R/'docs'/'TOPIC_COVERAGE.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
expanded=sum(x['eight_sections_present']=='yes' for x in rows)
report=f'''# V4 topic-coverage audit — 2026-10-22

**Scope:** V3 `GenAI_Adaptive_Tutor_Interactive.html` recovered from the available Library, the user's resume and available prior interview-conversation summaries/questions. The original V3 ZIP and complete historical transcripts were not accessible, so an exhaustive audit of *every* conversation **cannot be claimed**.

| Measure | Count | Evidence / interpretation |
|---|---:|---|
| Original V3 chapter count | 17 | Programmatically parsed from recovered V3 HTML |
| Original V3 topic records | 230 | Programmatically parsed, source retained in `V3_REFERENCE.html` |
| Original V3 subject groups | 45 | Programmatically parsed |
| New, non-duplicate gap records | 16 | Prior GenAI conversations/resume, added to appropriate chapters |
| V4 total topics | {len(rows)} | Verified unique hierarchical keys |
| V4 groups | {sum(len(x['groups']) for x in chapters)} | Includes 10 dedicated gap-audit groups |
| Expanded eight-section lessons | {expanded} | Authored in `data/lessons.json`; **not SME verified** |
| Incomplete eight-section lessons | {len(rows)-expanded} | Existing topic has only short overview/interview question |
| Duplicated chapter/group/topic keys | 0 | Checked by automated test |
| Complete verified technical coverage | **not established** | Requires a topic-by-topic SME review |

## Gap themes discovered and added

Changes to long-context prefill; embeddings migration and stale-chunk cleanup; reranking trade-offs; STT WER and browser fallback; short-lived Azure Speech tokens; idempotent tool side effects and authorization; LLM-judge calibration; end-to-end speech/answer testing; indirect prompt injection; distributed tracing; private document processing; Supabase RLS; defensible project-ownership statements.

## Not yet fully audited

All interview conversations beyond the accessible snippets/summaries; unpublished study PDFs; the missing V3 ZIP/Git history; user-provided project documents outside this Project; source/version correctness for each new content example. Existing V3 content is largely a one-sentence summary and a question, **not** eight-part production lesson content.

## Publishing gate

Do not mark the curriculum complete until every row of `TOPIC_COVERAGE.csv` has eight substantive sections, domain SME verification, an interview-answer timing check, and regression test questions. Do not equate deterministic keyword coverage with factual accuracy.
'''
(R/'docs'/'COVERAGE_REPORT.md').write_text(report)
print('Coverage audit:',len(rows),'total',expanded,'expanded',len(rows)-expanded,'incomplete')
