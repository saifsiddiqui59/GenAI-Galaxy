import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SKULL_SOURCE,SKULL_LICENSE,SKULL_ASSET,normalizedSkullTransform,mountDetailedSkull}
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
 assert(originals.slice(0,2).every(x=>x.visible===false));
 assert(originals[2].visible,'Original glowing eyes should stay animated and visible');
 assert(attachment.model.scale.x>.1&&attachment.model.scale.x<1);
 attachment.dispose();
 assert(originals.every(x=>x.visible===true));
 assert(!head.getObjectByName('SkullMasterCC0RealisticHead'));
});
test('bad rig remains untouched and invalid GLB bounds fail closed',()=>{
 assert.equal(mountDetailedSkull(new THREE.Group(),new THREE.Group()).active,false);
 assert.throws(()=>normalizedSkullTransform({min:{x:0,y:0,z:0},max:{x:0,y:0,z:0}}),/no usable size/);
});
