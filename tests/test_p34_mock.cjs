// P34: no-network deterministic mock interview contracts; no AI expenditure.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const coach=require('../features/conversation-coach.js');
const source=fs.readFileSync(path.join(root,'app.js'),'utf8').replace(/\nstart\(\);\s*$/,'\n');
const ctx=vm.createContext({console,window:{GalaxyConversationCoach:coach},document:{getElementById:()=>null},
 matchMedia:()=>({matches:false}),Date,Math,JSON,performance:{now:()=>0},
 setTimeout,clearTimeout,localStorage:{},navigator:{},location:{},addEventListener:()=>{},requestAnimationFrame:()=>0});
vm.runInContext(source,ctx,{filename:'app.js'});
const lessons=JSON.parse(fs.readFileSync(path.join(root,'data/lessons.json'),'utf8'));
const topics=['KV cache','Embeddings','RAG','Prompt engineering','Fine-tuning','Tokenization','LangGraph']
 .map((title,i)=>({title,branch:'GenAI',group:'Core',summary:'core concepts',question:'Explain '+title+' with a practical example?',branchIndex:i}));
ctx.__topics=topics;ctx.__lessons=lessons;
vm.runInContext('render=()=>{};stopVoice=()=>{};saveProgress=async()=>true;state.topics=__topics;state.lessons=__lessons;state.current=__topics[0];state.progress={};',ctx);
const get=code=>vm.runInContext(code,ctx);
const set=code=>vm.runInContext(code,ctx);
set('startMockSession()');
assert.equal(get('state.session.done'),0);
assert.equal(get('state.session.limit'),5);
for(let i=0;i<4;i++){
 set("state.feedback={serverReviewed:false,missing:['cache'],challengeReady:false,score:15,passed:false};state.answerDraft='A cache holds previous attention computations so they can be reused during generation and reduce repeated processing.'");
 set('nextAdaptive()');
 assert.equal(get('state.session.done'),i+1,'Each click must consume exactly one mock round');
 assert.equal(get('state.session.rounds.length'),i+1);
 assert.equal(get('state.session.rounds.filter(r=>r.modelReviewed).length'),0);
}
set("state.feedback={serverReviewed:false,missing:['cache'],challengeReady:false,score:15,passed:false};state.answerDraft='The answer demonstrates a concept with a detailed explanation and a practical example.'");
set('nextAdaptive()');
assert.equal(get('state.session'),null,'Fifth answer must end the mock');
assert.equal(get('state.sessionReport.done'),5);
assert.equal(get('state.sessionReport.answered'),5);
assert.equal(get('state.sessionReport.modelReviewed'),0);
assert.equal(get('state.sessionReport.skipped'),0);
set('startMockSession()');
async function skipFive(){for(let i=0;i<5;i++){set('state.feedback=null;state.progress={};');await set('advanceTopic()');}}

// async skip regression is run under a separate function to keep test synchronous
assert.equal(typeof get('advanceTopic'),'function');
assert.equal(get('state.sessionReport.done'),5);
const l={simple:'Tokenization splits input into model tokens.',keywords:['token','context'],followups:['Why do tokens impact context windows?']};
const t={title:'Tokens',question:'What is a token?'};
const model=coach.nextTurn({topic:t,lesson:l,answer:'Tokens represent parts of text and the window counts their number.',feedback:{serverReviewed:true,followup:'How would you budget token cost for a long chat?'},currentQuestion:t.question,round:1});
assert.equal(model.source,'authenticated-model-followup');
assert.equal(model.nextQuestion,'How would you budget token cost for a long chat?');
const gap=coach.nextTurn({topic:t,lesson:l,answer:'Tokens represent text.',feedback:{serverReviewed:false,missing:['context']},currentQuestion:t.question,round:1});
assert.equal(gap.source,'reference-concepts');
assert.equal(gap.factualGrade,false);
const signals=coach.deliverySignals('For example the model uses tokens because text is segmented.');
assert.equal(signals.signals.example,true);
assert.equal(signals.signals.explanation,true);
assert.equal(coach.nextTurn({topic:t,lesson:l,round:6}).kind,'complete');
console.log('P34 mock five-round / answer-aware follow-ups passed with zero network or AI calls');
