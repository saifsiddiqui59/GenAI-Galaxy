/* Galaxy P27 · on-device job-focus plan; raw CV and job text never leave browser. */
(function(root){
 'use strict';
 const stop=new Set('about after again and are based been being between build building can could data engineer experience for from have into like more must only other our role should some team than that the their them there these this through using want when which with work your'.split(' '));
 const tokens=x=>(String(x||'').toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g)||[]).filter(x=>!stop.has(x));
 const unique=x=>[...new Set(x)];
 function buildPlan({topics=[],role='',jobText='',resumeText='',days=14}={}){
  const total=Math.min(30,Math.max(1,Number.isInteger(days)?days:14));
  const job=unique(tokens(String(jobText).slice(0,12000))),cv=unique(tokens(String(resumeText).slice(0,12000))),roleWords=unique(tokens(role));
  const ranked=(Array.isArray(topics)?topics:[]).map((t,i)=>{
   const key=[t.branch,t.group,t.title].filter(Boolean).join(' / ');
   const description=tokens([t.title,t.group,t.branch,t.summary].join(' '));
   const words=new Set(description);
   const matched=job.filter(w=>words.has(w)).slice(0,6);
   const score=matched.length*3+cv.filter(w=>words.has(w)).length+roleWords.filter(w=>words.has(w)).length*2;
   return {key,title:String(t.title||''),branch:String(t.branch||''),score,matched,order:i};
  }).filter(t=>t.title&&t.key);
  ranked.sort((a,b)=>b.score-a.score||a.order-b.order);
  const selected=ranked.slice(0,total);
  const schedule=selected.map((t,i)=>({day:i+1,topicKey:t.key,topic:t.title,reason:t.matched.length?'Matches job terms: '+t.matched.join(', '):'Foundational review',source:'existing Galaxy curriculum'}));
  return {role:String(role).slice(0,80),days:total,matchedTopicCount:ranked.filter(t=>t.score>0).length,schedule,privacy:'Local-only analysis; original resume/JD text not saved',evaluation:'Topic relevance is lexical, not competence assessment'};
 }
 const api=Object.freeze({buildPlan});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxyPrivateStudyPlan=api;
})(typeof window!=='undefined'?window:globalThis);
