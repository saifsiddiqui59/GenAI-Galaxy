import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {attachBareSkullTorso,BARE_SKULL_PROFILE} from '../src/guardian/bareSkull.js';

function sampleRig(){
 const root=new THREE.Group();
 const bones=new Map();
 function bone(name,parent,translation=[0,0,0]){
  const b=new THREE.Bone();b.name=name;b.position.set(...translation);
  (parent||root).add(b);bones.set(name,b);return b;
 }
 const hip=bone('hips',null,[0,.5,0]);
 const spine=bone('spine',hip,[0,.25,0]);
 const chest=bone('chest',spine,[0,.38,0]);
 bone('head',chest,[0,.4,0]);
 for(const side of ['l','r']){
  const s=side==='l'?1:-1;
  const upper=bone('upperarm.'+side,chest,[s*.22,.13,0]);
  const lower=bone('lowerarm.'+side,upper,[0,.24,0]);
  const wrist=bone('wrist.'+side,lower,[0,.26,0]);
  bone('hand.'+side,wrist,[0,.07,0]);
  const upperLeg=bone('upperleg.'+side,hip,[s*.17,-.14,0]);
  const lowerLeg=bone('lowerleg.'+side,upperLeg,[0,-.23,0]);
  const foot=bone('foot.'+side,lowerLeg,[0,-.15,0]);
  bone('toes.'+side,foot,[0,0,.18]);
 }
 const originals=BARE_SKULL_PROFILE.hiddenMeshes.map(name=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),new THREE.MeshStandardMaterial());
  m.name=name;root.add(m);return m;
 });
 return {root,bones,originals};
}

test('full skeleton replaces toy costume, gloves and boots without touching the animation bones',()=>{
 const {root,bones,originals}=sampleRig(),size=bones.size;
 const cleanup=attachBareSkullTorso(root,THREE);
 assert(originals.every(o=>o.visible===false),'No mage costume/boots/gauntlets may remain visible');
 assert.equal(size,bones.size,'Bones and clips must remain intact');
 const names=[];
 root.traverse(obj=>{if(obj.isMesh&&obj.visible)names.push(obj.name)});
 for(const s of ['SkullMasterHumerus','SkullMasterRadiusUlna','SkullMasterFemur',
  'SkullMasterTibia','SkullMasterMetatarsal','SkullMasterLongClaw','SkullMasterToe','SkullMasterIlium'])
  assert(names.includes(s),'Missing articulated anatomy '+s);
 const before=names.length;
 assert(before>24,'Full rig should use sufficient bones for a readable skeletal silhouette');
 cleanup();
 assert(originals.every(o=>o.visible===true));
 assert.equal(root.getObjectByName('SkullMasterBareRibCage'),undefined);
 for(const n of ['SkullMasterHumerus','SkullMasterToe','SkullMasterIlium'])
  assert.equal(root.getObjectByName(n),undefined);
});
