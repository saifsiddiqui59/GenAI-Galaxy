/* Galaxy P34: quota-free, source-authored follow-up coach. Not an accuracy grader. */
(function(root){
 'use strict';
 const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
 const normalize=value=>compact(value).toLowerCase();
 const inRange=(str,max)=>compact(str).slice(0,max);
 function questionBank(topic,lesson){
  const t=topic||{},l=lesson||{};
  const pool=[t.question,...(Array.isArray(l.followups)?l.followups:[])];
  const questions=pool.filter(x=>typeof x==='string').map(x=>inRange(x,350))
   .filter((q,i,list)=>q.length>=8&&list.findIndex(x=>normalize(x)===normalize(q))===i);
  if(!questions.length)questions.push('Explain '+inRange(t.title||'this concept',100)+' and describe a practical use.');
  return questions;
 }
 function deliverySignals(answer){
  const text=compact(answer).toLowerCase(),words=text.match(/[a-z]+(?:'[a-z]+)?/g)||[];
  const signs={
   sufficientDetail:words.length>=24,
   explanation:/\b(because|works by|means|uses|helps|allows|enables|process|flow|step|first|then)\b/i.test(text),
   example:/\b(for example|for instance|such as|e\.g\.|in my project|we used|i used|scenario)\b/i.test(text)
  };
  return {wordCount:words.length,signals:signs,
   note:'Text-structure hints only. Technical truth and relevance require independent review.'};
 }
 function nextTurn({topic,lesson,answer='',used=[],round=1,feedback=null,currentQuestion=''}={}){
  const t=topic||{},l=lesson||{},clean=compact(answer),past=Array.isArray(used)?used.filter(x=>typeof x==='string').slice(-20):[];
  const seen=new Set([...past,currentQuestion].map(normalize).filter(Boolean));
  const bank=questionBank(t,l),novel=bank.find(q=>!seen.has(normalize(q)));
  if(round>5)return {kind:'complete',text:'Five interview questions completed. Review your report before another session.',factualGrade:false};
  if(!clean||/^(i (do not|don't|dont) know|no idea|not sure)$/i.test(clean))
   return {kind:'teach',text:inRange(l.simple||t.summary||'Read the topic explanation first.',800),example:inRange(l.example||'',600),
      nextQuestion:novel||bank[0],factualGrade:false};
  // Model-generated follow-ups are used only if an explicit, authenticated prior evaluation returned one.
  const modelFollowup=feedback?.serverReviewed===true&&typeof feedback.followup==='string'?inRange(feedback.followup,300):'';
  const gap=(Array.isArray(feedback?.missing)?feedback.missing:[])
   .filter(x=>typeof x==='string'&&/^[\w +./-]{3,65}$/.test(x)).slice(0,2);
  const detail=deliverySignals(clean);
  if(modelFollowup.length>=12&&!seen.has(normalize(modelFollowup)))
   return {kind:'followup',text:'Follow-up from the previous authenticated model review (not an independently verified assessment).',
    nextQuestion:modelFollowup,factualGrade:false,source:'authenticated-model-followup',signals:detail};
  if(gap.length&&round<=4){
   const prompt='Explain how '+inRange(t.title||'this topic',80)+' relates to '+gap.join(' and ')+'. Include a practical example.';
   if(!seen.has(normalize(prompt)))
    return {kind:'followup',text:'These reference terms were not clearly mentioned in the previous answer; this does not mean the answer was incorrect.',
      nextQuestion:prompt,factualGrade:false,source:'reference-concepts',signals:detail};
  }
  if(novel)return {kind:'followup',text:detail.wordCount<18?'Try explaining the mechanism and one concrete example.':'Continue with an authored question about this topic.',
    nextQuestion:novel,factualGrade:false,source:'authored-lesson',signals:detail};
  return {kind:'next-topic',text:'No unused authored follow-ups remain for this topic. Continue to a new topic.',factualGrade:false,signals:detail};
 }
 const api=Object.freeze({questionBank,deliverySignals,nextTurn});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxyConversationCoach=api;
})(typeof window!=='undefined'?window:globalThis);
