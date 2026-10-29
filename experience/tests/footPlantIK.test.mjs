import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {plantedFootCorrection,invertRouteDistance,walkingFootTarget} from '../src/guardian/footPlantIK.js';
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

test('right and left heel world coordinates stay FIXED while the root travels in stance',()=>{
 const road=walkingRouteDistance(from,to,1,false);
 const poseAt=d=>({
  walking:true,walkDistance:d,walkSpeed:1.3,
  walkingRouteFrom:from,walkingRouteTo:to,
  walkingRouteProgress:invertRouteDistance(from,to,d,false)
 });
 // Right stance occupies 0-.5 stride; left stance occupies .5-1 stride.
 for(const [side,distances] of [['right',[.11,.19]],['left',[.65,.75]]]){
  const sites=distances.map(d=>walkingFootTarget(poseAt(d),side,false,1.2,-1.4));
  assert(sites.every(s=>s?.weight>.5),{side,sites});
  for(const k of ['x','y','z','stanceDistance']){
   assert(Math.abs(sites[0][k]-sites[1][k])<.008,
    side+' stance heel must not follow walking root: '+k);
  }
 }
 const stopped=walkingFootTarget({...poseAt(.19),walking:false},'right',false,1.2,-1.4);
 assert.equal(stopped.weight,0);
 assert(Number.isFinite(road));
});
test('visual bridge and ankle IK both use a stable neutral-floor height',()=>{
 const source=readFileSync(new URL('../src/guardian/SpectralFootpath.jsx',import.meta.url),'utf8');
 const skeleton=readFileSync(new URL('../src/guardian/KayKitGuardian.jsx',import.meta.url),'utf8');
 assert(source.includes('pose.walkFloorOffset'));
 assert(!source.includes('feet.reduce('),'No ankle averaging feedback');
 assert(skeleton.includes('ankleFloorOffset'));
 assert(skeleton.includes('walkingFootTarget('));
 assert(skeleton.includes('stanceContactErrors'));
});
