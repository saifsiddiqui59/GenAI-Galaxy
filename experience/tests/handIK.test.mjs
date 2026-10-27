import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {identifyArmChains,moveWrist} from '../src/guardian/handIK.js';
function arm(root,side,x){
 const upper=new THREE.Bone();upper.name=side+'.UpperLeg.001';upper.position.set(x,0,0);
 const elbow=new THREE.Bone();elbow.name=side+'.DownLeg.001';elbow.position.set(0,.5,0);
 const wrist=new THREE.Bone();wrist.name=side+'.DownLeg.001_end';wrist.position.set(0,.5,0);
 upper.add(elbow);elbow.add(wrist);root.add(upper);return wrist;
}
test('actual Quaternius bone convention resolves two real chains',()=>{
 const root=new THREE.Group();arm(root,'L',-.5);arm(root,'R',.5);root.updateMatrixWorld(true);
 const rig=identifyArmChains(root);
 assert.equal(rig.left.length,3);assert.equal(rig.right.length,3);
});
test('CCD reduces wrist-to-target distance without a fake mesh',()=>{
 const root=new THREE.Group();const wrist=arm(root,'L',0);root.updateMatrixWorld(true);
 const chain=identifyArmChains(root).left;
 const target=new THREE.Vector3(.4,.7,0);
 const initial=wrist.getWorldPosition(new THREE.Vector3()).distanceTo(target);
 const final=moveWrist(chain,target,12);
 assert(Number.isFinite(final));assert(final<initial-.05, 'CCD should move an original FBX joint');
});
test('unknown bone hierarchy fails closed',()=>{
 assert.equal(identifyArmChains(new THREE.Group()).left,null);
 assert.equal(moveWrist(null,new THREE.Vector3()),Infinity);
});