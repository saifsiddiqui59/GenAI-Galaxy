const assert=require('node:assert/strict');const p=require('../features/private-study-plan.js');
const topics=[
 {title:'Database indexes',branch:'SQL',group:'Databases',summary:'SQL server'},
 {title:'RAG retrieval',branch:'GenAI',group:'Vector embeddings',summary:'Build a RAG retriever with embeddings'},
 {title:'LangGraph agents',branch:'GenAI',group:'Agentic AI',summary:'Agents route and use tools'}];
const plan=p.buildPlan({topics,role:'GenAI Engineer',jobText:'We need retrieval augmented generation and LangGraph agents',resumeText:'I have built RAG retrieval systems in Python',days:3});
assert.equal(plan.schedule.length,3);assert.ok(plan.requiredSkills.includes('rag'));
assert.ok(plan.skillGaps.some(s=>s.skill==='langgraph'));
assert.ok(plan.mentionedSkills.some(s=>s.skill==='rag'));
assert.equal(JSON.stringify(plan).includes('I have built'),false);
assert.equal(JSON.stringify(plan).includes('We need'),false);
assert.match(plan.schedule[0].reason,/gap/i);
assert.ok(plan.evaluation.includes('not a semantic LLM'));
console.log('P36 local JD/CV job-skill evidence planning passed');
