import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ANATOMY_ASSET,ANATOMY_SHA256,classifyAnatomicalPart,attachAnatomicalSkeleton}
 from '../src/guardian/retargetAnatomy.js';
test('CC0 candidate remains separately pinned and correctly classified to genuine rig bones',()=>{
 assert.equal(ANATOMY_ASSET,'models/cc0/InnersceneAnatomicalSkeleton.glb');
 assert.match(ANATOMY_SHA256,/^[a-f0-9]{64}$/);
 for(const [name,x,target] of [
  ['Rib 6 left',.09,'chest'],['Sternum',0,'chest'],
  ['Radius',-.28,'lowerarm.r'],['Radius.001',.28,'lowerarm.l'],
  ['Humerus',.22,'upperarm.l'],['Femur',-.13,'upperleg.r'],
  ['Fibula',.11,'lowerleg.l'],['Carpal.001',-.23,'hand.r'],
  ['Metatarsal 3',.13,'foot.l'],['Ilium right',-.11,'hips']
 ]){
  assert.equal(classifyAnatomicalPart(name,x)?.bone,target,name);
 }
 assert.equal(classifyAnatomicalPart('Cranium and facial block',0),null);
 assert.equal(classifyAnatomicalPart('Mandible',0),null);
 assert.equal(classifyAnatomicalPart('Lower tooth.010',0),null);
});
test('retargeted bone parts follow the original animated rig without replacing its bones',()=>{
 const source=new THREE.Group(),chest=new THREE.Bone();chest.name='chest';chest.position.y=.973;
 source.add(chest);
 const anatomy=new THREE.Group(),geometry=new THREE.BoxGeometry(.028,.028,.028);
 for(let i=0;i<120;i++){
  const bone=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());
  bone.name='Rib '+((i%12)+1)+' left';
  bone.position.set(.07+(i%7)*.016,1.15+(i%12)*.018,(i%3)*.02);
  anatomy.add(bone);
 }
 const countBefore=source.children.length;
 const out=attachAnatomicalSkeleton(source,anatomy,THREE);
 assert.equal(out.attached,120);
 assert.equal(out.clusters,1,'one merged draw call per animated rig bone');
 assert.equal(source.children.length,countBefore,'existing animation rig not replaced');
 const mesh=chest.getObjectByName('SkullMasterAnatomy_chest');
 assert(mesh?.isMesh);
 const before=mesh.getWorldPosition(new THREE.Vector3());
 chest.position.x+=1.3;source.updateMatrixWorld(true);
 const after=mesh.getWorldPosition(new THREE.Vector3());
 assert(Math.abs(after.x-before.x-1.3)<1e-5,'Anatomical mesh must follow the chest');
 out.dispose();
 assert.equal(chest.getObjectByName('SkullMasterAnatomy_chest'),undefined);
 geometry.dispose();
});
