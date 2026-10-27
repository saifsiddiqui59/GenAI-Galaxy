import test from 'node:test';
import assert from 'node:assert/strict';
import {cinematicLayoutAt} from '../src/space/cinematicLayout.js';
import {atlasLayout} from '../src/space/worldAnchors.js';
import {galaxySpaceAt,launchAt,orbitAt} from '../src/space/worldOrbit.js';

test('the full-screen galaxy NEVER moves right or shrinks after any planet pickup',()=>{
 for(const compact of [false,true])for(const short of [false,true]){
  const original=cinematicLayoutAt(0,compact,short,3);
  for(const collected of [0,1,3,17])for(const ms of [0,950,4600,7000,8000,9000,18800,90000]){
   const current=cinematicLayoutAt(ms,compact,short,collected);
   assert.deepEqual(current.position,original.position,'galaxy must remain centered throughout the journey');
   assert.deepEqual(current.scale,original.scale,'every planet stays at the same fullscreen scale');
   assert.equal(current.progress,0,'no post-collection atlas-shrink transition');
   assert.equal(current.phase,'immersive');
   assert(current.scale.every(v=>v===current.scale[0]),'planet spheres stay spherical');
  }
 }
});

test('all actual orbital planets share the same unmoving parent at contact',()=>{
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

test('desktop and phone remain balanced full-screen even in reduced-motion',()=>{
 const desktop=cinematicLayoutAt(0,false,false,3);
 const phone=cinematicLayoutAt(0,true,true,3);
 assert(desktop.scale[0]>=1.7&&desktop.scale[0]<=2.1);
 assert(phone.scale[0]>=.58&&phone.scale[0]<=.75);
 assert(Math.abs(desktop.position[0]+4.48*desktop.scale[0])<.05);
 assert(Math.abs(phone.position[0]+4.48*phone.scale[0])<.05);
 for(const compact of [false,true]){
  assert.deepEqual(cinematicLayoutAt(0,compact,true,3,true),cinematicLayoutAt(99000,compact,true,3,true));
 }
});
