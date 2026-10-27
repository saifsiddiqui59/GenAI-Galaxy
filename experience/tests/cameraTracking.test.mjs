import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraTrackingAt} from '../src/space/cameraTracking.js';
import {COLLECT_START_MS,PER_WORLD_MS,OFFER_SETTLE_MS} from '../src/journey/choreography.js';

const BASE={x:0,y:.3,z:12.5};
test('full galaxy stays in fixed cinematic viewport throughout orbit pickup',()=>{
 for(const completed of [0,1,3,17]){
  for(const ms of [0,950,COLLECT_START_MS,COLLECT_START_MS+PER_WORLD_MS*.5,
   COLLECT_START_MS+completed*PER_WORLD_MS,
   COLLECT_START_MS+completed*PER_WORLD_MS+OFFER_SETTLE_MS,99000]){
   for(const pose of [null,{x:-5,y:1.5,z:-2.2},{x:5,y:-3,z:0}]){
    assert.deepEqual(cameraTrackingAt(ms,pose,0,completed,false),BASE);
    assert.deepEqual(cameraTrackingAt(ms,pose,-1,completed,true),BASE);
   }
  }
 }
});
