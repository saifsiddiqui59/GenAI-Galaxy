/* P35 P1: offline evidence-provenance and revision policy. No extra AI calls. */
(function(root){
 'use strict';
 function finiteScore(n){return typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100;}
 function classify(review){
  if(!review||review.serverReviewed!==true)return {kind:'local',verified:false,masteryEligible:false,
   label:'Local practice — technical accuracy unverified',reason:'Keyword or text structure checks do not validate facts.'};
  const accuracy=review.accuracy,clarity=review.clarity;
  if(!finiteScore(accuracy)||!finiteScore(clarity)||!Array.isArray(review.missing)||typeof review.passed!=='boolean')
   return {kind:'invalid',verified:false,masteryEligible:false,label:'Incomplete AI feedback',reason:'Model scores could not be validated.'};
  const omissions=review.missing.length;
  const contradiction=review.passed&&(accuracy<85||clarity<65||omissions>0);
  return {kind:'model-estimate',verified:false,
   masteryEligible:!contradiction&&review.passed&&accuracy>=85&&clarity>=65&&omissions===0,
   label:'AI reviewer estimate — not independent verification',
   reason:contradiction?'Model feedback is inconsistent; no mastery credit.':
     omissions?'Revisit missing reference concepts.':'Compare the answer with the reviewed source before treating it as correct.',
   accuracy,clarity,omissions};
 }
 function nextReview({evidence,history=0,skipped=false}={}){
  const e=classify(evidence);
  const attempts=Math.max(0,Math.min(100,Number.isInteger(history)?history:0));
  if(skipped)return {days:1,advanceDifficulty:false,masteryCredit:false,reason:'Skipped question'};
  if(e.kind!=='model-estimate')return {days:1,advanceDifficulty:false,masteryCredit:false,reason:e.label};
  if(e.masteryEligible&&attempts>=1)return {days:[1,3,7,14,30][Math.min(attempts,4)],advanceDifficulty:true,masteryCredit:true,reason:'Repeated model-reviewed strong performance (unverified estimate)'};
  if(e.masteryEligible)return {days:2,advanceDifficulty:true,masteryCredit:false,reason:'First strong model-reviewed attempt'};
  return {days:1,advanceDifficulty:false,masteryCredit:false,reason:e.reason};
 }
 const api=Object.freeze({classify,nextReview});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxyEvidencePolicy=api;
})(typeof window!=='undefined'?window:globalThis);
