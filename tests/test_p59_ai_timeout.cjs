"use strict";
// P59 zero-network async browser fetch contract: one attempt, bounded timeout.
const fs=require("node:fs"),path=require("node:path"),
      vm=require("node:vm"),assert=require("node:assert/strict");
const source=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const start=source.indexOf("const AI_RESPONSE_TIMEOUT_MS=30000;");
const end=source.indexOf("// The deployed runtime-config.js",start);
assert.ok(start>0 && end>start);
const helper=source.slice(start,end);
const ctx={AbortController,setTimeout,clearTimeout,fetch:null};
vm.runInNewContext(helper+"\nthis.callAi=aiJsonOnce;",ctx);
async function run(){
 let n=0;
 ctx.fetch=(_url,{signal})=>{n++;return new Promise((_resolve,reject)=>{
   signal.addEventListener("abort",()=>{
     const e=new Error("Aborted");e.name="AbortError";reject(e);
   },{once:true});
 });};
 const abort=await ctx.callAi("https://approved.example/api/practice/evaluate",{method:"POST"},8)
     .then(()=>null,e=>e);
 assert.equal(abort?.message,"AI_TIMEOUT");
 assert.equal(n,1,"Never auto-retry paid request after timeout");
 n=0;
 ctx.fetch=(_url,{signal})=>{n++;return Promise.resolve({ok:true,json:()=>new Promise((_r,reject)=>{
   signal.addEventListener("abort",()=>{const e=new Error("Aborted");e.name="AbortError";reject(e);},{once:true});
 })});};
 const bodyTimeout=await ctx.callAi("https://approved.example/api/practice/tutor",{method:"POST"},8)
     .then(()=>null,e=>e);
 assert.equal(bodyTimeout?.message,"AI_TIMEOUT","Response body decoding must also be bounded");
 assert.equal(n,1);
 n=0;
 ctx.fetch=()=>{n++;return Promise.resolve({ok:false,status:429});};
 const quota=await ctx.callAi("https://approved.example/api/practice/evaluate",{method:"POST"},8)
     .then(()=>null,e=>e);
 assert.equal(quota?.message,"HTTP_429");
 assert.equal(n,1);
 assert.equal((source.match(/aiJsonOnce\(window.GALAXY_EVALUATOR_URL,/g)||[]).length,1);
 assert.equal((source.match(/aiJsonOnce\(url,\{/g)||[]).length,1);
 assert.match(source,/AI review timed out after 30 seconds/);
 assert.match(source,/Tutor timed out after 30 seconds/);
 assert.match(source,/Do not retry immediately/);
 console.log("P59 mocked AI timeouts: abort, body timeout, quota, no paid retries PASS");
}
run().catch(e=>{console.error(e);process.exitCode=1});
