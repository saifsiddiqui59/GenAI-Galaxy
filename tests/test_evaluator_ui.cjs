// Zero-cost simulated UI/API contract checks. No network, accounts or model calls.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(ROOT,'app.js'),'utf8').replace(/\nstart\(\);\s*$/,'\n');
const topic={
 title:'KV cache',branch:'LLM & Transformer Fundamentals',
 group:'Inference & latency',summary:'KV cache saves keys and values.',
 question:'Explain KV cache.'
};
const response='KV caching stores previous attention keys and values to avoid repeating computation during autoregressive decoding. This helps reduce response latency.';
const URL='https://gengalaxy-p3-1429841605.azurewebsites.net/api/practice/evaluate';
const textarea={value:response};
const button={disabled:false,textContent:''};
const ctx=vm.createContext({
 console,window:{},matchMedia:()=>({matches:false}),
 document:{getElementById:id=>({'spoken-answer':textarea,'evaluate-btn':button}[id]||null)},
 localStorage:{},setTimeout,clearTimeout,Date,Math,JSON,URL:globalThis.URL,
 performance:{now:()=>0},requestAnimationFrame:()=>0,location:{},navigator:{},addEventListener:()=>{}
});
vm.runInContext(source,ctx,{filename:'app.js'});
vm.runInContext(`
 saveProgress=async()=>true;storeAttempt=async()=>{};render=()=>{};notify=()=>{};
 state.current=__topic;state.attemptQuestion=__topic.question;
 state.lessons=__lessons;
`,Object.assign(ctx,{__topic:topic,__lessons:JSON.parse(fs.readFileSync(path.join(ROOT,'data/lessons.json'),'utf8'))}));

