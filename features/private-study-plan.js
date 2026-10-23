/* P35 P2: offline JD/CV concepts, privacy-first, role-weighted and explainable. */
(function(root){
 'use strict';
 const stop=new Set('about after again and are based been being between build building can could data engineer experience for from have into like more must only other our role should some team than that the their them there these this through using want when which with work your'.split(' '));
 const aliases={'retrieval-augmented':'rag','retrieval augmented':'rag','large language model':'llm',
   'language models':'llm','azure ai foundry':'foundry','vector database':'vector','vector store':'vector',
   'speech to text':'stt','speech-to-text':'stt','azure data factory':'adf'};
 const normalize=s=>Object.entries(aliases).reduce((x,[a,b])=>x.replaceAll(a,b),String(s||'').toLowerCase());
 const tokens=x=>(normalize(x).match(/[a-z][a-z0-9+#.-]{2,}/g)||[]).filter(x=>!stop.has(x));
 const unique=x=>[...new Set(x)];
 function buildPlan({topics=[],role='',jobText='',resumeText='',days=14}={}){
  const total=Math.min(30,Math.max(1,Number.isInteger(days)?days:14));
  const jd=unique(tokens(String(jobText).slice(0,12000))),cv=unique(tokens(String(resumeText).slice(0,12000))),roleWords=unique(tokens(role));
  const entries=(Array.isArray(topics)?topics:[]).slice(0,1000).map((t,i)=>{
   const key=[t.branch,t.group,t.title].filter(Boolean).join(' / ');
   const words=new Set(tokens([t.title,t.group,t.branch,t.summary].join(' ')));
   const matched=jd.filter(w=>words.has(w)).slice(0,6);
   const experienced=cv.filter(w=>words.has(w)).length;
   const roleCount=roleWords.filter(w=>words.has(w)).length;
   const score=matched.length*4+roleCount*2+Math.min(3,experienced);
   return {key,title:String(t.title||''),branch:String(t.branch||''),score,matched,experienced,order:i};
  }).filter(t=>t.title&&t.key);
  entries.sort((a,b)=>b.score-a.score||a.order-b.order);
  const matchedTopicCount=entries.filter(t=>t.matched.length>0).length;
  return {role:String(role).slice(0,80),days:total,matchedTopicCount,
   schedule:entries.slice(0,total).map((t,i)=>({day:i+1,topicKey:t.key,topic:t.title,
    reason:t.matched.length?'Matches JD concepts: '+t.matched.join(', '):'Foundational review / role relevance',
    source:'existing Galaxy curriculum'})),
   privacy:'Local-only analysis; original resume/JD text is not included in result',
   evaluation:'Lexical concept matching with phrase aliases, not semantic scoring or actual competency evidence'};
 }
 const api=Object.freeze({buildPlan});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxyPrivateStudyPlan=api;
})(typeof window!=='undefined'?window:globalThis);
