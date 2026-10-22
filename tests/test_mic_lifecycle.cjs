'use strict';
// Simulated browser speech only. No real microphone or Azure/Supabase traffic.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8').replace(/\nstart\(\);\s*$/,'\n');
const elements=new Map(),recognizers=[],messages=[];
function element(id){
 if(!elements.has(id)){
  const c=new Set();
  elements.set(id,{value:'',textContent:'',setAttribute(k,v){this[k]=v},
    classList:{add:k=>c.add(k),remove:k=>c.delete(k),toggle:(k,on)=>on?c.add(k):c.delete(k),contains:k=>c.has(k)}});
 }
 return elements.get(id);
}
class FakeSpeech{
 constructor(){recognizers.push(this)}
 start(){this.started=true}
 stop(){this.stopped=true;this.onend?.()}
}
const ctx=vm.createContext({console,window:{SpeechRecognition:FakeSpeech},
 document:{getElementById:element},matchMedia:()=>({matches:false}),
 localStorage:{getItem:()=>null,setItem(){}},Date,Math,JSON,URL,
 setTimeout,clearTimeout,requestAnimationFrame:()=>0,performance:{now:()=>0},
 navigator:{},location:{},addEventListener(){}});
vm.runInContext(app,ctx);ctx.messages=messages;
vm.runInContext('state.view="practice";notify=x=>messages.push(x);render=()=>{}',ctx);
const read=expr=>vm.runInContext(expr,ctx);
function interim(target,text,isFinal=true){
 const result=[{transcript:text}];result.isFinal=isFinal;
 target.onresult({results:[result]});
}
(async()=>{
 element('spoken-answer').value='Existing';
 await read('toggleVoice()');
 assert.equal(read('state.recording'),true);
 assert.equal(recognizers.length,1);
 assert.equal(element('mic-control')['aria-pressed'],'true');
 interim(recognizers[0],'first transcript');
 assert.equal(element('spoken-answer').value,'Existing first transcript');
 await read('toggleVoice()');
 assert.equal(recognizers[0].stopped,true);
 assert.equal(read('state.recording'),false);
 interim(recognizers[0],'late text');
 assert.equal(element('spoken-answer').value,'Existing first transcript','late recognition must be ignored');
 await read('toggleVoice()');
 assert.equal(recognizers.length,2);
 const stale=recognizers[0];stale.onend();
 assert.equal(read('state.recording'),true,'old recognizer must not end new session');
 interim(recognizers[1],'second transcript');
 recognizers[1].onerror({error:'not-allowed'});
 assert.equal(read('state.recording'),false);
 assert.equal(element('spoken-answer').value,'Existing first transcript second transcript','mic failure keeps draft');
 assert.ok(messages.some(m=>m.includes('not-allowed')));
 await read('toggleVoice()');
 assert.equal(recognizers.length,3);
 read('resetAuthToGuest()');
 assert.equal(read('state.recording'),false);
 assert.equal(recognizers[2].stopped,true);
 // Permission denied at start must fail closed and preserve the user's typed answer.
 const before=element('spoken-answer').value;
 const originalStart=FakeSpeech.prototype.start;
 FakeSpeech.prototype.start=function(){throw Error('permission denied')};
 await read('toggleVoice()');
 assert.equal(read('state.recording'),false);
 assert.equal(read('state.voicePending'),false);
 assert.equal(read('state.voice'),null);
 assert.equal(element('spoken-answer').value,before,'failed start must preserve editable text');
 assert.ok(messages.some(m=>m.includes('Microphone could not start')));
 FakeSpeech.prototype.start=originalStart;
 // Reconnect after denial: stale callbacks from the unsuccessful instance cannot mutate draft.
 await read('toggleVoice()');
 const current=recognizers.at(-1),abandoned=recognizers.at(-2);
 assert.equal(read('state.recording'),true);
 interim(abandoned,'abandoned transcript');
 assert.equal(element('spoken-answer').value,before);
 interim(current,'valid after retry');
 assert.match(element('spoken-answer').value,/valid after retry/);
 read('stopVoice()');
 assert.equal(read('state.recording'),false);
 assert.equal(element('mic-control')['aria-pressed'],'true','button updates only on render');
 read('renderVoiceState()');
 assert.equal(element('mic-control')['aria-pressed'],'false');
 console.log('Speech lifecycle: stop, stale results, errors and sign-out, permission denial, and retry guards PASS');
})().catch(err=>{console.error(err);process.exitCode=1});
