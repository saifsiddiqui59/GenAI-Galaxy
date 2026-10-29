import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guardianApproachAt} from '../src/journey/orbitalApproach.js';
import {COLLECT_START_MS,PER_WORLD_MS,CONTACT,OFFER_SETTLE_MS} from '../src/journey/choreography.js';
import {orbitAt,panoramicOrbitX} from '../src/space/worldOrbit.js';
import {atlasLayout} from '../src/space/worldAnchors.js';

test('HTML paints a loading screen BEFORE large React/GLB downloads',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
 assert.match(html,/id="galaxy-boot"/);
 assert(html.indexOf('id="galaxy-boot"')<html.indexOf('id="root"'));
 assert.match(html,/Preparing the Skull Master/);
 assert.match(app,/if\(!modelReady&&available3D\)return undefined/);
 assert.match(app,/splash.style.opacity='0'/);
});
test('real ankle-connected feet have heels, soles, five toes each',()=>{
 const code=readFileSync(new URL('../src/guardian/riggedSkeletalLegs.js',import.meta.url),'utf8');
 assert.match(code,/bone\('foot\.'\+side\)/);
 assert.match(code,/SkullMasterHeel_/);
 assert.match(code,/SkullMasterSole_/);
 assert.match(code,/toe<5/);
});
test('route walks on a smooth curved orbit approach and still contacts the real world',()=>{
 const indexes=[0,2,4], grip={x:.32,y:1.6,z:.24};
 for(const compact of [false,true]){
  for(let order=0;order<indexes.length;order++){
   const start=COLLECT_START_MS+order*PER_WORLD_MS;
   const a=guardianApproachAt(start,indexes,grip,compact,false);
   const middle=guardianApproachAt(start+CONTACT*PER_WORLD_MS/2,indexes,grip,compact,false);
   const contact=guardianApproachAt(start+CONTACT*PER_WORLD_MS,indexes,grip,compact,false);
   const before=guardianApproachAt(start+PER_WORLD_MS-.001,indexes,grip,compact,false);
   const next=guardianApproachAt(start+PER_WORLD_MS,indexes,grip,compact,false);
   assert(middle.walkWeight>.3,'moving character must play the real walk clip');
   assert(Math.abs(middle.yaw)<=.82,'walking turns should remain readable');
   assert(contact.walkWeight<.001,'legs must settle at the actual palm contact');
   const d=Math.hypot(next.x-before.x,next.y-before.y,next.z-before.z);
   assert(d<.10,'end of each segment must NOT teleport');
   assert(Number.isFinite(a.x)&&Number.isFinite(middle.z));
  }
 }
});
test('desktop panoramic planets spread horizontally without stretching their spherical meshes',()=>{
 const world=orbitAt(atlasLayout()[0],1250);
 assert(Math.abs(panoramicOrbitX(world.x,false)-4.48)>Math.abs(panoramicOrbitX(world.x,true)-4.48)*1.09);
});
