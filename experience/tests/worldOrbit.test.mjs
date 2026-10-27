import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTACT,PER_WORLD_MS} from '../src/journey/choreography.js';
import {atlasLayout} from '../src/space/worldAnchors.js';
import {galaxySpaceAt,orbitAt,launchAt,flightProgress,planetHiddenFromAtlas,ORBIT_PERIOD_MS,PLANET_SPIN_PERIOD_MS,planetSpinAt,planetSpinPeriodAt,planetTiltAt,orbitAngleAt,ORBIT_Y_ASPECT} from '../src/space/worldOrbit.js';
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

test('all 17 worlds complete a continuous CIRCULAR 360° revolution',()=>{
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
 assert.equal(ORBIT_PERIOD_MS,70000);
 assert.equal(PLANET_SPIN_PERIOD_MS,24000);
 for(const w of atlasLayout()){
  const initial=orbitAt(w,0),later=orbitAt(w,8000);
  assert(Math.hypot(later.x-initial.x,later.y-initial.y)>.18,`too little orbital travel for ${w.index}`);
  assert(Math.abs(planetSpinAt(w.index,planetSpinPeriodAt(w.index)/4)-w.index-Math.PI/2)<1e-9);
  assert.equal(planetSpinAt(w.index,20000,true),w.index,'reduced-motion must freeze surface spin');
 }
});

test('individual orbit velocities differ but all 17 close CIRCULAR paths without collisions',()=>{
 const worlds=atlasLayout();
 const speeds=worlds.map(w=>orbitAngleAt(w.index,140)-orbitAngleAt(w.index,0));
 assert(new Set(speeds.map(v=>v.toFixed(9))).size>=8,'different planets must have their own instantaneous orbit velocity');
 assert(new Set(worlds.map(w=>planetSpinPeriodAt(w.index))).size>=5,'surfaces must spin at distinct speeds');
 for(const world of worlds){
  const tilt=planetTiltAt(world.index);
  assert(Number.isFinite(tilt.x)&&Number.isFinite(tilt.z));
  assert(Math.abs(orbitAt(world,10000,true).x-world.x)<1e-9,'reduced motion freezes elliptical travel');
  assert(Math.abs(orbitAt(world,10000,true).y-world.y)<1e-9);
  assert.equal(planetSpinAt(world.index,10000,true),world.index);
  const a=orbitAt(world,0),b=orbitAt(world,ORBIT_PERIOD_MS);
  assert(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-9,'all tracks complete 360° closed orbital loops');
 }
 // Independent angular variation is strictly bounded to keep the carefully
 // designed galaxy constellation collision-free for the entire revolution.
 for(let ms=0;ms<=ORBIT_PERIOD_MS;ms+=125){
  const ps=worlds.map(w=>orbitAt(w,ms));
  for(let i=0;i<ps.length;i++)for(let j=0;j<i;j++){
   const a=ps[i],b=ps[j];
   assert(Math.hypot(a.x-b.x,a.y-b.y)>a.scale+b.scale+.12,
    `world collision: ${i}/${j}, t=${ms}`);
  }
 }
});

test('all 17 worlds orbit actual circles (not the previous vertical ellipse)',()=>{
 assert.equal(ORBIT_Y_ASPECT,1);
 const worlds=atlasLayout();
 for(const w of worlds){
  const center={x:4.48,y:.10};
  const r=Math.hypot(w.x-center.x,w.y-center.y);
  for(let ms=0;ms<=ORBIT_PERIOD_MS;ms+=250){
   const p=orbitAt(w,ms);
   const currentRadius=Math.hypot(p.x-center.x,p.y-center.y);
   assert(Math.abs(currentRadius-r)<1e-9,`noncircular radius at ${ms} for world ${w.index}`);
  }
 }
});
