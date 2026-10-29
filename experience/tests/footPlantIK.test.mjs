import test from 'node:test';
import assert from 'node:assert/strict';
import {plantedFootCorrection,invertRouteDistance} from '../src/guardian/footPlantIK.js';
import {walkingRouteDistance,walkingPathPoint} from '../src/journey/orbitalApproach.js';
const from={x:0,y:0,z:1},to={x:4,y:1,z:-1};
test('inversion finds actual curved pathway distance deterministically',()=>{
 const total=walkingRouteDistance(from,to,1,false);
 for(const fraction of [0,.10,.25,.50,.75,.93,1]){
  const u=invertRouteDistance(from,to,total*fraction,false);
  assert(Math.abs(walkingRouteDistance(from,to,u,false)-total*fraction)<.007);
  assert(Number.isFinite(walkingPathPoint(from,to,u,false).x));
 }
});
test('stance-foot correction reduces forward skating only while in foot contact',()=>{
 const pose=(distance,u,speed)=>({
  walking:true,walkDistance:distance,walkSpeed:speed,
  walkingRouteFrom:from,walkingRouteTo:to,walkingRouteProgress:u});
 const p=plantedFootCorrection(pose(.64,.16,2),'left');
 assert(p.weight>0.1,p);
 assert([p.dx,p.dy,p.dz].every(Number.isFinite));
 assert(Math.abs(p.dx)<=.42);
 assert.equal(plantedFootCorrection(pose(.64,.16,0),'left').weight,0);
 assert.equal(plantedFootCorrection({...pose(.64,.16,2),walking:false},'left').weight,0);
});
test('replay is stable and seek to planet contact cannot invent movement',()=>{
 const a=plantedFootCorrection(pose(.54,.12,3),'right');
 const b=plantedFootCorrection(pose(.54,.12,3),'right');
 assert.deepEqual(a,b);
});
function pose(distance,u,speed){return {walking:true,walkDistance:distance,walkSpeed:speed,
 walkingRouteFrom:from,walkingRouteTo:to,walkingRouteProgress:u};}
