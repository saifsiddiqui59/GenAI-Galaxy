import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mapSkinnedMixamoRig,solvePoleConstrainedLeg,reachWithSkinnedHand,prototypeSkinnedStance}
 from '../src/guardian/candidateSkinnedRig.js';

function bone(name,x=0,y=0,z=0){
 const b=new THREE.Bone();b.name='mixamorig:'+name;b.position.set(x,y,z);return b;
}
function makeRig(){
 const root=new THREE.Group(),hips=bone('Hips',0,0,0),spine=bone('Spine',0,.25,0),head=bone('Head',0,.55,0);
 root.add(hips);hips.add(spine);spine.add(head);
 for(const [side,sign] of [['Left',-1],['Right',1]]){
  const arm=bone(side+'Arm',sign*.25,.25,0),fore=bone(side+'ForeArm',sign*.26,-.10,0),hand=bone(side+'Hand',sign*.20,-.06,0);
  spine.add(arm);arm.add(fore);fore.add(hand);
  const thigh=bone(side+'UpLeg',sign*.18,-.1,0),shin=bone(side+'Leg',0,-.40,.1),foot=bone(side+'Foot',0,-.40,.1),toe=bone(side+'ToeBase',0,-.03,.14);
  hips.add(thigh);thigh.add(shin);shin.add(foot);foot.add(toe);
 }
 root.updateWorldMatrix(true,true);
 return root;
}
test('map actual 22-joint Mixamo naming without creating replacement meshes',()=>{
 const root=makeRig(),count=root.children.length;
 const rig=mapSkinnedMixamoRig(root);
 assert.equal(rig.sides.left.arm[2].name,'mixamorig:LeftHand');
 assert.equal(rig.sides.right.leg[2].name,'mixamorig:RightFoot');
 assert.notEqual(rig.sides.left.leg[2],rig.sides.right.leg[2]);
 assert.equal(root.children.length,count);
});
test('reject a disconnected forearm rather than silently inventing an IK chain',()=>{
 const root=makeRig(),arm=root.getObjectByName('mixamorig:LeftArm'),fore=root.getObjectByName('mixamorig:LeftForeArm');
 arm.remove(fore);root.add(fore);
 assert.throws(()=>mapSkinnedMixamoRig(root),/Disconnected/);
});
test('pole-constrained 2-bone IK reaches stance target with no stretching or crossed knees',()=>{
 const rig=mapSkinnedMixamoRig(makeRig());
 for(const [side,sign] of [['left',-1],['right',1]]){
  const chain=rig.sides[side].leg;
  const hip=chain[0].getWorldPosition(new THREE.Vector3());
  const target=hip.clone().add(new THREE.Vector3(sign*.10,-.65,.16));
  const pole=hip.clone().add(new THREE.Vector3(sign*.22,-.22,.65));
  const out=solvePoleConstrainedLeg(chain,target,pole);
  assert(out.reachable,side);
  assert(out.error<.015,side+' '+out.error);
  assert(Math.abs(out.upper-.4123)<.02);
  assert(Math.abs(out.lower-.4123)<.02);
  assert(Math.sign(out.knee.x)===sign,'knee stays on its original side');
 }
});
test('unreachable stance is reported, never stretched or passed as planted',()=>{
 const rig=mapSkinnedMixamoRig(makeRig()),chain=rig.sides.left.leg;
 const hip=chain[0].getWorldPosition(new THREE.Vector3());
 const target=hip.clone().add(new THREE.Vector3(-.2,-2,0));
 const out=solvePoleConstrainedLeg(chain,target,hip.clone().add(new THREE.Vector3(-.4,-.2,.7)));
 assert.equal(out.reachable,false);
 assert(out.error>1,'unreachable world contact must be measurable');
});
test('hand IK targets real rig hand and stance without route remains safely unapplied',()=>{
 const rig=mapSkinnedMixamoRig(makeRig()),hand=rig.sides.right.arm[2];
 const target=hand.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(-.1,-.05,.13));
 const before=hand.getWorldPosition(new THREE.Vector3()).distanceTo(target);
 const after=reachWithSkinnedHand(rig,'right',target);
 assert(after<before,'actual skinned hand moves toward orbital contact');
 assert.deepEqual(prototypeSkinnedStance(rig,'left',null),{applied:false,landing:null});
});
