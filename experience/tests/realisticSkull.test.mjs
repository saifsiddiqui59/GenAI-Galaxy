import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SKULL_SOURCE,SKULL_LICENSE,SKULL_ASSET,normalizedSkullTransform,mountDetailedSkull,weatheredBoneColor,weatherSkullGeometry}
 from '../src/guardian/detailSkull.js';
test('new commercial-ready CC0 skull is sourced and mounted without modifying animation clips',()=>{
 assert.equal(SKULL_LICENSE,'CC0-1.0');
 assert(SKULL_SOURCE.includes('8f492390ddc7a2ae221a1369ef560589cf8c70fb'));
 assert.equal(SKULL_ASSET,'models/cc0/ScatteringSkull.glb');
 const root=new THREE.Group(),head=new THREE.Bone();head.name='head';root.add(head);
 const originals=['Skeleton_Mage_Skull','Skeleton_Mage_Jaw','Skeleton_Mage_Eyes'].map(name=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshStandardMaterial());
  mesh.name=name;head.add(mesh);return mesh;
 });
 const detailed=new THREE.Group();
 detailed.add(new THREE.Mesh(new THREE.SphereGeometry(.5,18,12),new THREE.MeshStandardMaterial()));
 const attachment=mountDetailedSkull(root,detailed);
 assert(attachment.active);
 assert(attachment.model.parent===head);
 assert(originals.every(x=>x.visible===false),'Toy skull, jaw and button eyes must all be hidden');
 assert(head.getObjectByName('SkullMasterRecessedEyes'),'New recessed eyes must follow real head bone');
 assert.equal(head.getObjectByName('SkullMasterRecessedEyes').children.length,2);
 assert(attachment.model.scale.x>.1&&attachment.model.scale.x<1);
 attachment.dispose();
 assert(originals.every(x=>x.visible===true));
 assert(!head.getObjectByName('SkullMasterCC0RealisticHead'));
 assert(!head.getObjectByName('SkullMasterRecessedEyes'));
});
test('bad rig remains untouched and invalid GLB bounds fail closed',()=>{
 assert.equal(mountDetailedSkull(new THREE.Group(),new THREE.Group()).active,false);
 assert.throws(()=>normalizedSkullTransform({min:{x:0,y:0,z:0},max:{x:0,y:0,z:0}}),/no usable size/);
});

test('Anatomical Skull Master head stays proportionate to body',()=>{
 const tr=normalizedSkullTransform({min:{x:-.11,y:0,z:-.17},max:{x:.11,y:.25,z:.17}});
 assert(tr.scale*.34<.6,'Skull must not overwhelm the human ribcage');
 assert(tr.position[1]<.15,'Skull should sit near the cervical spine');
});
test('new bone weathering is deterministic, bounded, and leaves CC0 geometry intact',()=>{
 const x=weatheredBoneColor(.17,.44,-.21),y=weatheredBoneColor(.17,.44,-.21);
 assert.deepEqual(x,y);
 assert(x[0]>=.46&&x[0]<=1&&x[1]<x[0]&&x[2]<x[1]);
 const original=new THREE.BufferGeometry();
 original.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.2,.3,.1],3));
 const decorated=weatherSkullGeometry(original,THREE);
 assert.equal(decorated.getAttribute('color').count,2);
 assert.notEqual(decorated,original);
 assert.equal(original.getAttribute('color'),undefined);
 decorated.dispose();original.dispose();
});
