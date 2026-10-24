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
