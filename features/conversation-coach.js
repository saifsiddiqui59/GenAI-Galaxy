/* Galaxy P26 · zero-token authored interview coach. Does not score factual correctness. */
(function(root){
 'use strict';
 const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
 const choose=(q,seen)=>!seen.some(x=>x.toLowerCase()===q.toLowerCase());
 function questionBank(topic,lesson){
  const l=lesson||{},t=topic||{};
  const list=[compact(t.question),...(Array.isArray(l.followups)?l.followups:[]).map(compact)];
  const questions=list.filter((q,i)=>q.length>=8&&list.findIndex(x=>x.toLowerCase()===q.toLowerCase())===i);
  if(!questions.length)questions.push('Explain '+compact(t.title||'this concept')+' and describe one practical use.');
  return questions;
 }
 function nextTurn({topic,lesson,answer='',used=[],round=1}={}){
  const t=topic||{},l=lesson||{},clean=compact(answer);
  const previous=Array.isArray(used)?used.filter(x=>typeof x==='string').slice(0,12):[];
  const bank=questionBank(t,l);
  const novel=bank.find(q=>choose(q,previous));
  if(round>=5||!novel)return {kind:'complete',text:'This authored practice round is complete. Review your responses and revisit weak concepts.',factualGrade:false};
  if(!clean||/^(i (do not|don't|dont) know|no idea|not sure)$/i.test(clean))
   return {kind:'teach',text:compact(l.simple||t.summary||'Read the topic explanation before trying again.'),example:compact(l.example),nextQuestion:novel,factualGrade:false};
  const words=clean.split(/\s+/).length;
  return {kind:'followup',text:words<18?'Try adding how it works and one concrete example.':'Thanks. Continue with the next source-authored interview question.',nextQuestion:novel,factualGrade:false,source:'authored lesson'};
 }
 const api=Object.freeze({questionBank,nextTurn});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxyConversationCoach=api;
})(typeof window!=='undefined'?window:globalThis);
