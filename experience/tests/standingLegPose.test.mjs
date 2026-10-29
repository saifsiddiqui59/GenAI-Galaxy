import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {straightenSkeletonLegs,lengthenSkeletonLegs} from '../src/guardian/standingLegPose.js';

test('straighten the ORIGINAL real skeleton hip-knee-ankle chains without replacing bones',()=>{
 const source=new THREE.Group(),hips=new THREE.Bone();hips.name='hips';source.add(hips);
 const chains=[];
 for(const side of ['l','r']){
  const thigh=new THREE.Bone();thigh.name='upperleg.'+side;thigh.position.set(side==='l'?.14:-.14,-.07,0);hips.add(thigh);
  const knee=new THREE.Bone();knee.name='lowerleg.'+side;knee.position.set(0,-.5,0);thigh.add(knee);
  const foot=new THREE.Bone();foot.name='foot.'+side;foot.position.set(0,-.42,0);knee.add(foot);
  const toe=new THREE.Bone();toe.name='toes.'+side;toe.position.set(0,-.11,.16);foot.add(toe);
  thigh.quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1),side==='l'?.76:-.68);
  knee.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-.91);
  foot.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),.56);
  chains.push({thigh,knee,foot,toe});
 }
 const beforeBones=[];source.traverse(n=>{if(n.isBone)beforeBones.push(n)});
 const originalLegLength=chains.map(c=>c.knee.position.length()+c.foot.position.length());
 const extension=lengthenSkeletonLegs(source);
 assert.equal(extension.corrected,4);
 chains.forEach((c,i)=>assert((c.knee.position.length()+c.foot.position.length())>originalLegLength[i]*1.25));
 const result=straightenSkeletonLegs(source,THREE);
 assert.equal(result.corrected,6);
 const afterBones=[];source.traverse(n=>{if(n.isBone)afterBones.push(n)});
 assert.deepEqual(afterBones,beforeBones,'no fabricated/replaced animated bones');
 for(const {thigh,knee,foot,toe} of chains){
  const a=thigh.getWorldPosition(new THREE.Vector3());
  const b=knee.getWorldPosition(new THREE.Vector3());
  const c=foot.getWorldPosition(new THREE.Vector3());
  const d=toe.getWorldPosition(new THREE.Vector3());
  assert(b.y<a.y-.60,'knee hangs below the hip, not across the pelvis');
  assert(c.y<b.y-.52,'ankle hangs below the knee, not folded into chest');
  assert(Math.abs(b.x-a.x)<.01 && Math.abs(c.x-b.x)<.01,'no inward crossed legs');
  assert(d.z>c.z+.10,'toes extend forward and remain visible');
 }
});
