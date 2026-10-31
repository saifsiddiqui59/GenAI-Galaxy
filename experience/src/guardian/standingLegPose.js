/* Build a grounded, full-length neutral stance on the ORIGINAL KayKit bones.
 * The imported animation's idle/rest rotations fold the knees high under the
 * torso. Align the actual hip->knee->ankle chains before adding bounded gait.
 * No remeshing, new rig, geometry distortion or synthetic hand positions.
 */
const canonical=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
// Lengthen original bone offsets, NOT visual mesh scales, so new femur and
// tibia geometry generated from the rig continues to bridge hip/knee/ankle.
export function lengthenSkeletonLegs(source,factor=1.55){
 if(!Number.isFinite(factor)||factor<1||factor>1.72)throw Error('Unsafe leg proportion factor');
 const bones=[];source.traverse(n=>{if(n.isBone)bones.push(n)});
 let corrected=0;
 for(const joint of bones){
  const name=canonical(joint.name);
  if(/^upperleg[lr]$/.test(name))joint.position.x*=1.33;
  if(/^(lowerleg|foot)[lr]$/.test(name)){
   joint.position.multiplyScalar(factor);corrected++;
  }
 }
 if(corrected!==4)throw Error('Both source leg chains required for anatomical proportion fix');
 source.updateMatrixWorld(true);
 return {corrected,factor};
}
export function straightenSkeletonLegs(source,THREE){
 const bones=new Map();source.traverse(n=>{if(n.isBone)bones.set(canonical(n.name),n)});
 const v=()=>new THREE.Vector3();
 let corrected=0;
 const orient=(parentName,childName,target)=>{
  const bone=bones.get(canonical(parentName)),child=bones.get(canonical(childName));
  if(!bone?.isBone||!child?.isBone||child.parent!==bone)
   throw Error('Missing standing bone chain '+parentName+' -> '+childName);
  source.updateWorldMatrix(true,true);
  const from=bone.getWorldPosition(v()),to=child.getWorldPosition(v());
  const dir=to.sub(from);
  if(dir.length()<.02)throw Error('Zero-length standing bone '+parentName);
  const worldDelta=new THREE.Quaternion().setFromUnitVectors(dir.normalize(),target.clone().normalize());
  const parentWorld=bone.parent.getWorldQuaternion(new THREE.Quaternion());
  const localDelta=parentWorld.clone().invert().multiply(worldDelta).multiply(parentWorld);
  bone.quaternion.premultiply(localDelta).normalize();
  corrected++;
 };
 for(const side of ['l','r']){
  orient('upperleg.'+side,'lowerleg.'+side,new THREE.Vector3(0,-1,0));
  orient('lowerleg.'+side,'foot.'+side,new THREE.Vector3(0,-1,0));
  // Keep toes pointing towards the camera rather than folded under a shin.
  if(bones.get('toes'+side)?.parent===bones.get('foot'+side)){
   orient('foot.'+side,'toes.'+side,new THREE.Vector3(0,-.20,1));
  }
 }
 source.updateWorldMatrix(true,true);
 return {corrected,extended:true};
}
