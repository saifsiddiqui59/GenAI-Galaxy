// P38: simulate logout/account switches while a model call is pending, without network.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'app.js'),'utf8').replace(/\nstart\(\);\s*$/,'\n')
 // Simulate authorized PRO release only for mock identity-race checks.
 .replace('const PRO_COST_FEATURES_ENABLED=false;', 'const PRO_COST_FEATURES_ENABLED=true;');
const topic={title:'KV cache',branch:'LLM & Transformer Fundamentals',group:'Inference & latency',
 summary:'KV cache stores attention keys and values.',question:'Explain KV cache.'};
const field={value:'KV cache stores prior attention keys and values to avoid recomputing previous tokens and reduce decoding latency.'};
const button={disabled:false,textContent:''};
const ids={'spoken-answer':field,'evaluate-btn':button};
const cx=vm.createContext({console,window:{GALAXY_EVALUATOR_URL:'https://fake.example/api/eval'},
 document:{getElementById:id=>ids[id]||null},
 localStorage:{getItem:()=>null,setItem(){}},matchMedia:()=>({matches:false}),
 setTimeout,clearTimeout,AbortController:globalThis.AbortController,Date,Math,JSON,performance:{now:()=>0},
 URL:globalThis.URL,location:{},navigator:{},addEventListener:()=>{},requestAnimationFrame:()=>0});
vm.runInContext(src,cx,{filename:'app.js'});
let saved=0,attempts=0,renders=0,notices=0,calls=0;
cx.__topic=topic;
cx.__lessons=JSON.parse(fs.readFileSync(path.join(ROOT,'data/lessons.json'),'utf8'));
vm.runInContext(`state.current=__topic;state.attemptQuestion=__topic.question;state.lessons=__lessons;
 saveProgress=async()=>{saved++;return true};storeAttempt=async()=>{attempts++};
 stopVoice=()=>{};render=()=>{renders++};notify=()=>{notices++};setEntryVisible=()=>{};`,Object.assign(cx,{saved,attempts,renders,notices}));
const x=cmd=>vm.runInContext(cmd,cx);
const user=id=>({id,email:'fixture@example.com'});
const A=user('00000000-0000-4000-8000-000000000001'),B=user('00000000-0000-4000-8000-000000000002');
const result={review_status:'model_reviewed',accuracy:91,clarity:91,has_factual_errors:false,missing_concepts:[],
 feedback:'Clear explanation',improved_answer:'A correct example',followup:'How would you bound cache memory?'};
async function tick(){await new Promise(resolve=>setImmediate(resolve));}
function signin(u,auth){cx.__u=u;cx.__auth=auth;x('state.user=__u;state.isGuest=false;state.client={auth:__auth};state.pendingEvaluation=null;state.progress={};state.attempts=[];state.feedback=null;state.planInfo={plan_code:'PRO',status:'ACTIVE',allowed:true,daily_eval_limit:20};');}
async function run(){
 // Session request resolves after a logout: must never call the expensive endpoint.
 let resolveSession;
 signin(A,{getSession:()=>new Promise(resolve=>{resolveSession=resolve})});
 cx.fetch=async()=>{calls++;return {ok:true,json:async()=>result}};
 const pending1=x('submitAnswer({preventDefault(){}})');await tick();
 x('resetAuthToGuest()');
 resolveSession({data:{session:{access_token:'old-token'}}});
 await pending1;
 assert.equal(calls,0,'logout before authorization must prevent any request');
 assert.equal(x('state.feedback'),null);
 assert.equal(x('state.pendingEvaluation'),null);

 // A model response returning after user B signs in must not write or display A's answer.
 let resolveFetch;
 signin(A,{getSession:async()=>({data:{session:{access_token:'old-token'}}})});
 cx.fetch=async()=>{calls++;return new Promise(resolve=>{resolveFetch=resolve})};
 const pending2=x('submitAnswer({preventDefault(){}})');await tick();await tick();
 assert.equal(calls,1);
 const duplicate=x('submitAnswer({preventDefault(){}})');await duplicate;
 assert.equal(calls,1,'double click must not reserve extra model quota');
 x('resetAuthToGuest()');
 signin(B,{getSession:async()=>({data:{session:{access_token:'new-token'}}})});
 resolveFetch({ok:true,status:200,json:async()=>result});
 await pending2;
 assert.equal(x('attempts'),0,'old answer cannot be saved under newly signed-in identity');
 assert.equal(x('saved'),0,'old progress cannot be committed after identity change');
 assert.equal(x('state.feedback'),null);
 assert.equal(x('state.pendingEvaluation'),null);
 assert.equal(x('state.user.id'),B.id);

 // A valid current-session response still works unchanged.
 cx.fetch=async()=>{calls++;return {ok:true,status:200,json:async()=>result}};
 await x('submitAnswer({preventDefault(){}})');
 assert.equal(x('attempts'),1);
 assert.equal(x('saved'),1);
 assert.equal(x('state.feedback.serverReviewed'),true);
 assert.equal(x('state.pendingEvaluation'),null);
 console.log('P38 identity-race, duplicate-request and valid-evaluation tests passed offline.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
