import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasLayout} from '../src/space/worldAnchors.js';
import {galaxySpaceAt,orbitAt,launchAt,flightProgress,planetHiddenFromAtlas} from '../src/space/worldOrbit.js';
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
  assert(!planetHiddenFromAtlas(start-1,i));
  assert(planetHiddenFromAtlas(start,i));
  assert(planetHiddenFromAtlas(start+5000,i));
 }
 assert.equal(planetHiddenFromAtlas(100000,-1),false);
 assert.equal(flightProgress(0),0);
 assert.equal(flightProgress(.30),1);
});

test('all 17 worlds complete a continuous elliptical 360° revolution',()=>{
 const anchors=atlasLayout();
 for(const w of anchors){
  const start=orbitAt(w,0),quarter=orbitAt(w,36000),half=orbitAt(w,72000),end=orbitAt(w,144000);
  assert(Math.hypot(quarter.x-start.x,quarter.y-start.y)>.7,`no visible travel ${w.index}`);
  assert(Math.hypot(half.x-start.x,half.y-start.y)>1.3,`not orbiting ${w.index}`);
  assert(Math.hypot(end.x-start.x,end.y-start.y)<1e-9,`orbit did not close ${w.index}`);
 }
 for(let moment=0;moment<=144000;moment+=2000){
  const positions=anchors.map(w=>orbitAt(w,moment));
  for(let i=0;i<positions.length;i++)for(let j=0;j<i;j++){
   const a=positions[i],b=positions[j];
   assert(Math.hypot(a.x-b.x,a.y-b.y)>a.scale+b.scale+.12,
    `collision at ${moment}ms: worlds ${a.index}/${b.index}`);
  }
 }
});
