import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceTimelineMs} from '../src/journey/clockMath.js';
test('cinematic scene progresses at actual time regardless of FPS',()=>{
 for(const fps of [3,4,12,30,60]){
  const dt=1/fps;let ms=0;
  for(let k=0;k<fps*12;k++)ms=advanceTimelineMs(ms,dt);
  assert(Math.abs(ms-12000)<.001,'timeline slowed at '+fps+'fps: '+ms);
 }
});
test('pause/hidden/not-ready keeps clock still, severe stalls limited',()=>{
 assert.equal(advanceTimelineMs(1200,.3,false,true,false),1200);
 assert.equal(advanceTimelineMs(1200,.3,true,false,false),1200);
 assert.equal(advanceTimelineMs(1200,.3,true,true,true),1200);
 assert.equal(advanceTimelineMs(1200,12,true,true,false),1950);
 assert.equal(advanceTimelineMs(1200,NaN),1200);
});
