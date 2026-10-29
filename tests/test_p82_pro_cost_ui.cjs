"use strict";
// No internet or model calls: PRO cost locks must be visibly disabled.
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"app.js"),"utf8").replace(/\nstart\(\);\s*$/,"\n");
const styles=fs.readFileSync(path.join(root,"styles.css"),"utf8");
assert.ok(source.includes("const PRO_COST_FEATURES_ENABLED=false;"));
const ctx=vm.createContext({
  window:{GALAXY_EVALUATOR_URL:"https://approved.example/api/practice/evaluate",
    GALAXY_VAULT_EXTRACT_URL:"https://approved.example/api/vault/extract",
    GALAXY_SPEECH_BROKER_URL:"https://approved.example/api/speech/token"},
  console,document:{getElementById:()=>null},localStorage:{},
  matchMedia:()=>({matches:false}),setTimeout,clearTimeout,AbortController,
  Date,Math,JSON,URL,performance:{now:()=>0},requestAnimationFrame:()=>0,
  location:{},navigator:{},addEventListener:()=>{}
});
vm.runInContext(source,ctx,{filename:"app.js"});
const lessons=JSON.parse(fs.readFileSync(path.join(root,"data/lessons.json"),"utf8"));
ctx.__lessons=lessons;
ctx.__topic={title:Object.keys(lessons)[0],branch:"LLM Fundamentals",group:"Basics",
  summary:"Explain artificial intelligence with examples",question:"Explain AI."};
vm.runInContext("state.lessons=__lessons;state.current=__topic;state.topics=[__topic];state.attemptQuestion='Explain AI';",ctx);
async function run(){
 let networkCalls=0;
 ctx.fetch=()=>{networkCalls++;throw Error("PRO features must not access network")};
 ctx.__client={auth:{getSession:async()=>({data:{session:{access_token:"fixture-token"}}})}};
 ctx.__user={id:"00000000-0000-4000-8000-000000000001",email:"learner@example.com"};
 for(const tier of ["FREE","PLUS","PRO"]){
   ctx.__plan={plan_code:tier,status:"ACTIVE",allowed:true,daily_eval_limit:tier==="FREE"?5:tier==="PLUS"?10:20};
   vm.runInContext("state.isGuest=false;state.user=__user;state.client=__client;state.planInfo=__plan;",ctx);
   assert.equal(vm.runInContext("modelAvailability().ready",ctx),false);
   const html=vm.runInContext("practiceMarkup()",ctx);
   assert.match(html,/galaxy-pro-badge/);
   assert.match(html,/id="tutor-explain"[^>]*disabled/);
   assert.match(html,/id="tutor-followup"[^>]*disabled/);
   assert.match(html,/id="pro-evaluate"[^>]*disabled/);
   assert.match(html,/Check concepts locally \(free\)/);
   assert.match(html,/data-pro-plans/);
   const plan=vm.runInContext("plansMarkup()",ctx);
   for(const label of ["AI answer evaluation","Azure Speech transcription",
      "Server PDF/DOCX extraction","AI contextual tutor"]){
     assert.ok(plan.includes(label),label);
   }
   assert.ok(!plan.includes("checkout"),"No checkout links");
   await vm.runInContext("askAiTutor('explain')",ctx);
   assert.equal(networkCalls,0,"Tutor cannot call a model on "+tier);
 }
 assert.ok(styles.includes(".galaxy-pro-badge"));
 assert.ok(styles.includes(".pro-locked-button[disabled]"));
 assert.equal(networkCalls,0);
 console.log("P82 paid PRO badges and OFF state: FREE/PLUS/PRO no-network PASS");
}
run().catch(e=>{console.error(e);process.exitCode=1});
