import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTACT,PER_WORLD_MS} from '../src/journey/choreography.js';
import {atlasLayout} from '../src/space/worldAnchors.js';
import {galaxySpaceAt,orbitAt,launchAt,flightProgress,planetHiddenFromAtlas,ORBIT_PERIOD_MS,PLANET_SPIN_PERIOD_MS,planetSpinAt} from '../src/space/worldOrbit.js';
test('all 17 original worlds orbit deterministically without swapping indexes',()=>{
 const worlds=atlasLayout();assert.equal(worlds.length,17);
 for(const [index,world] of worlds.entries()){
  const a=orbitAt(world,0),b=orbitAt(world,5000);
  assert.notDeepEqual([a.x,a.y,a.z],[b.x,b.y,b.z]);
  assert.equal(a.index,index);assert.deepEqual(a,orbitAt(world,0));
  for(const mobile of [true,false]){
   const v=galaxySpaceAt(index,launchAt(index),mobile,mobile);
   assert.equal(v.index,index);assert(v.scale>0);
  }
 }
});
test('original planet is transferred exactly once at its collection start',()=>{
 for(let i=0;i<17;i++){
  const start=launchAt(i);
  assert(!planetHiddenFromAtlas(start,i),'Planet stays in orbit during Skull Master approach');
  assert(!planetHiddenFromAtlas(start+CONTACT*PER_WORLD_MS-1,i));
  assert(planetHiddenFromAtlas(start+CONTACT*PER_WORLD_MS,i),'Planet disappears only at palm contact');
  assert(planetHiddenFromAtlas(start+5000,i));
 }
 assert.equal(planetHiddenFromAtlas(100000,-1),false);
 assert.equal(flightProgress(0),0);
 assert.equal(flightProgress(.30),1);
});

test('all 17 worlds complete a continuous elliptical 360° revolution',()=>{
 const anchors=atlasLayout();
 for(const w of anchors){
  const start=orbitAt(w,0),quarter=orbitAt(w,ORBIT_PERIOD_MS/4),half=orbitAt(w,ORBIT_PERIOD_MS/2),end=orbitAt(w,ORBIT_PERIOD_MS);
  assert(Math.hypot(quarter.x-start.x,quarter.y-start.y)>.7,`no visible travel ${w.index}`);
  assert(Math.hypot(half.x-start.x,half.y-start.y)>.5,`not orbiting ${w.index}`);
  assert(Math.hypot(end.x-start.x,end.y-start.y)<1e-9,`orbit did not close ${w.index}`);
 }
 for(let moment=0;moment<=ORBIT_PERIOD_MS;moment+=2000){
  const positions=anchors.map(w=>orbitAt(w,moment));
  for(let i=0;i<positions.length;i++)for(let j=0;j<i;j++){
   const a=positions[i],b=positions[j];
   assert(Math.hypot(a.x-b.x,a.y-b.y)>a.scale+b.scale+.12,
    `collision at ${moment}ms: worlds ${a.index}/${b.index}`);
  }
 }
});

test('worlds visibly orbit during a short visit while each planet spins independently',()=>{
 assert.equal(ORBIT_PERIOD_MS,90000);
 assert.equal(PLANET_SPIN_PERIOD_MS,36000);
 for(const w of atlasLayout()){
  const initial=orbitAt(w,0),later=orbitAt(w,8000);
  assert(Math.hypot(later.x-initial.x,later.y-initial.y)>.18,`too little orbital travel for ${w.index}`);
  assert(Math.abs(planetSpinAt(w.index,PLANET_SPIN_PERIOD_MS/4)-w.index-Math.PI/2)<1e-9);
  assert.equal(planetSpinAt(w.index,20000,true),w.index,'reduced-motion must freeze surface spin');
 }
});
