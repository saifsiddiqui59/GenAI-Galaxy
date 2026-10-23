/* Galaxy P28 · no audio is saved. Timing derives only from browser speech events. */
(function(root){
 'use strict';
 const filler=new Set(['um','uh','basically','actually','like']);
 const words=s=>String(s||'').toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g)||[];
 function fromTranscript(text,{elapsedMs=null,voiceEvents=[]}={}){
  const all=words(text),count=all.length;
  let fillerCount=0,repetitions=0;
  all.forEach((w,i)=>{if(filler.has(w))fillerCount++;if(i&&w.length>2&&w===all[i-1])repetitions++});
  const events=(Array.isArray(voiceEvents)?voiceEvents:[]).filter(e=>e&&Number.isFinite(e.time)&&['speechstart','speechend'].includes(e.type)).sort((a,b)=>a.time-b.time);
  let speechMs=0,waiting=null,pauses=0;
  events.forEach(e=>{if(e.type==='speechstart'){if(waiting!==null&&e.time>waiting)pauses++;waiting=null}
   else if(e.type==='speechend')waiting=e.time});
  const duration=Number.isFinite(elapsedMs)&&elapsedMs>0?Math.min(elapsedMs,3600000):null;
  const wpm=duration&&count?Math.round(count*60000/duration):null;
  return {wordCount:count,fillerCount,immediateRepetitions:repetitions,elapsedSeconds:duration?Math.round(duration/1000):null,estimatedWordsPerMinute:wpm,
   detectedPauseBoundaries:events.length>=2?pauses:null,
   method:duration?'Browser session timing and editable transcript':'Text-only transcript analysis',
   limitations:'Not a measured articulation/pronunciation score; STT may omit filler words, session idle time affects WPM, and browser speech boundaries may be unavailable.',
   consentRequiredForMicrophone:true,storesAudio:false};
 }
 function createSession(now=Date.now()){
  const start=Number(now),events=[];
  return {recordSpeechEvent:(type,time=Date.now())=>{if(['speechstart','speechend'].includes(type)&&Number.isFinite(time))events.push({type,time})},
   finish:(transcript,end=Date.now())=>fromTranscript(transcript,{elapsedMs:Math.max(0,end-start),voiceEvents:events})};
 }
 const api=Object.freeze({fromTranscript,createSession});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxySpeakingMetrics=api;
})(typeof window!=='undefined'?window:globalThis);
