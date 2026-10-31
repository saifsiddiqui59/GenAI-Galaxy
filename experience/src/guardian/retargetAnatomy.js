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
import {attachRiggedSkeletalArms} from './riggedSkeletalArms.js';
import {attachRiggedSkeletalLegs} from './riggedSkeletalLegs.js';

export const ANATOMY_ASSET='models/cc0/InnersceneAnatomicalSkeleton.glb';
export const ANATOMY_SHA256='e52d1b23cf15b574885846a7da30354defc0a3a51b679ded6cbc7c0c1965d996';
export const ANATOMY_MODE=import.meta.env?.VITE_GALAXY_ANATOMY==='1';
// Isolated V6.11 art experiment: use the detailed CC0 femur/shin/foot/hand
// meshes instead of stylized rods. Keep disabled outside isolated art QA.
export const ANATOMY_LIMBS_MODE=import.meta.env?.VITE_GALAXY_NATIVE_ANATOMICAL_LIMBS==='1';

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
 name=String(name).replace(/_/g,' '); // GLTFLoader normalizes glTF node whitespace
 if(/cranium|mandible|tooth/i.test(name))return null; // existing anatomical skull is more detailed
 const side=centerX>=0?0:1; // CC0 source +X corresponds to KayKit .l
 const pick=(region)=>({region,bone:bonesByRegion[region][side]||bonesByRegion[region][0]});
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
  case 'upperArm':return {source:[sign*.21,1.40,0],scale:1.13,angle:sign*Math.PI/2};
  case 'lowerArm':return {source:[sign*.26,1.105,0],scale:1.16,angle:sign*Math.PI/2};
  case 'hand':return {source:[sign*.28,.865,0],scale:1.09,angle:sign*Math.PI/2};
  case 'upperLeg':return {source:[sign*.122,.86,0],scale:.83,angle:0};
  case 'lowerLeg':return {source:[sign*.113,.48,0],scale:.66,angle:0};
  case 'foot':return {source:[sign*.114,.14,0],scale:1.04,angle:0};
  case 'hips':return {source:[0,.93,0],scale:1.28,angle:0};
  case 'spine':return {source:[0,1.09,0],scale:1.48,angle:0};
  case 'neck':return {source:[0,1.47,0],scale:1.04,angle:0};
  default:return {source:[0,1.30,0],scale:1.28,angle:0};
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
// A V6 apparition is a floating spectral entity, not a human puppet whose
// source KayKit idle clip happens to cross its knees. These smoky wisps are
// energy, not a cloak, robe, hood, cylindrical pot or solid platform.
export function attachSpectralLowerBody(source,THREE){
 const hips=source.getObjectByName('hips');
 if(!hips?.isBone)throw Error('Cannot place spectral tail without real hips bone');
 const group=new THREE.Group();
 group.name='SkullMasterSpectralVapor';hips.add(group);
 const meshes=[],materials=[],geometries=[];
 for(let layer=0;layer<3;layer++){
  const sides=36,rings=28,positions=[],uvs=[],indices=[];
  const offset=layer*Math.PI*.667;
  for(let j=0;j<=rings;j++){
   const t=j/rings,spread=Math.pow(1-t,.65);
   const radius=(.20+layer*.043)*spread+.015;
   for(let i=0;i<=sides;i++){
    const angle=i/sides*Math.PI*2;
    const billow=Math.sin(angle*3+7*t+offset)*.048*t;
    positions.push(Math.cos(angle)*(radius+billow)+Math.sin(t*7+offset)*.05*t,
      -.05-1.27*t,Math.sin(angle)*(radius+billow)+Math.cos(t*6+offset)*.03*t);
    uvs.push(i/sides,t);
   }
  }
  for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){
   const a=j*(sides+1)+i,b=a+sides+1;
   indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.computeVertexNormals();
  const mat=new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,side:THREE.DoubleSide,
   blending:THREE.NormalBlending,
   uniforms:{uTime:{value:0},uLayer:{value:layer}},
   vertexShader:`
    varying vec2 vUv; varying vec3 vPos;
    uniform float uTime; uniform float uLayer;
    void main(){
      vUv=uv; vec3 p=position;
      float t=uv.y;
      p.x+=sin(t*8.0+uTime*.45+uLayer*2.1)*.047*t;
      p.z+=cos(t*6.0+uTime*.35+uLayer*3.3)*.037*t;
      vPos=p;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    }`,
   fragmentShader:`
    precision mediump float;
    varying vec2 vUv;varying vec3 vPos;
    uniform float uTime; uniform float uLayer;
    void main(){
      float t=vUv.y;
      float streak=.5+.5*sin(vUv.x*36.0+t*16.0-uTime*.52+uLayer*1.8);
      float flicker=.66+.34*sin(t*24.0+vUv.x*17.0+uTime*.65);
      float rim=.7+.3*sin(vUv.x*6.28318+uLayer*1.3);
      float fade=pow(max(0.0,1.0-t),1.15);
      float opacity=fade*(.46+.32*streak)*flicker*rim;
      vec3 ash=vec3(.18,.12,.28);
      vec3 violet=vec3(.48,.35,.65);
      gl_FragColor=vec4(mix(ash,violet,streak),opacity);
    }`
  });
  const mesh=new THREE.Mesh(geo,mat);
  mesh.name='SkullMasterSpectralWisp'+layer;
  mesh.frustumCulled=false;group.add(mesh);
  meshes.push(mesh);materials.push(mat);geometries.push(geo);
 }
 return {update(ms){materials.forEach(mat=>{mat.uniforms.uTime.value=Math.max(0,ms)/1000})},
  dispose(){hips.remove(group);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}};
}
export function attachAnatomicalSkeleton(source,anatomy,THREE,{nativeLimbs=ANATOMY_LIMBS_MODE}={}){
 // glTF animation PropertyBinding sanitizes dots, spaces and punctuation in
 // bone IDs. Match *only real bones* using the same canonicalization as IK.
 const normalize=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const realBones=new Map();
 source.traverse(node=>{if(node.isBone)realBones.set(normalize(node.name),node)});
 const getBone=name=>realBones.get(normalize(name));
 if(!source||!anatomy)throw Error('Missing animated rig or anatomical geometry');
 source.updateMatrixWorld(true);
 anatomy.updateMatrixWorld(true);
 const invRoot=source.matrixWorld.clone().invert();
 const mergedParts=new Map(),owned=[],geos=[];
 let classified=0,missed=0;const missing=[],skipped=[];
 const center=new THREE.Vector3(),bounds=new THREE.Box3();
 anatomy.traverse(o=>{
  if(!o.isMesh||!o.geometry)return;
  o.updateWorldMatrix(true,false);
  bounds.setFromObject(o);bounds.getCenter(center);
  const kind=classifyAnatomicalPart(o.name,center.x);
  if(!kind){skipped.push(o.name);return;} // original CC0 detailed skull remains
  const bone=getBone(kind.bone);
  if(!bone?.isBone){missed++;missing.push(o.name+'=>'+String(kind.bone));return}
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
  if(!geom.getAttribute('normal'))geom.computeVertexNormals();
  if(!mergedParts.has(kind.bone))mergedParts.set(kind.bone,[]);
  mergedParts.get(kind.bone).push(geom);
  classified++;
 });
 if(classified<100||missed)throw Error('Incomplete anatomical rigging: '+classified+' assigned, '+missed+' unmatched; missing '+JSON.stringify(missing.slice(0,30))+' skipped '+JSON.stringify(skipped.slice(0,30)));
 // Dark, desaturated anatomical torso is necessary for a mature Skull Master.
  // Bright ivory ribs made the actual 1440px and 390px renders read as a toy.
  // The detailed CC0 skull remains separately lit to preserve facial contrast.
  const material=new THREE.MeshStandardMaterial({color:'#686b77',roughness:.96,metalness:.025});
 for(const [name,parts] of mergedParts){
  const bone=getBone(name);
  const combined=mergeGeometries(parts,false);
  parts.forEach(g=>g.dispose());
  if(!combined)throw Error('Could not merge anatomical bones at '+name);
  const mesh=new THREE.Mesh(combined,material);
  mesh.name='SkullMasterAnatomy_'+name;
  // Keep original unskinned arm and leg clusters hidden: they cross at the
  // knees in motion. The connected KayKit rig gains independently articulated
  // anatomical legs and arms below; retain the authentic pelvis/rib cage.
  const limb=/^(upperleg|lowerleg|foot|upperarm|lowerarm|hand)/i.test(name);
  const replaced=limb&&!nativeLimbs;
  mesh.visible=!replaced;
  mesh.userData.replacedByRiggedBones=replaced;
  mesh.userData.nativeAnatomicalLimb=limb&&nativeLimbs;
  mesh.castShadow=!replaced;
  bone.add(mesh);
  owned.push(mesh);geos.push(combined);
 }
 // No vapor cone obscuring the thighs: the owner requested visible feet,
 // knees and natural upper-body motion on the *original* anatomical bones.
 const arms=nativeLimbs?null:attachRiggedSkeletalArms(source,THREE);
 const legs=nativeLimbs?null:attachRiggedSkeletalLegs(source,THREE);
 return {
  attached:classified,clusters:owned.length,skinsUntouched:true,spectralActive:false,articulatedArms:true,articulatedLegs:true,nativeLimbs,
  update:()=>{},
  dispose(){
   legs?.dispose();arms?.dispose();
   for(const mesh of owned)mesh.parent?.remove(mesh);
   geos.forEach(g=>g.dispose());material.dispose();
  }
 };
}
