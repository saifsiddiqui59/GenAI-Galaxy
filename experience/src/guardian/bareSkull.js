/* Rig-preserving skeletal anatomy pass on the verified KayKit Skeleton_Mage.glb.
 * Deliberately no wizard robe, hood, cape, rounded toy boots or gauntlets.
 * Bone segments are children of the original 41-bone rig, so all 95 clips and
 * real right-palm IK work without writing new animation data.
 */
export const BARE_SKULL_PROFILE=Object.freeze({
 ribs:6,bone:'#778187',shadow:'#3a4650',sternum:'#8c9697',
 hiddenMeshes:Object.freeze(['Skeleton_Mage_Hat','Skeleton_Mage_Body','Skeleton_Mage_ArmLeft','Skeleton_Mage_ArmRight','Skeleton_Mage_LegLeft','Skeleton_Mage_LegRight'])
});
export function attachBareSkullTorso(source,THREE){
 const chest=source.getObjectByName('chest');
 if(!chest?.isBone)return ()=>{};
 const hidden=BARE_SKULL_PROFILE.hiddenMeshes
  .map(name=>source.getObjectByName(name)).filter(Boolean);
 const visibility=hidden.map(mesh=>mesh.visible);
 hidden.forEach(mesh=>{mesh.visible=false});
 const attached=[];
 const boneMat=new THREE.MeshStandardMaterial({color:BARE_SKULL_PROFILE.bone,roughness:.94,metalness:0});
 const shadowMat=new THREE.MeshStandardMaterial({color:BARE_SKULL_PROFILE.shadow,roughness:.96,metalness:0});
 const sternumMat=new THREE.MeshStandardMaterial({color:BARE_SKULL_PROFILE.sternum,roughness:.94,metalness:0});
 const add=(parent,mesh)=>{
  if(!parent)return;
  parent.add(mesh);attached.push([parent,mesh]);mesh.castShadow=true;
 };
 function pipe(parent,points,radius,material,name){
  const path=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,20,radius,7,false),material);
  mesh.name=name||'AnimatedAnatomicalBone';add(parent,mesh);
 }
 // Deliberate rib separation and a dark visible cavity in place of a painted body.
 const torso=new THREE.Group();torso.name='SkullMasterBareRibCage';chest.add(torso);attached.push([chest,torso]);
 for(let i=0;i<BARE_SKULL_PROFILE.ribs;i++){
  const y=.29-i*.105,span=.30+(i===0?-.055:i===5?-.035:0);
  for(const side of [-1,1]){
   pipe(torso,[[side*.045,y,.39],[side*.16,y+.03,.40],
    [side*span,y,.24],[side*(span+.02),y-.035,.08],
    [side*(span-.05),y-.065,-.10]],.012,i%3===0?sternumMat:boneMat,'SkullMasterRib');
  }
 }
 pipe(torso,[[0,.37,.35],[0,.16,.40],[0,-.12,.41],[0,-.37,.34]],.034,sternumMat,'SkullMasterSternum');
 for(const side of [-1,1]){
  pipe(torso,[[0,.37,.38],[side*.19,.40,.33],[side*.41,.32,.13]],.028,boneMat,'SkullMasterClavicle');
 }
 pipe(torso,[[0,.38,-.14],[0,.1,-.18],[0,-.26,-.18]],.038,shadowMat,'SkullMasterSpine');
 // Replace oversized KayKit boots/limb sleeves with sculpted humerus, radius,
 // femur and tibia segments parented directly to their animated bones.
 function segment(parentName,childName,startRadius,endRadius,label){
  const parent=source.getObjectByName(parentName),child=source.getObjectByName(childName);
  if(!parent?.isBone||!child?.isBone||child.parent!==parent)return false;
  const direction=child.position.clone(),length=direction.length();
  if(!Number.isFinite(length)||length<.025)return false;
  const geometry=new THREE.CylinderGeometry(endRadius,startRadius,length,10,2);
  const mesh=new THREE.Mesh(geometry,boneMat);
  mesh.name=label;
  mesh.position.copy(direction).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  add(parent,mesh);
  const joint=new THREE.Mesh(new THREE.IcosahedronGeometry(startRadius*1.06,1),sternumMat);
  joint.name='SkullMasterJoint';add(parent,joint);
  return true;
 }
 for(const side of ['l','r']){
  segment('upperarm.'+side,'lowerarm.'+side,.039,.031,'SkullMasterHumerus');
  segment('lowerarm.'+side,'wrist.'+side,.031,.025,'SkullMasterRadiusUlna');
  segment('wrist.'+side,'hand.'+side,.027,.035,'SkullMasterWrist');
  segment('upperleg.'+side,'lowerleg.'+side,.056,.046,'SkullMasterFemur');
  segment('lowerleg.'+side,'foot.'+side,.047,.029,'SkullMasterTibia');
  segment('foot.'+side,'toes.'+side,.030,.022,'SkullMasterFoot');
  const hand=source.getObjectByName('hand.'+side);
  if(hand?.isBone){
   const palm=new THREE.Mesh(new THREE.DodecahedronGeometry(.064,1),boneMat);
   palm.name='SkullMasterPalm';palm.scale.set(.85,1.16,.55);
   palm.position.y=.052;add(hand,palm);
   for(let i=0;i<4;i++){
    const x=(i-1.5)*.028;
    pipe(hand,[[x,.07,.022],[x*1.17,.135,.025],[x*1.24,.176-(i===3?.022:0),.024]],
     .010,sternumMat,'SkullMasterFinger');
   }
  }
 }
 // Keep one tiny occult glow INSIDE the sternum cavity, not a jacket ornament.
 const glow=new THREE.PointLight('#dc6327',.12,1.0);
 glow.position.set(0,.0,.21);add(torso,glow);
 return ()=>{
  hidden.forEach((mesh,i)=>{mesh.visible=visibility[i]});
  for(const [parent,obj] of attached.reverse()){
   parent.remove(obj);
   if(obj.isMesh)obj.geometry?.dispose();
   if(obj.isLight)obj.dispose?.();
  }
  boneMat.dispose();shadowMat.dispose();sternumMat.dispose();
 };
}
