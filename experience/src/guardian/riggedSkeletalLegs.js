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
 // Keep physically visible feet while removing the bright toy-ivory look.
 const boneMat=new THREE.MeshStandardMaterial({color:'#858792',roughness:.94,metalness:.02});
 const jointMat=new THREE.MeshStandardMaterial({color:'#636775',roughness:.98,metalness:0});
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
   link('foot.'+side,'toes.'+side,.075,.050,'Foot_'+side);
  else{
   const ankle=bone('foot.'+side);
   const foot=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.17,4,8),boneMat);
   foot.name='SkullMasterFoot_'+side;
   foot.position.set(0,.09,.05);attach(ankle,foot);
  }
  // A heel, broad forefoot and five separate articulated toes make the foot
  // visually identifiable at full-screen distance instead of a tiny leg cap.
  const ankle=bone('foot.'+side);
  if(!ankle?.isBone)throw Error('Missing actual foot bone '+side);
  const heel=new THREE.Mesh(new THREE.SphereGeometry(.092,14,10),boneMat);
  heel.name='SkullMasterHeel_'+side;
  heel.position.set(0,-.016,.028);heel.scale.set(.88,.58,1.18);attach(ankle,heel);
  const sole=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.18,5,12),boneMat);
  sole.name='SkullMasterSole_'+side;sole.rotation.x=Math.PI/2;sole.position.set(0,-.060,.143);sole.scale.set(1.12,.70,1);attach(ankle,sole);
  for(let toe=0;toe<5;toe++){
   const digit=new THREE.Mesh(new THREE.CapsuleGeometry(.014,.073,3,6),jointMat);
   digit.name='SkullMasterToe_'+side+'_'+toe;
   digit.position.set((toe-2)*.032,-.043,.268-(Math.abs(toe-2)*.011));
   digit.rotation.x=Math.PI/2;attach(ankle,digit);
  }
 }
 return {visible:true,dispose(){
  for(const mesh of owned)mesh.parent?.remove(mesh);
  for(const geo of geometries)geo.dispose();
  boneMat.dispose();jointMat.dispose();
 }};
}
