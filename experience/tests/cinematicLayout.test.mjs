import test from 'node:test';
import assert from 'node:assert/strict';
import {ATLAS_REVEAL_MS,atlasRevealStart,cinematicLayoutAt} from '../src/space/cinematicLayout.js';
import {atlasLayout} from '../src/space/worldAnchors.js';
import {galaxySpaceAt,launchAt,orbitAt} from '../src/space/worldOrbit.js';
test('the galaxy opens full-screen and shifts right only after first collected planet',()=>{
 assert.equal(atlasRevealStart(3),launchAt(0)+2600);
 assert.equal(atlasRevealStart(0),launchAt(0));
 const before=cinematicLayoutAt(1000,false,false,3);
 const firstContact=cinematicLayoutAt(launchAt(0)+1900,false,false,3);
 const middle=cinematicLayoutAt(atlasRevealStart(3)+ATLAS_REVEAL_MS/2,false,false,3);
 const end=cinematicLayoutAt(12000,false,false,3);
 assert.equal(before.phase,'immersive');
 assert.equal(firstContact.progress,0,'Keep galaxy full-screen until first planet deposited');
 assert(middle.progress>.4&&middle.progress<.6);
 assert.equal(end.phase,'atlas');
 assert(before.position[0]<-7 && end.position[0]===0);
 assert(before.scale[0]>end.scale[0]);
});
test('pickup origin uses identical scene-space parent during all cinematic stages',()=>{
 for(const compact of [false,true])for(const short of [false,true])for(const completed of [1,3,17]){
  const worlds=atlasLayout();
  for(const order of [0,Math.min(1,completed-1),completed-1]){
   const time=launchAt(order),world=worlds[order];
   const transform=cinematicLayoutAt(time,compact,short,completed);
   const orbit=orbitAt(world,time);
   const actual=galaxySpaceAt(order,time,compact,short,completed);
   const projected=[orbit.x*transform.scale[0]+transform.position[0],orbit.y*transform.scale[1]+transform.position[1],orbit.z*transform.scale[2]+transform.position[2]];
   for(let j=0;j<3;j++)assert(Math.abs(projected[j]-[actual.x,actual.y,actual.z][j])<1e-10);
  }
 }
});
test('mobile has immersive then right-aligned view; reduced motion skips motion',()=>{
 const mobile=cinematicLayoutAt(0,true,true,3);
 const finished=cinematicLayoutAt(12000,true,true,3);
 assert(mobile.position[0]<finished.position[0]);
 assert.equal(finished.position[0],-1.8);
 assert.equal(cinematicLayoutAt(0,false,false,3,true).progress,1);
 assert.equal(cinematicLayoutAt(0,true,true,3,true).progress,1);
});
