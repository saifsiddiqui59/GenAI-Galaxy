/* P35 P3: motivational milestones based on activity, never a certified technical grade. */
(function(root){
 'use strict';
 const milestones=Object.freeze([
  {id:'first-topic',label:'First topic started',test:p=>p.started>=1},
  {id:'five-topics',label:'5 topics explored',test:p=>p.started>=5},
  {id:'ten-topics',label:'10 topics explored',test:p=>p.started>=10},
  {id:'first-model-review',label:'First AI-review attempt',test:p=>p.reviewed>=1},
  {id:'twenty-attempts',label:'20 practice attempts',test:p=>p.attempts>=20}
 ]);
 function summarize({progress={},attempts=[]}={}){
  const entries=Object.values(progress||{}),arr=Array.isArray(attempts)?attempts:[];
  const started=entries.filter(p=>p&&Number.isInteger(p.status)&&p.status>=1).length;
  const reviewed=arr.filter(a=>a?.serverReviewed===true||a?.source==='server_model').length;
  const counts={started,reviewed,attempts:arr.length};
  return {counts,earned:milestones.filter(m=>m.test(counts)).map(m=>({id:m.id,label:m.label})),
   next:milestones.filter(m=>!m.test(counts)).slice(0,2).map(m=>({id:m.id,label:m.label})),
   notice:'Milestones reflect recorded activity, not independently verified competence'};
 }
 const api=Object.freeze({summarize});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxyMilestones=api;
})(typeof window!=='undefined'?window:globalThis);
