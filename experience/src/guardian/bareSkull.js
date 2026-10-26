/* Rig-preserving skeletal anatomy pass on the verified KayKit Skeleton_Mage.glb.
 * Deliberately no wizard robe, hood, cape, rounded toy boots or gauntlets.
 * Bone segments are children of the original 41-bone rig, so all 95 clips and
 * real right-palm IK work without writing new animation data.
 */
export const BARE_SKULL_PROFILE=Object.freeze({
 ribs:6,bone:'#c0b5a4',shadow:'#3a4650',sternum:'#d2c5b0',
 hiddenMeshes:Object.freeze(['Skeleton_Mage_Hat','Skeleton_Mage_Body','Skeleton_Mage_ArmLeft','Skeleton_Mage_ArmRight','Skeleton_Mage_LegLeft','Skeleton_Mage_LegRight'])
});
// Shaped bone shafts rather than smooth toy cylinders. The proximal and
// distal joints bulge, while the middle narrows like a real long bone.
export function anatomicalShaftGeometry(THREE,length,proximal,distal){
 if(![length,proximal,distal].every(Number.isFinite)||length<=0||proximal<=0||distal<=0)
  throw new Error('Invalid skeletal segment');
 const sections=18,profile=[];
 for(let i=0;i<=sections;i++){
  const t=i/sections,endpoint=Math.abs(2*t-1);
  const collar=.62+.38*Math.pow(endpoint,2.3);
  const radius=THREE.MathUtils.lerp(proximal,distal,t)*collar;
  profile.push(new THREE.Vector2(radius,(t-.5)*length));
 }
 return new THREE.LatheGeometry(profile,14);
}
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
  const y=.29-i*.108,span=.32-i*.020,front=.30-i*.027;
  for(const side of [-1,1]){
   // Ribs join the central cartilage and wrap beneath the shoulders into
   // the posterior spine. Drooping side arcs avoid the old ladder silhouette.
   pipe(torso,[[side*.065,y,front],
    [side*.145,y-.03,front+.034],
    [side*span*.84,y-.078,front-.018],
    [side*span,y-.093,.095],
    [side*span*.85,y-.041,-.08],
    [side*.105,y+.034,-.21]],.017,i%3===0?sternumMat:boneMat,'SkullMasterRib');
  }
 }
 pipe(torso,[[0,.38,.32],[0,.20,.36],[0,-.06,.34],[0,-.34,.22]],
  .033,sternumMat,'SkullMasterSternum');
 for(const side of [-1,1]){
  pipe(torso,[[0,.37,.38],[side*.19,.40,.33],[side*.41,.32,.13]],.028,boneMat,'SkullMasterClavicle');
 }
 pipe(torso,[[0,.38,-.14],[0,.1,-.18],[0,-.26,-.18]],.049,shadowMat,'SkullMasterSpine');
 // Exposed pelvis and serrated lower ribs, not a fabric waistband or plate.
 const hips=source.getObjectByName('hips');
 if(hips?.isBone){
  for(const sign of [-1,1]){
   pipe(hips,[[0,.22,.11],[sign*.20,.14,.13],
     [sign*.29,-.08,.045],[sign*.17,-.21,.015]],.045,boneMat,'SkullMasterIlium');
  }
  pipe(hips,[[0,.15,.12],[0,-.19,.13]],.04,sternumMat,'SkullMasterSacrum');
 }
 // Replace oversized KayKit boots/limb sleeves with sculpted humerus, radius,
 // femur and tibia segments parented directly to their animated bones.
 function segment(parentName,childName,startRadius,endRadius,label){
  const parent=source.getObjectByName(parentName),child=source.getObjectByName(childName);
  if(!parent?.isBone||!child?.isBone||child.parent!==parent)return false;
  const direction=child.position.clone(),length=direction.length();
  if(!Number.isFinite(length)||length<.025)return false;
  const geometry=anatomicalShaftGeometry(THREE,length,startRadius,endRadius);
  const mesh=new THREE.Mesh(geometry,boneMat);
  mesh.name=label;
  mesh.position.copy(direction).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  add(parent,mesh);
  const joint=new THREE.Mesh(new THREE.IcosahedronGeometry(startRadius*.86,2),sternumMat);
  joint.name='SkullMasterJoint';add(parent,joint);
  return true;
 }
 for(const side of ['l','r']){
  // The old KayKit glove and boot shells are genuinely hidden. Thicker real
  // articulated bone silhouettes are used instead; keep all bones/IK in place.
  segment('upperarm.'+side,'lowerarm.'+side,.087,.060,'SkullMasterHumerus');
  segment('lowerarm.'+side,'wrist.'+side,.060,.047,'SkullMasterRadiusUlna');
  segment('wrist.'+side,'hand.'+side,.047,.055,'SkullMasterWrist');
  segment('upperleg.'+side,'lowerleg.'+side,.109,.077,'SkullMasterFemur');
  segment('lowerleg.'+side,'foot.'+side,.075,.052,'SkullMasterTibia');
  segment('foot.'+side,'toes.'+side,.074,.043,'SkullMasterMetatarsal');
  const forearm=source.getObjectByName('lowerarm.'+side);
  const wrist=source.getObjectByName('wrist.'+side);
  if(forearm?.isBone&&wrist?.isBone&&wrist.parent===forearm){
   const v=wrist.position;
   pipe(forearm,[[.037,0,0],[.04,v.y*.48,0],[.027,v.y*.96,0]],
    .023,sternumMat,'SkullMasterUlna');
   pipe(forearm,[[-.037,0,0],[-.04,v.y*.48,0],[-.027,v.y*.96,0]],
    .023,boneMat,'SkullMasterRadius');
  }
  const foot=source.getObjectByName('foot.'+side);
  if(foot?.isBone){
   for(let i=-2;i<=2;i++){
    const spread=i*.045;
    pipe(foot,[[spread*.55,.015,.025],[spread,.12,.065],
      [spread*1.15,.19,.09]],.016,i===0?sternumMat:boneMat,'SkullMasterToe');
   }
  }
  const hand=source.getObjectByName('hand.'+side);
  if(hand?.isBone){
   const palm=new THREE.Mesh(new THREE.DodecahedronGeometry(.085,1),boneMat);
   palm.name='SkullMasterPalm';palm.scale.set(.85,1.16,.55);
   palm.position.y=.052;add(hand,palm);
   for(let i=0;i<4;i++){
    const x=(i-1.5)*.044;
    pipe(hand,[[x,.065,.035],[x*1.20,.155,.03],
      [x*1.28,.215-(i===3?.027:0),.027],[x*1.32,.245-(i===3?.035:0),.045]],
     .016,sternumMat,'SkullMasterLongClaw');
   }
   pipe(hand,[[-.10,.065,.04],[-.15,.095,.12],[-.19,.13,.155]],
     .018,boneMat,'SkullMasterThumb');
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
