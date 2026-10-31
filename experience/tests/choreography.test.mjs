import test from 'node:test';
import assert from 'node:assert/strict';
import {phaseAt,COLLECT_START_MS,PER_WORLD_MS,TOTAL_WORLDS} from '../src/journey/story.js';
import {OFFER_SETTLE_MS,pickupAt,entranceAt,CONTACT,RELEASE} from '../src/journey/choreography.js';
test('seventeen mastered planets retain deterministic per-planet pickup state',()=>{
 assert.equal(TOTAL_WORLDS,17);
 assert.deepEqual(phaseAt(0,3),{phase:'arriving',visible:0,activeIndex:-1});
 assert.deepEqual(phaseAt(COLLECT_START_MS+100,3),{phase:'collecting',visible:0,activeIndex:0});
 assert.deepEqual(phaseAt(COLLECT_START_MS+PER_WORLD_MS+100,3),{phase:'collecting',visible:1,activeIndex:1});
 assert.deepEqual(phaseAt(COLLECT_START_MS+PER_WORLD_MS*2+100,3),{phase:'collecting',visible:2,activeIndex:2});
 assert.deepEqual(phaseAt(COLLECT_START_MS+PER_WORLD_MS*3+OFFER_SETTLE_MS+1,3),{phase:'offering',visible:3,activeIndex:-1});
});
test('contact belongs to one palm until release, every one of seventeen cycles',()=>{
 for(let i=0;i<17;i++){
  const at=t=>pickupAt(COLLECT_START_MS+(i+t)*PER_WORLD_MS,i);
  assert.equal(at(.2).attached,false);
  assert.equal(at(CONTACT+.001).attached,true);
  assert.equal(at(.7).stage,'deposit');
  assert.equal(at(RELEASE+.001).attached,false);
  assert.equal(at(1.001).stored,true);
 }
});
test('walk arrives without position or heading discontinuities',()=>{
 for(const compact of [true,false]){
  const last=entranceAt(2200,compact);
  assert.equal(last.x,entranceAt(6000,compact).x);assert.equal(last.yaw,0);assert.equal(last.walkWeight,0);
  let previous=entranceAt(0,compact);
  for(let ms=16;ms<2300;ms+=16){
   const next=entranceAt(ms,compact);assert(next.x>=previous.x);assert(Math.abs(next.x-previous.x)<.04);assert(Math.abs(next.yaw-previous.yaw)<.07);previous=next;
  }
 }
});
test('skip and reduced motion do not fake progress or replay pickups',()=>{
 assert.deepEqual(phaseAt(0,0,true),{phase:'offering',visible:0,activeIndex:-1});
 assert.deepEqual(phaseAt(0,3,true),{phase:'offering',visible:3,activeIndex:-1});
 assert.deepEqual(phaseAt(COLLECT_START_MS+PER_WORLD_MS*17+OFFER_SETTLE_MS+1,17),{phase:'offering',visible:17,activeIndex:-1});
 assert.equal(phaseAt(COLLECT_START_MS+PER_WORLD_MS*17-1,17).visible,16);
});

test('Genie stays readable in compact mid-entrance without sacrificing desktop travel',()=>{
 const phone=entranceAt(950,true),wide=entranceAt(950,false);
 assert(phone.x>-.98,'mobile entrance should not crop the hat excessively');
 assert.equal(entranceAt(2200,true).x,-.48);
 assert.equal(entranceAt(2200,false).x,-2.05);
 assert(wide.x<-2.8,'retain long cinematic desktop walk');
});
