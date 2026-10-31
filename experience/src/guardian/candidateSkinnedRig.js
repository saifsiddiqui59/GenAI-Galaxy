// Experimental adapter for a real skinned Mixamo-style rig, NOT a V6.11 art switch.
// Never detach skinned meshes or substitute the rejected 322-piece anatomy.
import * as THREE from 'three';
import {moveWrist} from './handIK.js';
import {walkingFootTarget} from './footPlantIK.js';

const key=name=>String(name??'').toLowerCase().replace(/^mixamorig:?/,'').replace(/[^a-z0-9]/g,'');
function requireChain(bones,names){
 const chain=names.map(name=>bones.get(name));
 if(chain.some(x=>!x?.isBone))throw Error('Missing skinned rig joint: '+names.join(' → '));
 for(let i=1;i<chain.length;i++)if(chain[i].parent!==chain[i-1])
  throw Error('Disconnected skinned rig chain: '+names.join(' → '));
 return chain;
}
export function mapSkinnedMixamoRig(root){
 const bones=new Map();
 root?.traverse?.(node=>{if(node.isBone)bones.set(key(node.name),node)});
 const hips=bones.get('hips'),head=bones.get('head');
 if(!hips?.isBone||!head?.isBone)throw Error('Missing hips/head in skinned adult rig');
 const sides={};
 for(const side of ['left','right']){
  sides[side]={
   arm:requireChain(bones,[side+'arm',side+'forearm',side+'hand']),
   leg:requireChain(bones,[side+'upleg',side+'leg',side+'foot']),
   toe:bones.get(side+'toebase')??null
  };
 }
 if(sides.left.arm[2]===sides.right.arm[2]||sides.left.leg[2]===sides.right.leg[2])
  throw Error('Left and right limbs must be distinct');
 return {hips,head,sides,boneCount:bones.size};
}
function rotateWorld(bone,from,to){
 if(from.lengthSq()<1e-12||to.lengthSq()<1e-12)return;
 const delta=new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
 const parentWorld=bone.parent.getWorldQuaternion(new THREE.Quaternion());
 const local=parentWorld.clone().invert().multiply(delta).multiply(parentWorld);
 bone.quaternion.premultiply(local).normalize();
 bone.updateWorldMatrix(true,true);
}
// Two-bone analytic target with a pole constraint: preserve the authored skin,
// keep knees on the correct side and never stretch shin/femur to reach the path.
export function solvePoleConstrainedLeg(chain,targetWorld,poleWorld,{iterations=3}={}){
 if(!chain||chain.length!==3||chain.some(x=>!x?.isBone))throw Error('Requires thigh → shin → foot bones');
 const [hip,knee,ankle]=chain;
 if(knee.parent!==hip||ankle.parent!==knee)throw Error('Disconnected leg chain');
 const target=targetWorld.clone(),pole=poleWorld.clone();
 hip.updateWorldMatrix(true,true);
 const a=hip.getWorldPosition(new THREE.Vector3()),b=knee.getWorldPosition(new THREE.Vector3()),c=ankle.getWorldPosition(new THREE.Vector3());
 const upper=a.distanceTo(b),lower=b.distanceTo(c),requested=a.distanceTo(target);
 if(upper<1e-5||lower<1e-5)throw Error('Zero-length bone in skinned rig');
 const reachable=requested<upper+lower-1e-4&&requested>Math.abs(upper-lower)+1e-4;
 const direction=target.clone().sub(a).normalize();
 const reach=THREE.MathUtils.clamp(requested,Math.abs(upper-lower)+1e-4,upper+lower-1e-4);
 const targetClamped=a.clone().addScaledVector(direction,reach);
 const along=(upper*upper+reach*reach-lower*lower)/(2*reach);
 const bend=Math.sqrt(Math.max(0,upper*upper-along*along));
 let sideways=pole.clone().sub(a).addScaledVector(direction,-pole.clone().sub(a).dot(direction));
 if(sideways.lengthSq()<1e-8)throw Error('Pole vector parallel to leg target');
 sideways.normalize();
 const desiredKnee=a.clone().addScaledVector(direction,along).addScaledVector(sideways,bend);
 for(let i=0;i<iterations;i++){
  hip.updateWorldMatrix(true,true);
  const h=hip.getWorldPosition(new THREE.Vector3()),k=knee.getWorldPosition(new THREE.Vector3());
  rotateWorld(hip,k.clone().sub(h),desiredKnee.clone().sub(h));
  knee.updateWorldMatrix(true,true);
  const kn=knee.getWorldPosition(new THREE.Vector3()),foot=ankle.getWorldPosition(new THREE.Vector3());
  rotateWorld(knee,foot.clone().sub(kn),targetClamped.clone().sub(kn));
 }
 const actual=ankle.getWorldPosition(new THREE.Vector3());
 return {error:actual.distanceTo(target),reachable,requested,upper,lower,
  knee:knee.getWorldPosition(new THREE.Vector3()),foot:actual};
}
export function reachWithSkinnedHand(rig,side,targetWorld){
 const chain=rig.sides?.[side]?.arm;
 if(!chain)throw Error('Missing skinned hand chain '+side);
 return moveWrist(chain,targetWorld,12);
}
// The moving orbital route supplies a stable WORLD-space landing point;
// return metrics rather than declaring planted feet from a green unit test.
export function prototypeSkinnedStance(rig,side,pose,{compact=false,scale=1,floorOffset=0,poleWorld}={}){
 const landing=walkingFootTarget(pose,side,compact,scale,floorOffset);
 if(!landing||landing.weight<=0)return {applied:false,landing};
 if(!poleWorld)throw Error('A world-space knee pole is mandatory');
 const chain=rig.sides?.[side]?.leg;
 if(!chain)throw Error('Missing skinned leg chain '+side);
 const before=chain.slice(0,2).map(b=>b.quaternion.clone());
 const result=solvePoleConstrainedLeg(chain,new THREE.Vector3(landing.x,landing.y,landing.z),poleWorld);
 for(let i=0;i<2;i++)chain[i].quaternion.copy(before[i].slerp(chain[i].quaternion,landing.weight));
 chain[0].updateWorldMatrix(true,true);
 const foot=chain[2].getWorldPosition(new THREE.Vector3());
 return {applied:true,landing,reachable:result.reachable,
  error:foot.distanceTo(new THREE.Vector3(landing.x,landing.y,landing.z)),
  knee:chain[1].getWorldPosition(new THREE.Vector3())};
}
