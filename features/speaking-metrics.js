/* P35 P2: browser-only speaking intervals; no recordings or timed audio sent off device. */
(function(root){
 'use strict';
 const filler=new Set(['um','uh','basically','actually','like']);
 const words=s=>String(s||'').toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g)||[];
 function fromTranscript(text,{elapsedMs=null,voiceEvents=[]}={}){
  const all=words(text),count=all.length;
  let fillerCount=0,repetitions=0;
  all.forEach((w,i)=>{if(filler.has(w))fillerCount++;if(i&&w.length>2&&w===all[i-1])repetitions++});
  const events=(Array.isArray(voiceEvents)?voiceEvents:[])
   .filter(e=>e&&Number.isFinite(e.time)&&e.time>=0&&['speechstart','speechend'].includes(e.type))
   .sort((a,b)=>a.time-b.time).slice(0,500);
  let active=null,spokenMs=0,lastEnd=null,pauses=0,pauseMs=0,segments=0;
  for(const e of events){
   if(e.type==='speechstart'&&active===null){
    if(lastEnd!==null&&e.time>lastEnd+300){pauses++;pauseMs+=Math.min(60000,e.time-lastEnd)}
    active=e.time;
   }else if(e.type==='speechend'&&active!==null&&e.time>active){
    spokenMs+=Math.min(60000,e.time-active);segments++;active=null;lastEnd=e.time;
   }
  }
  const duration=Number.isFinite(elapsedMs)&&elapsedMs>0?Math.min(elapsedMs,3600000):null;
  // Only real timed speech segments qualify as a measured vocal-activity estimate.
  const timed=segments>0&&spokenMs>0&&count>0;
  return {wordCount:count,fillerCount,immediateRepetitions:repetitions,elapsedSeconds:duration?Math.round(duration/1000):null,
   estimatedWordsPerMinute:timed?Math.round(count*60000/spokenMs):duration&&count?Math.round(count*60000/duration):null,
   paceBasis:timed?'browser speech intervals':duration?'session duration including silence and editing':'none',
   detectedPauseBoundaries:timed?pauses:null,detectedPauseMs:timed?pauseMs:null,
   speechActivitySeconds:timed?Math.round(spokenMs/1000):null,
   method:timed?'Browser speech events and editable transcript':duration?'Session timing and editable transcript':'Text-only transcript analysis',
   limitations:'Speech timing is approximate, transcript recognition may omit fillers; these are not pronunciation, fluency or factual accuracy scores.',
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