function reset({signedIn,endpoint=URL,session=true}){
 ctx.window.GALAXY_EVALUATOR_URL=endpoint;
 button.disabled=false;button.textContent='';
 vm.runInContext('state.progress={};state.attempts=[];state.feedback=null;state.tutorResponse=null;state.tutorPending=null;state.tutorDraft="";state.user=null;state.client=null;state.isGuest=true;',ctx);
 if(signedIn){
  ctx.__client={auth:{getSession:async()=>({data:{session:session?{access_token:'mock-user-token'}:null}})}};
  ctx.__user={id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.com'};
  vm.runInContext('state.user=__user;state.client=__client;state.isGuest=false;',ctx);
 }
}
function feedback(){return vm.runInContext('state.feedback',ctx)}
async function submit(local=false){
 await vm.runInContext(local?
   'submitAnswer({preventDefault(){}},true)':
   'submitAnswer({preventDefault(){}})',ctx);
}
async function run(){
 let calls=0;
 ctx.fetch=async()=>{calls++;throw Error('fetch called in guest mode')};
 reset({signedIn:false});
 assert.equal(vm.runInContext('modelAvailability().ready',ctx),false);
 assert.match(vm.runInContext('practiceMarkup()',ctx),/Sign in for AI evaluation/);
 await submit();
 assert.equal(calls,0);
 assert.equal(feedback().serverReviewed,false);
 assert.match(feedback().localReason,/Guest mode/);

 reset({signedIn:true});
 assert.match(vm.runInContext('practiceMarkup()',ctx),/Evaluate with AI \(uses model tokens\)/);
 assert.match(vm.runInContext('practiceMarkup()',ctx),/Local check \(free\)/);
 ctx.fetch=async (url,options)=>{
  calls++;
  assert.equal(url,URL);
  assert.equal(options.headers.Authorization,'Bearer mock-user-token');
  return {ok:true,status:200,json:async()=>({
   review_status:'model_reviewed',accuracy:88,clarity:82,
   has_factual_errors:false,missing_concepts:[],feedback:'Good explanation',
   improved_answer:'Reference answer',followup:'Next question'
  })};
 };
 const beforeSuccess=calls;await submit();
 assert.equal(calls,beforeSuccess+1);
 assert.equal(feedback().serverReviewed,true);
 assert.equal(feedback().score,88);
 assert.equal(feedback().localReason,undefined);

 // New server-computed evidence grading contract also works on the existing UI.
 reset({signedIn:true});
 ctx.fetch=async()=>{calls++;return {ok:true,status:200,json:async()=>({
  review_status:'model_reviewed',accuracy:63,clarity:75,
  has_factual_errors:true,missing_concepts:['Explain why chat generation is not nearest-neighbor search'],
  incorrect_claims:['A chat completion is a vector index'],
  correct_points:['Vectors encode similarity'],
  why_score:'The answer defines embeddings but does not resolve the comparison.',
  score_breakdown:{direct_answer:{score:1,max:4,weight:35,
   reason:'Did not answer why',evidence:'embedding'}},
  feedback:'Needs direct comparison',improved_answer:'Use embeddings to retrieve vectors; use chat generation to compose responses.',
  followup:'How does cosine similarity differ from a chat completion?',
  token_usage:{input_tokens:1000,output_tokens:500,total_tokens:1500},
  estimated_model_cost:{currency:'INR',model_cost_estimate_inr:'0.15000000'}
 })};};
 await submit();
 assert.equal(feedback().score,63);
 assert.equal(feedback().passed,false);
 assert.equal(feedback().correctPoints.length,1);
 assert.equal(feedback().incorrectClaims.length,1);
 const structuredHtml=vm.runInContext('practiceMarkup()',ctx);
 assert.match(structuredHtml,/What you answered correctly/);
 assert.match(structuredHtml,/Incorrect technical claims/);
 assert.match(structuredHtml,/Why this score/);
 assert.match(structuredHtml,/View weighted score breakdown/);
 assert.match(structuredHtml,/Next interview question/);
 assert.match(structuredHtml,/Measured tokens/);
 assert.match(structuredHtml,/Estimated model-token cost/);
 assert.match(structuredHtml,/Not Azure billed cost/);
 assert.match(structuredHtml,/0\.15000000/);


 reset({signedIn:true});
 const route=vm.runInContext('tutorEndpoint()',ctx);
 assert.equal(route,'https://gengalaxy-p3-1429841605.azurewebsites.net/api/practice/tutor');
 assert.match(vm.runInContext('practiceMarkup()',ctx),/Ask AI tutor \(uses tokens\)/);
 assert.match(vm.runInContext('practiceMarkup()',ctx),/Read reference \(free\)/);
 // Authenticated tutor click is explicit and uses one request, unlike a local check.
 reset({signedIn:true});
 ctx.fetch=async (url,options)=>{
  calls++;
  assert.equal(url,route);
  assert.equal(options.headers.Authorization,'Bearer mock-user-token');
  assert.equal(JSON.parse(options.body).mode,'explain');
  return {ok:true,status:200,json:async()=>({
   tutor_status:'model_tutored',mode:'explain',model_called:true,
   reply:'A short explanation of embeddings.',
   next_question:'How is vector similarity calculated?',
   token_usage:{input_tokens:1000,output_tokens:500,total_tokens:1500},
   estimated_model_cost:{currency:'INR',model_cost_estimate_inr:'0.15000000'}})};
 };
 const tutorBefore=calls;
 vm.runInContext("state.view='practice'",ctx);
 await vm.runInContext("askAiTutor('explain')",ctx);
 assert.equal(calls,tutorBefore+1);
 assert.match(vm.runInContext('practiceMarkup()',ctx),/A short explanation of embeddings/);
 assert.match(vm.runInContext('practiceMarkup()',ctx),/Measured tokens/);
 assert.match(vm.runInContext('practiceMarkup()',ctx),/Estimated model-token cost/);
 assert.match(vm.runInContext('practiceMarkup()',ctx),/Ask the AI tutor \(optional\)/);
 assert.match(vm.runInContext('practiceMarkup()',ctx),/Get AI follow-up \(uses tokens\)/);
 ctx.__capturedMode=null;ctx.__capturedMessage=null;
 ctx.fetch=async (_url,options)=>{
  const body=JSON.parse(options.body);
  ctx.__capturedMode=body.mode;ctx.__capturedMessage=body.message;
  return {ok:true,status:200,json:async()=>({
   tutor_status:'model_tutored',mode:body.mode,model_called:true,
   reply:'Advanced explanation for the current question.',
   next_question:'What is approximate nearest-neighbor indexing?'})};
 };
 vm.runInContext("state.tutorDraft='How do embeddings differ from tokens?'",ctx);
 await vm.runInContext("askAiTutor('followup')",ctx);
 assert.equal(ctx.__capturedMode,'followup');
 assert.equal(ctx.__capturedMessage,'How do embeddings differ from tokens?');

 reset({signedIn:false});
 ctx.fetch=async()=>{throw Error('Guest triggered a paid request')};
 await vm.runInContext("askAiTutor('explain')",ctx);
 assert.equal(vm.runInContext('state.tutorResponse',ctx),null);

 const beforeLocal=calls;await submit(true);
 assert.equal(calls,beforeLocal,'Explicit free mode must not call model');
 assert.match(feedback().localReason,/free local check/);
 assert.equal(feedback().serverReviewed,false);

 reset({signedIn:true});
 ctx.fetch=async()=>{calls++;return {ok:false,status:429}};
 await submit();
 assert.equal(feedback().serverReviewed,false);
 assert.match(feedback().localReason,/Daily AI evaluation limit reached/);
 assert.equal(feedback().passed,false);

 reset({signedIn:true});
 ctx.fetch=async()=>{calls++;return {ok:false,status:503}};
 await submit();
 assert.match(feedback().localReason,/temporarily unavailable/);

 reset({signedIn:true,session:false});
 const beforeSession=calls;await submit();
 assert.equal(calls,beforeSession,'Expired session should not send model request');
 assert.match(feedback().localReason,/Session expired/);

 reset({signedIn:true});
 ctx.fetch=async()=>{calls++;return {ok:true,json:async()=>({
  review_status:'model_reviewed',accuracy:'95',clarity:88,
  has_factual_errors:false,missing_concepts:[]
 })}};
 await submit();
 assert.match(feedback().localReason,/invalid response/);
 assert.equal(feedback().serverReviewed,false);

 reset({signedIn:true,endpoint:''});
 const beforeMissing=calls;await submit();
 assert.equal(calls,beforeMissing);
 assert.match(feedback().localReason,/not configured/);

 const score=vm.runInContext('modelFailureMessage(401)',ctx);
 assert.match(score,/Sign in again/);
 console.log('Zero-cost evaluator mode and fallback tests passed');
}
run().catch(err=>{console.error(err);process.exitCode=1});
