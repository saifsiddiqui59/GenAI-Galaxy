import json, re, collections, pathlib
from bs4 import BeautifulSoup
root=pathlib.Path(__file__).resolve().parents[1]
src=(root/'V3_REFERENCE.html').read_text()
script=BeautifulSoup(src,'html.parser').find_all('script')[0].get_text()
start=script.index(' = ')+3
subjects=json.loads(script[start:script.rfind('];')+1])
original_count=sum(len(g['items']) for c in subjects for g in c['groups'])
assert len(subjects)==17 and original_count==230
# Grounded gaps: prior interview questions, project/resume architecture and requirements not represented as distinct existing topics.
additions={
 'LLM & Transformer Fundamentals': [('Inference & latency','Prefill bottlenecks & long-context diagnostics','Separate large-context prefill cost from decoding and retriever latency.','Why can first response time spike even with a KV cache?')],
 'RAG & Knowledge Retrieval': [('Retrieval & ranking','Embedding model migration & full reindex','Changing embedding dimensions or model versions usually requires a compatible reindex.','What happens when embeddings change but vectors remain old?'),('RAG lifecycle','Document change detection & tombstones','Checksum and version documents; re-embed changed chunks and delete stale records.','How do you handle a revised policy without leaving stale snippets?'),('Retrieval & ranking','Reranker latency and recall trade-off','Stage cheap retrieval first, then rerank a bounded candidate set.','Where do you put reranking and how do you measure its cost?')],
 'Banking Voice Assistant': [('Speech pipeline','Speech recognition WER & transcription evaluation','Measure word error rate with human-verified speech references and domain vocabulary.','How do you evaluate transcription quality before LLM response generation?'),('Speech pipeline','Speech recognition browser fallback','Provide editable text when Web Speech recognition is unsupported or microphone access fails.','How should the UI recover from unavailable STT?'),('Speech pipeline','Azure Speech short-lived token broker','Keep subscription credentials server-side and vend scoped short-lived tokens to trusted clients.','How do you avoid placing a Speech subscription key in a static website?')],
 'Agentic AI, Tools & MCP': [('Tool safety','Idempotent tool execution','Assign operation IDs and verify side effects to prevent duplicate bookings.','How do you handle timeouts after booking may have already succeeded?'),('Tool safety','Tool authorization and least-privilege schemas','Check the actual caller identity and resource ownership in the backend before tool execution.','Can a system prompt replace authorization checks?')],
 'GenAI Evaluation & Quality Gates': [('Evaluation metrics','LLM judge calibration','Calibrate judge output against expert human labels and investigate agreement.','What if LLM-as-judge scores disagree with senior reviewers?'),('Evaluation metrics','Speech + answer end-to-end evaluation','Assess transcription fidelity, grounded answer quality and task success separately.','How do you isolate a voice assistant error to STT, RAG or LLM?')],
 'Responsible AI & Security': [('Threat modelling','Indirect prompt injection from retrieved documents','Treat retrieved content as untrusted evidence, never as authorization to call tools.','What if a policy PDF instructs the agent to leak an account balance?')],
 'LLMOps, Monitoring & CI/CD': [('Production operations','Correlated voice and tool tracing','Carry correlation IDs across WebSocket, STT, retrieval, tools and TTS.','How do you debug a slow banking call end to end?')],
 'Architecture & System Design Cases': [('Document systems','Secure resume upload, extraction & lifecycle','Enforce file limits, private user paths, scanning, deletion and server-side parsing.','How would you safely ingest a candidate resume into an interview tutor?')],
 'Python, SQL & API Skills': [('Data access','Supabase RLS vs API authorization','Use per-user RLS for defense in depth, and verify JWT identity on privileged APIs.','Why does a frontend user_id filter not provide security?')],
 'Interview, Resume & Career Stories': [('Career narratives','Explain project ownership versus proof','Differentiate personally implemented features, team contributions, and proposed improvements.','Which parts of your banking voice agent did you build yourself?')]
}
for chapter, items in additions.items():
 c=next(c for c in subjects if c['title']==chapter)
 for gtitle,title,summary,question in items:
  group=next((g for g in c['groups'] if g['title']==gtitle),None)
  if group is None:
   group={'title':gtitle,'summary':'Production interview extensions grounded in prior questions and projects','items':[]};c['groups'].append(group)
  if not any(x['title'].strip().casefold()==title.casefold() for gg in c['groups'] for x in gg['items']):
   group['items'].append({'title':title,'summary':summary,'question':question,'origin':'V4 gap audit'})
flat=[(c['title'],g['title'],it['title']) for c in subjects for g in c['groups'] for it in g['items']]
assert len(flat)==len(set(flat)), 'duplicated topic key'
assert len(subjects)==17
(root/'data'/'curriculum.json').write_text(json.dumps(subjects,ensure_ascii=False,indent=2)+'\n')
print('Verified V3 base',original_count,'Additions',len(flat)-original_count,'V4',len(flat),'chapters',len(subjects),'groups',sum(len(c['groups']) for c in subjects))
