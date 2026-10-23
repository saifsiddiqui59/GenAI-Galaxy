import * as THREE from 'three';
// Quaternius Skeleton.fbx uses the '.001' leg-named chains for its two arms.
// IK operates on the original rig; no fake floating hand geometry is created.
const normalized=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function identifyArmChains(root){
 const byName=new Map();
 root.traverse(o=>{if(o.isBone)byName.set(normalized(o.name),o)});
 const chain=side=>{
  const prefix=side==='left'?'l':'r';
  const upper=byName.get(prefix+'upperleg001');
  const fore=byName.get(prefix+'downleg001');
  const wrist=byName.get(prefix+'downleg001end');
  return upper&&fore&&wrist&&fore.parent===upper&&wrist.parent===fore?[upper,fore,wrist]:null;
 };
 return {left:chain('left'),right:chain('right')};
}
export function moveWrist(chain,target,iterations=6){
 if(!chain||!target)return Infinity;
 const [upper,fore,wrist]=chain;
 for(let i=0;i<iterations;i++){
  for(const joint of [fore,upper]){
   joint.updateWorldMatrix(true,true);
   const origin=joint.getWorldPosition(new THREE.Vector3());
   const from=wrist.getWorldPosition(new THREE.Vector3()).sub(origin);
   const to=target.clone().sub(origin);
   if(from.lengthSq()<1e-8||to.lengthSq()<1e-8)continue;
   from.normalize();to.normalize();
   const axis=new THREE.Vector3().crossVectors(from,to);
   const magnitude=axis.length();
   if(magnitude<1e-7)continue;
   axis.divideScalar(magnitude);
   const theta=Math.min(.24,Math.atan2(magnitude,THREE.MathUtils.clamp(from.dot(to),-1,1)));
   const deltaWorld=new THREE.Quaternion().setFromAxisAngle(axis,theta);
   const parentWorld=joint.parent.getWorldQuaternion(new THREE.Quaternion());
   const deltaLocal=parentWorld.clone().invert().multiply(deltaWorld).multiply(parentWorld);
   joint.quaternion.premultiply(deltaLocal).normalize();
   joint.updateWorldMatrix(true,true);
  }
 }
 return wrist.getWorldPosition(new THREE.Vector3()).distanceTo(target);
}
export function poseTwoHandOffering(chains,hips,iterations=5){
 if(!chains?.left||!chains?.right||!hips)return null;
 const centre=hips.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.79,.55));
 const left=centre.clone().add(new THREE.Vector3(-.28,-.08,.03));
 const right=centre.clone().add(new THREE.Vector3(.28,-.08,.03));
 const errorLeft=moveWrist(chains.left,left,iterations);
 const errorRight=moveWrist(chains.right,right,iterations);
 return {centre,errorLeft,errorRight};
}
