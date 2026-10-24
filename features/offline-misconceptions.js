/* P39: tiny, transparent curriculum-linked misconception warnings.
 * NOT a factual evaluator: detects only a few reviewed affirmative claims.
 * Source references:
 * https://platform.openai.com/tokenizer
 * https://docs.databricks.com/aws/en/tables/operations/vacuum
 * https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators
 * No network, embeddings, external model, analytics or saved answer text.
 */
(function(root){
 'use strict';
 const rules=Object.freeze([
  {id:'tokens_not_words',topic:'Tokens & tokenization',
   pattern:/\b(?:all\s+words?\s+map\s+to\s+(?:exactly\s+)?one\s+token|one\s+word\s+(?:always\s+)?equals?\s+one\s+token)\b/i,
   note:'Token boundaries do not correspond one-to-one with English words.',
   reference:'https://platform.openai.com/tokenizer'},
  {id:'citation_not_proof',topic:'Groundedness',
   pattern:/\b(?:any\s+answer\s+with\s+(?:one|a)\s+citation\s+is\s+(?:always\s+)?correct|citations?\s+(?:always\s+)?guarantees?\s+(?:correctness|groundedness))\b/i,
   note:'A citation alone does not prove that a claim is supported by the source.',
   reference:'https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators'},
  {id:'vacuum_limits_time_travel',topic:'Delta transaction log & ACID',
   pattern:/\b(?:delta\s+)?time\s+travel\s+(?:always\s+works|works\s+forever)\b.{0,70}\b(?:vacuum|removed?\s+files?|deleted?\s+files?)\b/i,
   note:'VACUUM can remove the data files needed to query older Delta versions.',
   reference:'https://docs.databricks.com/aws/en/tables/operations/vacuum'},
  {id:'tool_authorization_required',topic:'Tool calling lifecycle',
   pattern:/\b(?:model|agent)\s+(?:can|may|should)\s+(?:execute|run|invoke)\s+(?:all\s+)?(?:tools?|tool\s+calls?)\s+without\s+(?:checking\s+)?(?:authorization|permission|user\s+approval)\b/i,
   note:'Tool execution with side effects requires appropriate authorization and controls.',
   reference:null}
 ]);
 const NEGATION=/\b(?:not|never|incorrect|false|wrong|myth|isn't|doesn't|can't|cannot|shouldn't|mustn't|untrue)\b/i;
 function check(topicKey,answer){
  const key=String(topicKey||'').slice(0,300);
  const sentences=String(answer||'').slice(0,2000).split(/[.!?;\n]+/).map(s=>s.trim()).filter(Boolean);
  const matches=[];
  for(const rule of rules){
   if(!key.endsWith(' / '+rule.topic))continue;
   for(const sentence of sentences){
    const hit=rule.pattern.exec(sentence);
    if(!hit)continue;
    // Suppress when the speaker explicitly negates/corrects this claim before stating it.
    if(NEGATION.test(sentence.slice(0,hit.index)))continue;
    matches.push({id:rule.id,note:rule.note,reference:rule.reference});
    break;
   }
  }
  return matches;
 }
 const api=Object.freeze({check,ruleCount:rules.length,scope:'Limited exact-pattern warnings; absence of a match does not certify correctness.'});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxyMisconceptionGuard=api;
})(typeof window!=='undefined'?window:globalThis);
