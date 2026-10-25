"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const js=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"..","styles.css"),"utf8");
const lesson=js.slice(js.indexOf("function lessonMarkup()"),js.indexOf("function startPractice()"));
const practice=js.slice(js.indexOf("function practiceMarkup()"),js.indexOf("// Deterministic transparent proxy"));
for(const id of ["practice-this","practice-this-side","lesson-teach","lesson-next","topic-note","save-note"]){
 assert.equal(lesson.split('id="'+id+'"').length-1,1,"Must retain "+id);
}
for(const phrase of ["lesson-workspace","lesson-reading-meta","lesson-content-card","lesson-more","lesson-more-content","sections.map","i===7","escapeHtml(value)"]){
 assert.ok(lesson.includes(phrase),"Missing lesson: "+phrase);
}
assert.ok(lesson.includes("if(i===3)"),"First three essentials visible; remaining five grouped");
for(const text of ["Simple explanation","Technical explanation","Real-world example","Common mistakes","Follow-up questions"]){
 assert.ok(lesson.includes(text));
}
assert.ok(css.includes("@media(max-width:660px)")&&css.includes(".lesson-workspace .lesson-content-card"));
assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"),"Honor reduced motion");
for(const id of ["tutor-live-status","evaluation-live-status"]){
 assert.ok(practice.includes('id="'+id+'"'),"Accessible AI status exists: "+id);
}
assert.ok(js.includes("Connecting securely to AI"));
assert.ok(js.includes("Finding the best answer"));
assert.ok(js.includes("Still waiting for the AI service"));
assert.ok(!js.includes("stream:true")&&!js.includes("stream: true"),"No unfunded provider stream or hidden retries");
const start=js.indexOf("const AI_RESPONSE_TIMEOUT_MS=90000;");
const end=js.indexOf("// The deployed runtime-config.js",start);
const stages=[];
const el={hidden:true,dataset:{},textContent:""};
const ctx={AbortController,setTimeout,clearTimeout,fetch:async (_url,{signal})=>{
 assert.equal(signal.aborted,false);return {ok:true,json:async()=>({tutor_status:"reference_only",reply:"Grounded answer"})};
},DOM:id=>id==="test-status"?el:null};
vm.runInNewContext(js.slice(start,end)+"\nthis.callAi=aiJsonOnce;this.display=showAiStage;",ctx);
async function main(){
 const result=await ctx.callAi("https://example.com/api/practice/tutor",{method:"POST"},500,phase=>stages.push(phase));
 assert.equal(result.reply,"Grounded answer");
 assert.deepEqual(stages,["connecting","receiving"]);
 ctx.display("test-status","connecting");
 assert.equal(el.hidden,false);assert.equal(el.dataset.phase,"connecting");
 assert.match(el.textContent,/Connecting/);
 ctx.display("test-status","preparing");
 assert.match(el.textContent,/Finding the best answer/);
 console.log("P74 mobile lesson, honest phased AI wait, one-shot response contract PASS");
}
main().catch(e=>{console.error(e);process.exitCode=1});
