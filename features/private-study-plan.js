/* P36 · Explainable local role/JD vs CV coverage. No uploads, embedding API, or model tokens. */
(function(root){
 'use strict';
 const stop=new Set('about after again and are based been being between build building can could data engineer experience for from have into like more must only other our role should some team than that the their them there these this through using want when which with work your'.split(' '));
 const aliases={'retrieval-augmented generation':'rag','retrieval augmented generation':'rag','retrieval-augmented':'rag','retrieval augmented':'rag',
 'large language models':'llm','large language model':'llm','azure ai foundry':'foundry',
 'azure data factory':'adf','vector databases':'vector','vector database':'vector',
 'vector stores':'vector','vector store':'vector','speech-to-text':'stt','speech to text':'stt'};
 const normalize=s=>{
  let v=String(s||'').toLowerCase();
  for(const [phrase,word] of Object.entries(aliases).sort((a,b)=>b[0].length-a[0].length)){
   v=v.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),word);
  }
  return v;
 };
 const tokens=x=>(normalize(x).match(/[a-z][a-z0-9+#.-]{2,}/g)||[]).filter(x=>!stop.has(x));
 const unique=x=>[...new Set(x)];
 const skillAliases={
  rag:['rag','retrieval'],embedding:['embedding','embeddings'],vector:['vector','similarity'],langgraph:['langgraph'],langchain:['langchain'],
  agents:['agent','agents','agentic'],evaluation:['evaluation','ragas','deepeval','groundedness'],azure:['azure','foundry'],
  databricks:['databricks','spark'],adf:['adf'],python:['python'],sql:['sql'],mcp:['mcp'],
  security:['security','identity','entra','rbac'],speech:['stt','speech'],prompt:['prompt','prompting'],
  terraform:['terraform'],docker:['docker'],kubernetes:['kubernetes','aks'],monitoring:['monitoring','observability']
 };
 const skills=text=>{
  const words=new Set(tokens(text));
  return Object.entries(skillAliases).filter(([,terms])=>terms.some(w=>words.has(w))).map(([name])=>name);
 };
 function buildPlan({topics=[],role='',jobText='',resumeText='',days=14,progress={}}={}){
  const total=Math.min(30,Math.max(1,Number.isInteger(days)?days:14));
  const jd=unique(tokens(String(jobText).slice(0,12000))),cv=unique(tokens(String(resumeText).slice(0,12000))),roleWords=unique(tokens(role));
  const needs=skills(jobText),claims=new Set(skills(resumeText)),gaps=needs.filter(x=>!claims.has(x)),covered=needs.filter(x=>claims.has(x));
  const entries=(Array.isArray(topics)?topics:[]).slice(0,1000).map((t,i)=>{
   const key=[t.branch,t.group,t.title].filter(Boolean).join(' / ');
   const words=new Set(tokens([t.title,t.group,t.branch,t.summary].join(' ')));
   const matched=jd.filter(w=>words.has(w)).slice(0,6);
   const relatedGaps=gaps.filter(g=>skillAliases[g].some(w=>words.has(w)));
   const roleCount=roleWords.filter(w=>words.has(w)).length;
   const prior=progress&&typeof progress==='object'?progress[key]:null;
   const isMastered=prior?.status===2,needsReview=prior?.status===1;
   const score=relatedGaps.length*8+matched.length*3+roleCount*2+(needsReview?3:0)-(isMastered?8:0);
   return {key,title:String(t.title||''),branch:String(t.branch||''),score,matched,relatedGaps,order:i,isMastered};
  }).filter(t=>t.title&&t.key);
  entries.sort((a,b)=>b.score-a.score||a.order-b.order);
  return {
   role:String(role).slice(0,80),days:total,matchedTopicCount:entries.filter(t=>t.matched.length).length,
   requiredSkills:needs,skillGaps:gaps.map(skill=>({skill,reason:'Mentioned in the job description but not in the provided CV text'})),
   mentionedSkills:covered.map(skill=>({skill,reason:'Mentioned in both texts; proficiency not verified'})),
   schedule:entries.slice(0,total).map((t,i)=>({day:i+1,topicKey:t.key,topic:t.title,
    reason:t.relatedGaps.length?'Study possible JD/CV evidence gap: '+t.relatedGaps.join(', '):
      t.matched.length?'Relevant JD concepts: '+t.matched.join(', '):'Foundational role preparation',
    source:'existing Galaxy curriculum'})),
   privacy:'Local only; raw JD and CV texts are not returned or uploaded',
   evaluation:'Skills are inferred by matching terms and aliases; absence in CV is not proof of a real skill gap. This is not a semantic LLM assessment.'
  };
 }
 const api=Object.freeze({buildPlan,skills});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxyPrivateStudyPlan=api;
})(typeof window!=='undefined'?window:globalThis);
