/* CC0 anatomical skull attached to the *existing* KayKit head bone.
 * We retain every original clip, 41-bone rig, hand IK and satchel pose.
 * The replacement is a real textured/meshed skull, not a procedural cartoon head.
 */
import * as THREE from 'three';

export const SKULL_ASSET='models/cc0/ScatteringSkull.glb';
export const SKULL_SOURCE='KhronosGroup/glTF-Sample-Assets/ScatteringSkull@8f492390ddc7a2ae221a1369ef560589cf8c70fb';
export const SKULL_LICENSE='CC0-1.0';
// Deterministic vertex patina needs no image files, shaders or paid services.
// The CC0 anatomical model has positions/normals but no authored UVs.
export function weatheredBoneColor(x,y,z){
 const low=Math.sin(x*37.1+y*22.7+z*5.9)*.5+.5;
 const fine=Math.sin(x*112.3-z*58.9)*Math.sin(y*91.7+x*33.1);
 const shade=Math.max(.46,Math.min(1, .86+low*.14+fine*.075));
 return [shade,shade*.935,shade*.825];
}
export function weatherSkullGeometry(geometry,THREE){
 if(!geometry?.getAttribute('position'))return null;
 const clone=geometry.clone(),pos=clone.getAttribute('position');
 const colors=new Float32Array(pos.count*3);
 for(let i=0;i<pos.count;i++){
  const c=weatheredBoneColor(pos.getX(i),pos.getY(i),pos.getZ(i));
  colors[i*3]=c[0];colors[i*3+1]=c[1];colors[i*3+2]=c[2];
 }
 clone.setAttribute('color',new THREE.BufferAttribute(colors,3));
 return clone;
}
// Original KayKit eyes are oversized bright game-art circles. They are hidden
// with the toy skull/jaw and replaced with two small recessed slit embers.
const REPLACED=['Skeleton_Mage_Skull','Skeleton_Mage_Jaw','Skeleton_Mage_Eyes'];
const MIN_SIZE=.01;

export function normalizedSkullTransform(bounds,options={}){
 const {targetHeight=.98,forward=.14,vertical=.26}=options;
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
 const owned=[],ownedGeometries=[];
 model.traverse(o=>{
  if(!o.isMesh)return;
  // Stable vertex-painted aged bone instead of flat toy-blue plastic.
  // Geometry is a disposable clone; original licensed mesh stays untouched.
  const prior=o.material;
  const originalMaterial=Array.isArray(prior)?prior[0]:prior;
  const weathered=weatherSkullGeometry(o.geometry,THREE);
  if(weathered){o.geometry=weathered;ownedGeometries.push(weathered);}
  const mat=new THREE.MeshStandardMaterial({
   color:'#b5aa98',map:null,vertexColors:!!weathered,
   normalMap:originalMaterial?.normalMap||null,
   roughness:.98,metalness:0,
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
 // Actual hollows of the CC0 skull remain dark; a tiny deep-red slit is
 // suspended just within each socket. No large pupil spheres or orange ears.
 const sockets=new THREE.Group();sockets.name='SkullMasterRecessedEyes';head.add(sockets);
 const emberMat=new THREE.MeshBasicMaterial({color:'#db572a',toneMapped:false});
 const lowGlowMat=new THREE.MeshBasicMaterial({color:'#3b0c12',toneMapped:false});
 const embers=[];
 for(const side of [-1,1]){
  const root=new THREE.Group();
  root.position.set(side*.162,.347,.38);
  root.rotation.z=-side*.23; // angry brow: outer edge tilts slightly down
  const shadow=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),lowGlowMat);
  shadow.name='SkullMasterEyeSocketShadow';
  shadow.scale.set(.086,.051,.008);root.add(shadow);
  const slit=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),emberMat);
  slit.name='SkullMasterEyeEmber';
  slit.position.z=.012;slit.scale.set(.045,.014,.007);
  root.add(slit);sockets.add(root);embers.push(slit);
 }
 const light=new THREE.PointLight('#ff5c32',.12,.75);
 light.position.set(0,.34,.35);light.name='SkullMasterSubtleEyeFill';
 head.add(light);
 return {
  active:true,model,source:SKULL_SOURCE,
  dispose:()=>{
   head.remove(model);head.remove(light);head.remove(sockets);light.dispose?.();
   for(const ember of embers)ember.geometry.dispose();
   sockets.traverse(obj=>{if(obj.isMesh&&obj.name==='SkullMasterEyeSocketShadow')obj.geometry.dispose()});
   emberMat.dispose();lowGlowMat.dispose();
   original.forEach((o,i)=>{o.visible=originalVisibility[i]});
   for(const material of owned)material.dispose();
   for(const geometry of ownedGeometries)geometry.dispose();
  }
 };
}
