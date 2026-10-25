/* Experimental Skull Master sculpt over the ORIGINAL KayKit 41-bone / 95-clip
 * skeleton. Only replaces display meshes for the head; never touches animation
 * tracks, palette provenance, hand IK, collision points or world navigation.
 */
export const FACE_PROFILE=Object.freeze({headRadius:.36,eyeSpacing:.165,eyeSize:.042});
function add(parent,geometry,material,at,scale,THREE){
 const object=new THREE.Mesh(geometry,material);
 if(at)object.position.set(...at);
 if(scale)object.scale.set(...scale);
 object.castShadow=true;object.receiveShadow=true;
 parent.add(object);return object;
}
function line(THREE,points,color,radius){
 const path=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
 return new THREE.Mesh(new THREE.TubeGeometry(path,18,radius,6,false),
  new THREE.MeshStandardMaterial({color,roughness:.74,metalness:.08}));
}
export function attachSculptedSkull(source,THREE){
 const head=source.getObjectByName('head');
 const originalNames=['Skeleton_Mage_Skull','Skeleton_Mage_Jaw','Skeleton_Mage_Eyes'];
 if(!head?.isBone)return ()=>{};
 const originals=originalNames.map(name=>source.getObjectByName(name)).filter(Boolean);
 const visibility=originals.map(x=>x.visible);
 originals.forEach(x=>{x.visible=false});
 const face=new THREE.Group();face.name='SkullMasterSculptedFace';
 head.add(face);
 const skull=new THREE.MeshStandardMaterial({color:'#70869f',roughness:.78,metalness:.035,flatShading:false});
 const cheek=new THREE.MeshStandardMaterial({color:'#52667c',roughness:.81,metalness:.03});
 const shadow=new THREE.MeshBasicMaterial({color:'#101423'});
 const lit=new THREE.MeshStandardMaterial({color:'#ffb54b',emissive:'#ff700c',emissiveIntensity:2.6,roughness:.23});
 // Rounded but tapered cranial vault. Deeper, smaller jaw suppresses toy shape.
 add(face,new THREE.SphereGeometry(FACE_PROFILE.headRadius,40,28),skull,[0,.19,-.015],[1.04,1.08,.84],THREE);
 add(face,new THREE.IcosahedronGeometry(.22,1),cheek,[0,-.125,.13],[1.15,.42,.87],THREE);
 // Deep socket recesses; pupils are inset rather than painted on skull's flat face.
 for(const side of [-1,1]){
  add(face,new THREE.SphereGeometry(.115,24,16),shadow,[side*FACE_PROFILE.eyeSpacing,.155,.292],[1.03,.78,.33],THREE);
  add(face,new THREE.SphereGeometry(FACE_PROFILE.eyeSize,20,12),lit,[side*FACE_PROFILE.eyeSpacing,.154,.329],[1,.80,.70],THREE);
  const brow=line(THREE,[[side*.060,.273,.302],[side*.155,.290,.296],[side*.25,.257,.263]],'#45576d',.025);
  face.add(brow);
  const bone=add(face,new THREE.IcosahedronGeometry(.12,1),skull,[side*.245,-.048,.16],[.86,.45,1.0],THREE);
  bone.rotation.z=side*.37;
  const crack=line(THREE,[[side*.24,-.045,.255],[side*.175,-.079,.300],[side*.14,-.12,.305]],'#2d394c',.009);
  face.add(crack);
 }
 // Dark nasal cavity and angular lower jaw with separate shadowed tooth row.
 const nose=add(face,new THREE.ConeGeometry(.051,.080,3),shadow,[0,.012,.340],[1,.9,.6],THREE);
 nose.rotation.z=Math.PI;
 const teethMaterial=new THREE.MeshStandardMaterial({color:'#a7b7c2',roughness:.75});
 for(let k=0;k<6;k++){
  const x=(k-2.5)*.062;
  add(face,new THREE.BoxGeometry(.040,.064,.036),teethMaterial,[x,-.183,.29],[1,k===0||k===5?.65:1,1],THREE);
 }
 // Collar-to-chin detail stays anchored to head bone throughout the walking clip.
 return ()=>{
  head.remove(face);
  face.traverse(mesh=>{
   if(mesh.isMesh){
    mesh.geometry?.dispose();
    // Mesh materials may be reused by siblings: distinct Set handled below.
   }
  });
  const materials=new Set();
  face.traverse(mesh=>{if(mesh.isMesh&&mesh.material)materials.add(mesh.material)});
  for(const material of materials)material.dispose();
  originals.forEach((object,i)=>{object.visible=visibility[i]});
 };
}
