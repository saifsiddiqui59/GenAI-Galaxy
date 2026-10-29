/* Original KayKit 41-bone hip/knee/ankle chains are the source of truth.
 * Reuse the existing real rig and shaped anatomical shaft code. The imported
 * unskinned CC0 bone fragments are kept hidden where alignment was unreliable.
 */
import {anatomicalShaftGeometry} from './bareSkull.js';
export function attachRiggedSkeletalLegs(source,THREE){
 const canonical=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const bones=new Map();
 source.traverse(n=>{if(n.isBone)bones.set(canonical(n.name),n)});
 const bone=name=>bones.get(canonical(name));
 const owned=[],geometries=[];
 const boneMat=new THREE.MeshStandardMaterial({color:'#c2b3a2',roughness:.96,metalness:0});
 const jointMat=new THREE.MeshStandardMaterial({color:'#9b8c80',roughness:.99,metalness:0});
 function attach(parent,mesh){parent.add(mesh);mesh.castShadow=true;owned.push(mesh);geometries.push(mesh.geometry)}
 function link(from,to,wide,narrow,label){
  const a=bone(from),b=bone(to);
  if(!a?.isBone||!b?.isBone||b.parent!==a)throw Error('Missing connected leg rig '+from+' -> '+to);
  const direction=b.position.clone(),length=direction.length();
  if(!Number.isFinite(length)||length<.025)throw Error('Invalid bone segment '+from);
  const shaft=new THREE.Mesh(anatomicalShaftGeometry(THREE,length,wide,narrow),boneMat);
  shaft.name='SkullMaster'+label;
  shaft.position.copy(direction).multiplyScalar(.5);
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  attach(a,shaft);
  const joint=new THREE.Mesh(new THREE.IcosahedronGeometry(wide*.88,2),jointMat);
  joint.name='SkullMasterLegJoint';attach(a,joint);
 }
 for(const side of ['l','r']){
  link('upperleg.'+side,'lowerleg.'+side,.093,.068,'Femur_'+side);
  link('lowerleg.'+side,'foot.'+side,.073,.052,'Tibia_'+side);
  if(bone('toes.'+side)?.parent===bone('foot.'+side))
   link('foot.'+side,'toes.'+side,.06,.045,'Foot_'+side);
  else{
   const ankle=bone('foot.'+side);
   const foot=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.17,4,8),boneMat);
   foot.name='SkullMasterFoot_'+side;
   foot.position.set(0,.09,.05);attach(ankle,foot);
  }
 }
 return {visible:true,dispose(){
  for(const mesh of owned)mesh.parent?.remove(mesh);
  for(const geo of geometries)geo.dispose();
  boneMat.dispose();jointMat.dispose();
 }};
}
