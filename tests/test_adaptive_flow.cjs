// Offline adaptive-learning regression: no sign-in, network or paid AI calls.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8').replace(/\nstart\(\);\s*$/,'\n');
const answerBox={value:"I don't know the answer yet"};
let modelCalls=0;
const ctx=vm.createContext({
 console,window:{GALAXY_EVALUATOR_URL:'https://example.invalid/api/practice/evaluate'},
 matchMedia:()=>({matches:false}),
 document:{getElementById:id=>id==='spoken-answer'?answerBox:id==='evaluate-btn'?{disabled:false,textContent:''}:null},
 localStorage:{},setTimeout,clearTimeout,Date,Math,JSON,URL,performance:{now:()=>0},
 requestAnimationFrame:()=>0,location:{},navigator:{},addEventListener:()=>{},
 fetch:()=>{modelCalls++;throw Error('NO AI CALLS ALLOWED');}
});
vm.runInContext(source,ctx,{filename:'app.js'});
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data/lessons.json'),'utf8'));
const t1={title:'KV cache',branch:'LLM & Transformer Fundamentals',group:'Inference & latency',summary:'KV cache',question:'Explain KV cache.'};
const t2={title:'Embeddings',branch:'RAG & Knowledge Retrieval',group:'Semantic search',summary:'Embeddings',question:'Explain embeddings.'};
const t3={title:'What is RAG',branch:'RAG & Knowledge Retrieval',group:'Fundamentals',summary:'RAG',question:'What is RAG?'};
ctx.__lessons=lessons;ctx.__topics=[t1,t2,t3];
vm.runInContext([
 "state.lessons=__lessons;state.topics=__topics;state.current=__topics[0];",
 "state.attemptQuestion=__topics[0].question;state.progress={};state.attempts=[];",
 "state.isGuest=true;state.client=null;state.user=null;state.view='practice';",
 "render=()=>{};stopVoice=()=>{};saveProgress=async()=>true;notify=()=>{};"
].join('\n'),ctx);
const get=expression=>vm.runInContext(expression,ctx);
(async()=>{
 assert.equal(get("isUncertainAnswer('I do not know')"),true);
 assert.equal(get("isUncertainAnswer('not sure')"),true);
 assert.equal(get("isUncertainAnswer('no idea')"),true);
 assert.equal(get("isUncertainAnswer('I do not know the answer yet')"),true);
 assert.equal(get("isUncertainAnswer('Knowledge bases contain facts but I do not know why')"),false);
 assert.equal(get("isUncertainAnswer('I do not know'+' more words'.repeat(30))"),false);
 assert.equal(get("isUncertainAnswer('I explain how transformer KV caching avoids recomputation')"),false);
 assert.equal(get('state.guideOpen'),false);

 await get('submitAnswer({preventDefault(){}})');
 assert.equal(get('state.guideOpen'),true);
 assert.equal(get('state.feedback'),null);
 assert.equal(modelCalls,0);
 assert.equal(get("practiceMarkup().includes('adaptive-guide')"),true);
 assert.equal(get("practiceMarkup().includes('Simple explanation:')"),true);
 assert.equal(get("practiceMarkup().includes('adaptive-skip')"),true);
 get('beginGuidedPractice()');
 assert.equal(get('state.guideOpen'),false);
 assert.equal(get('state.level'),1);
 assert.match(get('state.attemptQuestion'),/In your own words/);

 await get('advanceTopic()');
 assert.equal(get('state.current.title'),'Embeddings');
 assert.equal(get('state.level'),1);
 assert.equal(get('state.guideOpen'),false);
 assert.equal(get('state.progress[Object.keys(state.progress)[0]].status'),1);
 assert.equal(get('state.progress[Object.keys(state.progress)[0]].confidence'),0);
 assert.equal(get('state.attempts.length'),0);
 assert.ok(Date.parse(get('state.progress[Object.keys(state.progress)[0]].next_review_at'))>Date.now());

 get("state.level=3;state.feedback={challengeReady:true,passed:false};");
 get("nextAdaptive()");
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(get('state.current.title'),'What is RAG');
 assert.equal(get('state.level'),1);
 assert.equal(get('state.feedback'),null);

 get("state.level=1;state.feedback={challengeReady:true,followup:'Follow-up question'};");
 get('nextAdaptive()');
 assert.equal(get('state.level'),2);
 assert.equal(get('state.attemptQuestion'),'Follow-up question');

 get("state.level=2;state.feedback={challengeReady:false,missing:['context']};");
 get('nextAdaptive()');
 assert.equal(get('state.level'),1);
 assert.match(get('state.attemptQuestion'),/context/);

 get("state.progress['RAG & Knowledge Retrieval / Semantic search / Embeddings']={status:2,confidence:5};");
 assert.equal(get("topicAfter(__topics[0]).title"),'What is RAG');
 get("state.progress['RAG & Knowledge Retrieval / Fundamentals / What is RAG']={status:2,confidence:5};");
 assert.equal(get("topicAfter(__topics[0]).title"),'Embeddings');
 assert.equal(modelCalls,0);
 console.log('Adaptive flow passed: guidance, skip, reviews, follow-ups, level 3, no paid AI calls');
})().catch(error=>{console.error(error);process.exitCode=1});