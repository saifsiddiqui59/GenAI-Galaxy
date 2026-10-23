'use strict';
// Browser-independent regression coverage: no real Supabase credentials, users or data.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8').replace(/\nstart\(\);\s*$/,'\n');
function harness(records={},options={}){
 const calls=[],notices=[],guides=[],dismissals=[],data=structuredClone(records),pending=options.pending||{};
 const client={
  from(table){
   const filters={};const call={table,filters};calls.push(call);
   const builder={
    select(){return this},
    eq(k,v){filters[k]=v;return this},
    order(){return this},
    limit(){
     if(pending[table])return pending[table]();
     const rows=(data[table]||[]).filter(row=>options.ignoreFilters||Object.entries(filters).every(([k,v])=>row[k]===v));
     return Promise.resolve({data:rows,error:null});
    }
   };
   return builder;
  }
 };
 const store=new Map();
 const ctx=vm.createContext({console,window:{GalaxyGenieGuide:{show:d=>guides.push(d),dismiss:()=>dismissals.push(true)}},matchMedia:()=>({matches:false}),
  document:{getElementById:()=>({classList:{add(){},remove(){}},textContent:''})},
  localStorage:{getItem:key=>store.get(key)||null,setItem:(k,v)=>store.set(k,v)},
  setTimeout,clearTimeout,Date,Math,JSON,URL,performance:{now:()=>0},
  requestAnimationFrame:()=>0,location:{},navigator:{},addEventListener:()=>{}});
 vm.runInContext(source,ctx,{filename:'app.js'});
 ctx.__client=client;ctx.__notices=notices;
 vm.runInContext('state.client=__client; render=()=>{}; authClose=()=>{}; notify=s=>__notices.push(s)',ctx);
 return {ctx,calls,notices,guides,dismissals,state:vm.runInContext('state',ctx),
  signIn:user=>{ctx.__user=user;return vm.runInContext('signedIn(__user)',ctx)},
  signOut:()=>vm.runInContext('resetAuthToGuest()',ctx)};
}
function doc(user,id){return {id,user_id:user,file_path:user+'/'+id,title:'Private notes',body:''}}
async function run(){
 const key='RAG / Retrieval / Chunking';
 const records={
  genai_study_progress:[
   {user_id:'alice',topic_key:key,status:1,confidence:2},
   {user_id:'bob',topic_key:key,status:2,confidence:5}],
  genai_study_attempts:[
   {user_id:'alice',topic_key:key,response:'Alice private answer'},
   {user_id:'bob',topic_key:key,response:'Bob private answer'}],
  genai_study_documents:[doc('alice','doc-a'),doc('bob','doc-b')]
 };
 const h=harness(records);
 await h.signIn({id:'alice',email:'a@test.invalid'});
 assert.equal(h.state.user.id,'alice');
 assert.equal(h.state.progress[key].status,1);
 assert.equal(h.state.attempts.length,1);
 assert.equal(h.state.documents.length,1);
 assert.equal(h.state.documents[0].id,'doc-a');
 assert.equal(h.calls.length,3);
 assert.ok(h.calls.every(call=>call.filters.user_id==='alice'));
 await h.signIn({id:'bob',email:'b@test.invalid'});
 assert.equal(h.state.user.id,'bob');
 assert.equal(h.state.progress[key].status,2);
 assert.equal(h.state.attempts[0].response,'Bob private answer');
 assert.equal(h.state.documents[0].id,'doc-b');
 assert.equal(h.calls.length,6);
 assert.ok(h.calls.slice(3).every(call=>call.filters.user_id==='bob'));
 h.signOut();
 assert.equal(h.state.user,null);
 assert.equal(h.state.isGuest,true);
 assert.equal(h.state.documents.length,0);
 assert.equal(h.state.attempts.length,0);
 assert.equal(Object.keys(h.state.progress).length,0);
 // Even a compromised/misconfigured query cannot render records owned by someone else.
 const invalid=harness(records,{ignoreFilters:true});
 await invalid.signIn({id:'alice'});
 assert.equal(invalid.state.isGuest,true);
 assert.equal(invalid.state.documents.length,0);
 assert.ok(invalid.notices.some(n=>n.includes('Unexpected data ownership')));
 // A slow cloud response must not resurrect user data after SIGNED_OUT.
 let resolve;
 const race=harness(records,{pending:{genai_study_progress:()=>new Promise(r=>{resolve=r})}});
 const old=race.signIn({id:'alice'});
 await Promise.resolve();
 assert.equal(typeof resolve,'function');
 race.signOut();
 resolve({data:[records.genai_study_progress[0]],error:null});
 await old;
 assert.equal(race.state.isGuest,true);
 assert.equal(race.state.user,null);
 assert.equal(race.state.documents.length,0);
 assert.equal(race.calls.length,1);
 // A genie welcome is shown only after successful, owner-scoped cloud sync.
 // Full mastery is required for a whole planet to enter the sack.
 const worldA={branchIndex:0,branch:'RAG',group:'Retrieval',title:'Chunking'};
 const worldB={branchIndex:1,branch:'LangGraph',group:'Orchestration',title:'Nodes'};
 const progressKey='RAG / Retrieval / Chunking';
 const ready=harness({genai_study_progress:[
  {user_id:'alice',topic_key:progressKey,status:2,confidence:5}
 ]});
 ready.state.subjects=[{title:'RAG'},{title:'LangGraph'}];
 ready.state.topics=[worldA,worldB];
 await ready.signIn({id:'alice',email:'a@test.invalid'});
 assert.equal(ready.guides.length,1);
 assert.equal(ready.guides[0].masteredWorlds.length,1);
 assert.equal(ready.guides[0].masteredWorlds[0].name,'RAG');
 assert.equal(ready.guides[0].next.title,'LangGraph');
 assert.equal(typeof ready.guides[0].onContinue,'function');
 ready.signOut();
 assert.equal(ready.dismissals.length,1);
 // Even when a misconfigured query returns foreign rows, no guide is shown.
 const broken=harness({genai_study_progress:[
  {user_id:'bob',topic_key:progressKey,status:2,confidence:5}
 ]},{ignoreFilters:true});
 broken.state.subjects=[{title:'RAG'},{title:'LangGraph'}];
 broken.state.topics=[worldA,worldB];
 await broken.signIn({id:'alice'});
 assert.equal(broken.guides.length,0);
 console.log('Auth sync: owner scoping, account switch, sign-out race and foreign-row rejection PASS');
}
run().catch(e=>{console.error(e);process.exitCode=1});
