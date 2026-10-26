/* V6 EXPERIMENT: bone-local retargeting of the original CC0 anatomical mesh.
 * No new animation or skin tracks are written: the existing KayKit 41-bone
 * hierarchy and its IK drive anatomically detailed rigid bone clusters.
 *
 * Innerscene original CC0 model: 322 meshes, zero skins or animations.
 * Verified GLB SHA256: e52d1b23cf15b574885846a7da30354defc0a3a51b679ded6cbc7c0c1965d996
 * Source: https://www.innerscene.com/tools/library/3d-parts/human-skeleton-simplified-anatomical-study-a93f4d8f
 * This is a side branch visual experiment, NOT an approved final character.
 */
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const ANATOMY_ASSET='models/cc0/InnersceneAnatomicalSkeleton.glb';
export const ANATOMY_SHA256='e52d1b23cf15b574885846a7da30354defc0a3a51b679ded6cbc7c0c1965d996';
export const ANATOMY_MODE=import.meta.env?.VITE_GALAXY_ANATOMY==='1';

const bonesByRegion={
 upperArm:['upperarm.l','upperarm.r'],
 lowerArm:['lowerarm.l','lowerarm.r'],
 hand:['hand.l','hand.r'],
 upperLeg:['upperleg.l','upperleg.r'],
 lowerLeg:['lowerleg.l','lowerleg.r'],
 foot:['foot.l','foot.r'],
 chest:['chest'],spine:['spine'],hips:['hips'],neck:['chest']
};
export function classifyAnatomicalPart(name,centerX=0){
 if(/cranium|mandible|tooth/i.test(name))return null; // existing anatomical skull is more detailed
 const side=centerX>=0?0:1; // CC0 source +X corresponds to KayKit .l
 const pick=(region)=>({region,bone:bonesByRegion[region][side]});
 if(/^(Humerus|Humeral head)/i.test(name))return pick('upperArm');
 if(/^(Radius|Ulna)/i.test(name))return pick('lowerArm');
 if(/^(Carpal|Metacarpal|Finger phalanx)/i.test(name))return pick('hand');
 if(/^(Femur|Femoral |Patella)/i.test(name))return pick('upperLeg');
 if(/^(Tibia|Fibula)/i.test(name))return pick('lowerLeg');
 if(/^(Calcaneus|Tarsal|Metatarsal|Toe phalanx)/i.test(name))return pick('foot');
 if(/^(Ilium|Obturator|Pubic|Sacrum|Coccyx)/i.test(name))return pick('hips');
 if(/^Lumbar/i.test(name))return pick('spine');
 if(/^Cervical/i.test(name))return pick('neck');
 if(/^(Rib |Sternum|Clavicle|Scapula)/i.test(name))return pick('chest');
 if(/^Thoracic/i.test(name))return pick('chest');
 return null;
}
function groupAnchor(region,side){
 const sign=side===0?1:-1;
 switch(region){
  case 'upperArm':return {source:[sign*.21,1.40,0],scale:.81,angle:sign*Math.PI/2};
  case 'lowerArm':return {source:[sign*.26,1.105,0],scale:1.03,angle:sign*Math.PI/2};
  case 'hand':return {source:[sign*.28,.865,0],scale:.94,angle:sign*Math.PI/2};
  case 'upperLeg':return {source:[sign*.122,.86,0],scale:.62,angle:0};
  case 'lowerLeg':return {source:[sign*.113,.48,0],scale:.43,angle:0};
  case 'foot':return {source:[sign*.114,.14,0],scale:.82,angle:0};
  case 'hips':return {source:[0,.93,0],scale:1.08,angle:0};
  case 'spine':return {source:[0,1.09,0],scale:1.35,angle:0};
  case 'neck':return {source:[0,1.47,0],scale:.83,angle:0};
  default:return {source:[0,1.30,0],scale:1.24,angle:0};
 }
}
export function desiredPartTransform(THREE,region,bone,root,side){
 const info=groupAnchor(region,side);
 root.updateWorldMatrix(true,true);
 const rootInv=root.matrixWorld.clone().invert();
 const worldBone=new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
 const anchorWorld=worldBone.applyMatrix4(rootInv);
 // Bone rest translations keep the actual rig's anatomical chain coherent.
 const T=new THREE.Matrix4().makeTranslation(anchorWorld.x,anchorWorld.y,anchorWorld.z);
 const R=new THREE.Matrix4().makeRotationZ(info.angle);
 const S=new THREE.Matrix4().makeScale(info.scale,info.scale,info.scale);
 const A=new THREE.Matrix4().makeTranslation(-info.source[0],-info.source[1],-info.source[2]);
 return T.multiply(R).multiply(S).multiply(A);
}
export function attachAnatomicalSkeleton(source,anatomy,THREE){
 if(!source||!anatomy)throw Error('Missing animated rig or anatomical geometry');
 source.updateMatrixWorld(true);
 anatomy.updateMatrixWorld(true);
 const invRoot=source.matrixWorld.clone().invert();
 const mergedParts=new Map(),owned=[],geos=[];
 let classified=0,missed=0;
 const center=new THREE.Vector3(),bounds=new THREE.Box3();
 anatomy.traverse(o=>{
  if(!o.isMesh||!o.geometry)return;
  o.updateWorldMatrix(true,false);
  bounds.setFromObject(o);bounds.getCenter(center);
  const kind=classifyAnatomicalPart(o.name,center.x);
  if(!kind)return; // original CC0 detailed skull remains
  const bone=source.getObjectByName(kind.bone);
  if(!bone?.isBone){missed++;return}
  const side=kind.bone.endsWith('.r')?1:0;
  const transform=desiredPartTransform(THREE,kind.region,bone,source,side);
  const boneRelative=invRoot.clone().multiply(bone.matrixWorld);
  const toLocal=boneRelative.invert().multiply(transform).multiply(o.matrixWorld);
  let geom=o.geometry.clone();
  geom.applyMatrix4(toLocal);
  if(geom.index){const raw=geom;geom=raw.toNonIndexed();raw.dispose();}
  // Strip heterogeneous attributes, preserve actual surface normals.
  for(const attr of Object.keys(geom.attributes))
   if(!['position','normal'].includes(attr))geom.deleteAttribute(attr);
  if(!geom.hasAttribute('normal'))geom.computeVertexNormals();
  if(!mergedParts.has(kind.bone))mergedParts.set(kind.bone,[]);
  mergedParts.get(kind.bone).push(geom);
  classified++;
 });
 if(classified<100||missed)throw Error('Incomplete anatomical rigging: '+classified+' assigned, '+missed+' unmatched');
 const material=new THREE.MeshStandardMaterial({color:'#c7b9a6',roughness:.93,metalness:0});
 for(const [name,parts] of mergedParts){
  const bone=source.getObjectByName(name);
  const combined=mergeGeometries(parts,false);
  parts.forEach(g=>g.dispose());
  if(!combined)throw Error('Could not merge anatomical bones at '+name);
  const mesh=new THREE.Mesh(combined,material);
  mesh.name='SkullMasterAnatomy_'+name;
  mesh.castShadow=true;
  bone.add(mesh);
  owned.push(mesh);geos.push(combined);
 }
 return {
  attached:classified,clusters:owned.length,skinsUntouched:true,
  dispose(){
   for(const mesh of owned)mesh.parent?.remove(mesh);
   geos.forEach(g=>g.dispose());material.dispose();
  }
 };
}
