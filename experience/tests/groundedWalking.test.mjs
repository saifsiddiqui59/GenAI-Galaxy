import test from 'node:test';
import assert from 'node:assert/strict';
import {groundedStrideAt,STRIDE_DISTANCE} from '../src/guardian/groundedStride.js';
import {guardianApproachAt,walkingPathPoint,walkingRouteDistance,orbitContactAt} from '../src/journey/orbitalApproach.js';
import {COLLECT_START_MS,CONTACT,PER_WORLD_MS} from '../src/journey/choreography.js';

const words=[0,2,4],grip={x:-.24,y:1.25,z:.28};
const approach=(ms,compact=false,reduced=false)=>guardianApproachAt(ms,words,grip,compact,false,reduced);
test('real stride depends on travelled distance, never arbitrary frame playback',()=>{
 const d=groundedStrideAt(.18,2.6),same=groundedStrideAt(.18,9);
 assert.equal(d.phase,same.phase);
 assert.equal(groundedStrideAt(.18,0).active,0);
 assert.equal(groundedStrideAt(.18,9,true).active,0);
 assert(Math.abs(groundedStrideAt(.18,9).leftThigh)>0.01);
 assert(Math.sign(groundedStrideAt(.18,9).leftThigh)===-Math.sign(groundedStrideAt(.18,9).rightThigh));
 assert.equal(groundedStrideAt(.18,9).leftPlant>0, true);
 assert(Math.abs(groundedStrideAt(.18+STRIDE_DISTANCE,9).leftThigh-groundedStrideAt(.18,9).leftThigh)<1e-10);
});
test('walks to world zero, plants feet at actual contact and stops until next journey',()=>{
 const end=COLLECT_START_MS+PER_WORLD_MS*CONTACT;
 const departure=approach(COLLECT_START_MS+350);
 const mid=approach(COLLECT_START_MS+PER_WORLD_MS*.22);
 const contact=approach(end);
 const pause=approach(end+PER_WORLD_MS*.24);
 assert(departure.speed>.02 && departure.walkWeight>.01);
 assert(mid.walkDistance>departure.walkDistance);
 assert(mid.walkWeight>0);
 assert.equal(contact.speed,0);
 assert.equal(pause.walkWeight,0);
 assert.equal(pause.walkDistance,contact.walkDistance);
 const target=orbitContactAt(0,0,false,false,words.length,false);
 assert.deepEqual(contact.orbitalTarget,target);
 assert(contact.routeProgress===1);
 assert(Math.hypot(contact.x-pause.x,contact.y-pause.y,contact.z-pause.z)<.0001);
});
test('walking is continuous between different mastered planets, no teleport',()=>{
 const boundary=COLLECT_START_MS+PER_WORLD_MS;
 const a=approach(boundary-1),b=approach(boundary);
 assert(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.06);
 assert(b.walkDistance>=a.walkDistance);
 assert(approach(boundary+700).walkDistance>b.walkDistance);
 const last=approach(COLLECT_START_MS+3*PER_WORLD_MS);
 assert(last.walkDistance>approach(boundary+1200).walkDistance);
});
test('same curve drives both root walking route and visible walkable bridge',()=>{
 const a={x:0,y:0,z:3},b={x:7,y:2,z:1};
 assert.deepEqual(walkingPathPoint(a,b,0),a);
 assert.deepEqual(walkingPathPoint(a,b,1),b);
 assert(walkingRouteDistance(a,b,.5)>0);
 assert(walkingRouteDistance(a,b,1)>walkingRouteDistance(a,b,.5));
 for(const mobile of [false,true]){
  const q=approach(3400,mobile);
  const p=walkingPathPoint(q.routeFrom,q.routeTo,q.routeProgress,mobile);
  assert(Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<.00001);
 }
});
test('reduced motion never invents steps or moves through the worlds',()=>{
 for(const ms of [0,3000,8000,20000]){
  const p=approach(ms,true,true);
  assert.equal(p.walkWeight,0);
  assert.equal(p.speed,0);
  assert.equal(p.walkDistance,0);
 }
});
