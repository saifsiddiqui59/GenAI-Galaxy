'use strict';
// P77 experimental text/event-stream consumer. Source-only, not included in static site.
// Caller owns a SINGLE already-authenticated fetch and its AbortController.
// Partial deltas are unverified tutor drafts; never display them as model grades.
// Render text through textContent, never innerHTML.

const STREAM_MAX_BYTES=128*1024, STREAM_MAX_TEXT=2500, STREAM_MAX_FRAME=6000;
class GalaxyStreamError extends Error{constructor(msg){super(msg);this.name='GalaxyStreamError';}}

async function consumeGalaxySse(response,handlers={}){
 if(!response?.ok||!response.body?.getReader)throw new GalaxyStreamError('Streaming API unavailable');
 const mime=response.headers?.get?.('content-type')||'';
 if(!/^text\/event-stream(?:\s*;|\s*$)/i.test(mime))throw new GalaxyStreamError('Response is not an event stream');
 const reader=response.body.getReader();
 const decoder=new TextDecoder('utf-8',{fatal:true});
 let buffer='',totalBytes=0,completed=false,answer='',frames=0;
 const accepted=new Set(['status','delta','complete','error']);
 function one(frame){
   if(completed)throw new GalaxyStreamError('Trailing SSE frame after completion');
   frames++;
   if(frames>4000||frame.length>STREAM_MAX_FRAME)throw new GalaxyStreamError('Event stream limit exceeded');
   const lines=frame.split('\n');
   let event=null,data=null;
   for(const line of lines){
     if(line.startsWith(':')||line.trim()==='')continue;
     if(line.startsWith('event:')){
       if(event!==null)throw new GalaxyStreamError('Duplicate SSE event');
       event=line.slice(6).trim();
     }else if(line.startsWith('data:')){
       if(data!==null)throw new GalaxyStreamError('Duplicate SSE data');
       data=line.slice(5).trimStart();
     }else throw new GalaxyStreamError('Unexpected SSE frame');
   }
   if(!event||!accepted.has(event)||data===null)throw new GalaxyStreamError('Invalid SSE event');
   let payload;
   try{payload=JSON.parse(data)}catch(_){throw new GalaxyStreamError('Malformed SSE payload')}
   if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new GalaxyStreamError('Invalid SSE payload');
   if(event==='error')throw new GalaxyStreamError('Model stream ended without a verified completion; do not retry automatically');
   if(event==='status'){
     if(!['generating','receiving','validating'].includes(payload.stage))throw new GalaxyStreamError('Unexpected model phase');
     handlers.onStatus?.(payload.stage);
   }
   if(event==='delta'){
     if(typeof payload.text!=='string'||payload.provisional!==true)throw new GalaxyStreamError('Invalid provisional token');
     answer+=payload.text;
     if(answer.length>STREAM_MAX_TEXT)throw new GalaxyStreamError('Streaming tutor reply too long');
     handlers.onDelta?.(payload.text,answer);
   }
   if(event==='complete'){
     if(payload.completed!==true||payload.kind!=='tutor_draft'||payload.verified!==false||!answer)
       throw new GalaxyStreamError('Incomplete tutor stream');
     completed=true;
     handlers.onComplete?.({reply:answer,usage:payload.usage??null,verified:false});
   }
 }
 try{
   while(true){
     const {value,done}=await reader.read();
     if(done)break;
     totalBytes+=value.byteLength;
     if(totalBytes>STREAM_MAX_BYTES)throw new GalaxyStreamError('Stream exceeded byte limit');
     buffer+=decoder.decode(value,{stream:true});
     buffer=buffer.replace(/\r\n/g,'\n');
     let cut;
     while((cut=buffer.indexOf('\n\n'))>=0){
       one(buffer.slice(0,cut));buffer=buffer.slice(cut+2);
       if(completed&&buffer.trim())throw new GalaxyStreamError('Trailing data after completion');
     }
     if(buffer.length>STREAM_MAX_FRAME)throw new GalaxyStreamError('Unbounded SSE frame');
   }
   buffer+=decoder.decode();
   if(buffer.trim()||!completed)throw new GalaxyStreamError('Stream ended without complete event');
   return {reply:answer,verified:false};
 }finally{try{reader.releaseLock()}catch(_){}}
}
if(typeof module!=='undefined'&&module.exports)module.exports={consumeGalaxySse,GalaxyStreamError};
