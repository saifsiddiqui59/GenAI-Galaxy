const assert=require('node:assert/strict');
const m=require('../features/speaking-metrics.js'),p=require('../features/private-study-plan.js');
const timed=m.fromTranscript('Um we used RAG for retrieval and saved time',{
 elapsedMs:35000,voiceEvents:[{type:'speechstart',time:0},{type:'speechend',time:3000},{type:'speechstart',time:5000},{type:'speechend',time:8000}]
});
assert.equal(timed.paceBasis,'browser speech intervals');
assert.equal(timed.detectedPauseBoundaries,1);
assert.equal(timed.detectedPauseMs,2000);
assert.ok(timed.estimatedWordsPerMinute>10);
assert.equal(timed.storesAudio,false);
const incomplete=m.fromTranscript('Hello',{voiceEvents:[{type:'speechend',time:10}]});
assert.equal(incomplete.detectedPauseBoundaries,null);
assert.equal(incomplete.estimatedWordsPerMinute,null);
const plan=p.buildPlan({role:'GenAI Engineer',jobText:'Retrieval augmented generation and Azure AI Foundry, semantic vectors',resumeText:'Used LangGraph and Azure',topics:[
 {title:'SQL joins',group:'Data',branch:'SQL'},
 {title:'RAG and Foundry',group:'Retrieval augmented generation',branch:'GenAI'}],days:2});
assert.match(plan.schedule[0].topic,/RAG/);
assert.equal(JSON.stringify(plan).includes('Used LangGraph'),false);
assert.equal(plan.matchedTopicCount,1);
console.log('P35 P2 free speaking and local JD matching tests passed');
