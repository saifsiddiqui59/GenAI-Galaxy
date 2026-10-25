'use strict';
const assert=require('node:assert/strict');
const {consumeGalaxySse,GalaxyStreamError}=require('../experimental/ai_streaming/client.js');
const encoder=new TextEncoder();
const event=(type,obj)=>'event: '+type+'\ndata: '+JSON.stringify(obj)+'\n\n';
function fakeResponse(chunks,opts={}){
 let n=0;
 const body=new ReadableStream({pull(ctrl){
   if(n>=chunks.length){ctrl.close();return}
   ctrl.enqueue(encoder.encode(chunks[n++]));}});
 return {ok:opts.ok??true,headers:{get:()=>opts.mime||'text/event-stream; charset=utf-8'},body};
}
async function run(){
 const content=[event('status',{stage:'generating'}),event('delta',{text:'Hello ',provisional:true}),
                event('delta',{text:'🌍',provisional:true}),event('complete',{completed:true,kind:'tutor_draft',
                verified:false,usage:{input_tokens:30,output_tokens:5,total_tokens:35}})].join('');
 // UTF-8 splits are adversarial: split after every byte.
 const bytes=encoder.encode(content);
 const stream=new ReadableStream({start(c){for(const byte of bytes)c.enqueue(Uint8Array.of(byte));c.close();}});
 const events=[],result=await consumeGalaxySse({ok:true,headers:{get:()=> 'text/event-stream'},body:stream},{
   onStatus:v=>events.push(['status',v]),
   onDelta:v=>events.push(['delta',v]),
   onComplete:v=>events.push(['complete',v.reply])
 });
 assert.equal(result.reply,'Hello 🌍');
 assert.equal(result.verified,false,'Provisional tokens are not approved factual grades');
 assert.deepEqual(events,[['status','generating'],['delta','Hello '],['delta','🌍'],['complete','Hello 🌍']]);
 const failed=[
    fakeResponse([event('delta',{text:'partial',provisional:true})]),
    fakeResponse([event('delta',{text:'<img onerror=alert(1)>',provisional:true}),event('error',{retry_safe:false})]),
    fakeResponse([event('status',{stage:'made_up'}),event('complete',{completed:true,verified:false,kind:'tutor_draft'})]),
    fakeResponse([event('delta',{text:'x'.repeat(2501),provisional:true})]),
    fakeResponse([event('delta',{text:'ok',provisional:true}),event('complete',{completed:true,kind:'tutor_draft',verified:true})]),
    fakeResponse([event('delta',{text:'ok',provisional:true}),event('complete',{completed:true,kind:'tutor_draft',verified:false}),event('delta',{text:'late',provisional:true})])
 ];
 for(const response of failed)await assert.rejects(consumeGalaxySse(response),GalaxyStreamError);
 await assert.rejects(consumeGalaxySse(fakeResponse([], {ok:false})),GalaxyStreamError);
 await assert.rejects(consumeGalaxySse(fakeResponse([], {mime:'application/json'})),GalaxyStreamError);
 console.log('P77 real SSE incremental UTF-8 decoding, completion, and failure contract PASS');
}
run().catch(e=>{console.error(e);process.exitCode=1});
