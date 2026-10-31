/* Art review: connected skeletal arm chain on the ORIGINAL KayKit arm bones.
 * Replaces visibly disjoint rigid clusters from an unskinned anatomical GLB.
 * No new rig or animation; the palm stays physically linked to live hand IK.
 */
import {anatomicalShaftGeometry} from './bareSkull.js';

export function attachRiggedSkeletalArms(source,THREE){
 // Three.js PropertyBinding normalizes '.', '_' and other source-GLB names.
 const canonical=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const bones=new Map();
 source.traverse(node=>{if(node.isBone)bones.set(canonical(node.name),node)});
 const getBone=name=>bones.get(canonical(name));
 const attached=[],geometries=[];
 // Match the cool graphite anatomical ribs and legs; keep hand details visible.
 const marrow=new THREE.MeshStandardMaterial({color:'#858792',roughness:.94,metalness:.02});
 const jointMat=new THREE.MeshStandardMaterial({color:'#636775',roughness:.98,metalness:0});
 function add(parent,mesh){parent.add(mesh);attached.push(mesh);mesh.castShadow=true;if(mesh.geometry)geometries.push(mesh.geometry)}
 function segment(parentName,childName,proximal,distal,label){
  const a=getBone(parentName),b=getBone(childName);
  if(!a?.isBone||!b?.isBone||b.parent!==a)
   throw Error('Real bone chain missing '+parentName+' -> '+childName);
  const direction=b.position.clone(),length=direction.length();
  if(!Number.isFinite(length)||length<.02)throw Error('Zero arm bone '+parentName);
  const shaft=new THREE.Mesh(anatomicalShaftGeometry(THREE,length,proximal,distal),marrow);
  shaft.name='SpectralMaster_'+label;
  shaft.position.copy(direction).multiplyScalar(.5);
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  add(a,shaft);
  const joint=new THREE.Mesh(new THREE.IcosahedronGeometry(proximal*.72,2),jointMat);
  joint.name='SpectralMasterJoint';add(a,joint);
  return a;
 }
 for(const side of ['l','r']){
  segment('upperarm.'+side,'lowerarm.'+side,.062,.046,'Humerus_'+side);
  const forearm=segment('lowerarm.'+side,'wrist.'+side,.046,.036,'Ulna_'+side);
  const wrist=getBone('wrist.'+side);
  const v=wrist.position.clone(),len=v.length();
  for(const sign of [-1,1]){
   const path=new THREE.CatmullRomCurve3([
    new THREE.Vector3(sign*.025,0,.01),new THREE.Vector3(sign*.029,v.y*.47,.02),
    new THREE.Vector3(sign*.022,v.y*.92,.015)]);
   const shaft=new THREE.Mesh(new THREE.TubeGeometry(path,20,.014,7,false),marrow);
   shaft.name=sign===1?'SpectralMasterRadius':'SpectralMasterUlnaDetail';
   add(forearm,shaft);
  }
  segment('wrist.'+side,'hand.'+side,.034,.035,'Carpal_'+side);
  const hand=getBone('hand.'+side);
  const palm=new THREE.Mesh(new THREE.DodecahedronGeometry(.058,1),marrow);
  palm.name='SpectralMasterPalm';palm.scale.set(1.1,1.25,.65);
  palm.position.y=.053;add(hand,palm);
  for(let i=0;i<4;i++){
   const x=(i-1.5)*.030;
   const length=.18-(i===0||i===3?.025:0);
   const points=[[x,.088,.016],[x*1.17,.14,.015],[x*1.22,length,.035]];
   const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
   const finger=new THREE.Mesh(new THREE.TubeGeometry(curve,15,.010,6,false),marrow);
   finger.name='SpectralMasterFinger';add(hand,finger);
  }
  const thumbCurve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(-.055,.045,.022),new THREE.Vector3(-.098,.085,.052),
   new THREE.Vector3(-.112,.12,.078)]);
  const thumb=new THREE.Mesh(new THREE.TubeGeometry(thumbCurve,12,.013,6,false),marrow);
  thumb.name='SpectralMasterThumb';add(hand,thumb);
 }
 return {
  articulated:true,
  dispose(){
   for(const obj of attached)obj.parent?.remove(obj);
   geometries.forEach(geo=>geo.dispose());
   marrow.dispose();jointMat.dispose();
  }
 };
}
