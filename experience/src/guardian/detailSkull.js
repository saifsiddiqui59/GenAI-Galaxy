/* CC0 anatomical skull attached to the *existing* KayKit head bone.
 * We retain every original clip, 41-bone rig, hand IK and satchel pose.
 * The replacement is a real textured/meshed skull, not a procedural cartoon head.
 */
import * as THREE from 'three';

export const SKULL_ASSET='models/cc0/ScatteringSkull.glb';
export const SKULL_SOURCE='KhronosGroup/glTF-Sample-Assets/ScatteringSkull@8f492390ddc7a2ae221a1369ef560589cf8c70fb';
export const SKULL_LICENSE='CC0-1.0';
const REPLACED=['Skeleton_Mage_Skull','Skeleton_Mage_Jaw','Skeleton_Mage_Eyes'];
const MIN_SIZE=.01;

export function normalizedSkullTransform(bounds,options={}){
 const {targetHeight=.68,forward=.065,vertical=.20}=options;
 const {min,max}=bounds;
 const size={x:max.x-min.x,y:max.y-min.y,z:max.z-min.z};
 if(!Object.values(size).every(Number.isFinite) || Math.max(...Object.values(size))<MIN_SIZE)
  throw new Error('Detailed skull has no usable size');
 const scale=targetHeight/Math.max(size.x*1.12,size.y,size.z*1.18);
 const center={x:(max.x+min.x)*.5,y:(max.y+min.y)*.5,z:(max.z+min.z)*.5};
 return {scale,position:[-center.x*scale,vertical-center.y*scale,forward-center.z*scale]};
}

export function mountDetailedSkull(rig,skullSource,options={}){
 const head=rig?.getObjectByName('head');
 if(!head?.isBone||!skullSource)return {active:false,dispose:()=>{}};
 const original=REPLACED.map(name=>rig.getObjectByName(name)).filter(Boolean);
 if(original.length!==3)return {active:false,dispose:()=>{}};
 const model=skullSource.clone(true);
 model.name='SkullMasterCC0RealisticHead';
 model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model);
 const tr=normalizedSkullTransform({
   min:{x:bounds.min.x,y:bounds.min.y,z:bounds.min.z},
   max:{x:bounds.max.x,y:bounds.max.y,z:bounds.max.z}
 },options);
 const owned=[];
 model.traverse(o=>{
  if(!o.isMesh)return;
  // Convert the ScatteringSkull subsurface PBR into stable mobile-compatible
  // opaque grey-blue bone, preserving original texture/normal if present.
  const prior=o.material;
  const originalMaterial=Array.isArray(prior)?prior[0]:prior;
  const mat=new THREE.MeshStandardMaterial({
   color:'#9caebc',map:originalMaterial?.map||null,
   normalMap:originalMaterial?.normalMap||null,
   roughness:.86,metalness:.025,
   side:THREE.FrontSide
  });
  o.material=mat;owned.push(mat);
  o.castShadow=true;o.receiveShadow=true;
 });
 model.scale.setScalar(tr.scale);
 model.position.set(...tr.position);
 // GLB front axis is validated against screenshots; this is optional tuning.
 model.rotation.y=options.faceYaw??0;
 head.add(model);
 const originalVisibility=original.map(o=>o.visible);
 original.forEach(o=>{o.visible=false});
 // Emissive in-socket highlights will be calibrated to the actual GLB screen
 // review, never used to cover the geometry with oversized round pupils.
 const light=new THREE.PointLight('#ff6c1d',.43,1.1);
 light.position.set(0,.13,.30);light.name='SkullMasterEyeFill';
 head.add(light);
 return {
  active:true,model,source:SKULL_SOURCE,
  dispose:()=>{
   head.remove(model);head.remove(light);light.dispose?.();
   original.forEach((o,i)=>{o.visible=originalVisibility[i]});
   for(const material of owned)material.dispose();
  }
 };
}
