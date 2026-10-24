// P39: use reviewed negative-control examples without network or AI models.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),guard=require('../features/offline-misconceptions.js');
const rows=fs.readFileSync(path.join(root,'docs/ai/evaluation/golden-galaxy-v1.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse);
const tests=['token_budget','bad_grounding','delta_retention','tool_side_effects'];
for(const id of tests){
 const sample=rows.find(x=>x.id===id);assert(sample,id+' missing from frozen golden data');
 const found=guard.check(sample.topic_key,sample.candidate_answer);
 assert(found.length>0,id+' must raise a reference warning');
 assert(found.every(x=>typeof x.note==='string'&&x.note.length>12));
}
const safe=[
 ['LLM & Transformer Fundamentals / Model mechanics / Tokens & tokenization','It is wrong to claim all words map to exactly one token. A tokenizer can split words.'],
 ['Databricks, Spark & Delta Lake / Delta Lake / Delta transaction log & ACID','It is false that Delta time travel always works even after vacuum removes files.'],
 ['GenAI Evaluation & Quality Gates / Metric interpretation / Groundedness','Any answer with one citation is not always correct; the citation must support the claim.'],
 ['Agentic AI, Tools & MCP / Tool use / Tool calling lifecycle','The model cannot execute all tool calls without checking authorization.']
];
for(const [topic,answer] of safe)assert.equal(guard.check(topic,answer).length,0,'negated safe answer must not trigger');
assert.equal(guard.check('Unrelated topic','All words map to exactly one token').length,0,'topic scoping protects against irrelevant flags');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8').replace(/\nstart\(\);\s*$/,'\n');
const ctx=vm.createContext({console,window:{GalaxyMisconceptionGuard:guard},document:{getElementById:()=>null},matchMedia:()=>({matches:false}),
 Date,Math,JSON,setTimeout,clearTimeout,performance:{now:()=>0},localStorage:{},navigator:{},location:{},addEventListener:()=>{},requestAnimationFrame:()=>0});
vm.runInContext(src,ctx,{filename:'app.js'});
ctx.__topic={title:'Tokens & tokenization',branch:'LLM & Transformer Fundamentals',group:'Model mechanics',
 summary:'Tokenization is not word count'};
ctx.__lessons=JSON.parse(fs.readFileSync(path.join(root,'data/lessons.json'),'utf8'));
vm.runInContext('state.lessons=__lessons;',Object.assign(ctx,{__topic:ctx.__topic,__lessons:ctx.__lessons}));
const score=vm.runInContext("evaluateAnswer(__topic,'All words map to exactly one token so multiply word count by one.')",ctx);
assert.equal(score.challengeReady,false,'known incorrect assertion must not pass local difficulty guard');
assert(score.misconceptions.length>0);
assert.equal(score.serverReviewed,false);
assert.match(guard.scope,/not certify correctness/i);
assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('features/offline-misconceptions.js'));
console.log('P39 curated misconception & negation controls passed with no model calls');
