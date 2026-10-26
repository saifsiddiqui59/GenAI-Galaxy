import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraTrackingAt} from '../src/space/cameraTracking.js';
import {COLLECT_START_MS,PER_WORLD_MS,OFFER_SETTLE_MS} from '../src/journey/choreography.js';
const p={x:-5,y:1.5,z:-2.2};
test('fullscreen intro and reduced motion preserve fixed original camera',()=>{
 assert.deepEqual(cameraTrackingAt(0,p,0,3),{x:0,y:.3,z:12.5});
 assert.deepEqual(cameraTrackingAt(COLLECT_START_MS+PER_WORLD_MS,p,1,3,true),{x:0,y:.3,z:12.5});
});
test('mobile-width world pickup follows moving skull near orbit',()=>{
 const c=cameraTrackingAt(COLLECT_START_MS+PER_WORLD_MS*.5,p,0,3);
 assert(c.x<-3 && c.x>-7,'negative x follow brings offscreen skull to middle');
 assert(c.y>.5,'follow actual orbital altitude');
 assert(c.z<12.5,'cinematic framing moves closer during grasp');
});
test('camera returns home after all collections before offering',()=>{
 const last=COLLECT_START_MS+PER_WORLD_MS*3;
 const moving=cameraTrackingAt(last+OFFER_SETTLE_MS*.25,p,-1,3);
 const finish=cameraTrackingAt(last+OFFER_SETTLE_MS,p,-1,3);
 assert(moving.x<-1);
 assert.deepEqual(finish,{x:0,y:.3,z:12.5});
});
