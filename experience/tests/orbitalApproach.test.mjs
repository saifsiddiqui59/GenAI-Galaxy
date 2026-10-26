import test from 'node:test';
import assert from 'node:assert/strict';
import {guardianApproachAt,orbitContactAt} from '../src/journey/orbitalApproach.js';
import {COLLECT_START_MS,PER_WORLD_MS,CONTACT,OFFER_SETTLE_MS,entranceAt} from '../src/journey/choreography.js';
import {guardianFloorY,guardianStageScale} from '../src/guardian/guardianFraming.js';
const selected=[0,2,4],grip={x:.32,y:1.60,z:.24};
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`expected ${a} ~ ${b}`);
test('Skull Master walks/glides to each real orbit position before grasp',()=>{
 for(const compact of [false,true])for(const short of [false,true]){
  const scale=guardianStageScale(compact,short);
  for(let order=0;order<selected.length;order++){
   const time=COLLECT_START_MS+(order+CONTACT)*PER_WORLD_MS;
   const pose=guardianApproachAt(time,selected,grip,compact,short);
   const sphere=orbitContactAt(selected[order],order,compact,short,selected.length);
   near(pose.x-grip.x*scale,sphere.x);
   near(pose.y+grip.y*scale,sphere.y);
   near(pose.z-grip.z*scale,sphere.z);
   assert.equal(pose.worldIndex,selected[order]);
   const start=guardianApproachAt(COLLECT_START_MS+order*PER_WORLD_MS,selected,grip,compact,short);
   const middle=guardianApproachAt(COLLECT_START_MS+(order+CONTACT/2)*PER_WORLD_MS,selected,grip,compact,short);
   const distance=p=>Math.hypot(p.x-pose.x,p.y-pose.y,p.z-pose.z);
   assert(distance(middle)<distance(start),'character must move towards target before contact');
  }
 }
});
test('No fake foot pickup and no early atlas transition',()=>{
 const start=guardianApproachAt(COLLECT_START_MS,selected,grip);
 near(start.x,entranceAt(COLLECT_START_MS).x);
 near(start.y,guardianFloorY());
 assert.equal(start.travel,0);
 const after=guardianApproachAt(COLLECT_START_MS+CONTACT*PER_WORLD_MS,selected,grip);
 assert(after.orbitalTarget&&after.travel===1);
});
test('Skull returns to presentation stage after collecting, without abrupt teleport',()=>{
 const finish=COLLECT_START_MS+selected.length*PER_WORLD_MS;
 const start=guardianApproachAt(finish,selected,grip);
 const half=guardianApproachAt(finish+OFFER_SETTLE_MS/2,selected,grip);
 const final=guardianApproachAt(finish+OFFER_SETTLE_MS,selected,grip);
 near(final.x,entranceAt(finish).x);
 near(final.y,guardianFloorY());
 near(final.z,3.2);
 assert(Math.hypot(half.x-final.x,half.y-final.y,half.z-final.z)<Math.hypot(start.x-final.x,start.y-final.y,start.z-final.z));
});
test('Reduced motion never triggers orbit chasing',()=>{
 const p=guardianApproachAt(COLLECT_START_MS+PER_WORLD_MS,selected,grip,true,true,true);
 assert.equal(p.orbitalTarget,null);
 near(p.x,entranceAt(COLLECT_START_MS,true).x);
});
