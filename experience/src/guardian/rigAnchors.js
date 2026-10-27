// Bone discovery is intentionally asset-agnostic and never fabricates a hand rig.
// Names are matched from the loaded Quaternius skeleton; unrecognized rigs fail closed.
const canonical = name => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const tokens = {
 left: [/left(?:hand|wrist|palm)/, /(?:hand|wrist|palm)left/, /^lefthand/, /mixamoriglefthand/, /handl$/, /wristl$/],
 right: [/right(?:hand|wrist|palm)/, /(?:hand|wrist|palm)right/, /^righthand/, /mixamorigrighthand/, /handr$/, /wristr$/],
 waist: [/pelvis/, /hips?$/, /spine0?$/, /rootpelvis/]
};
function rank(name, side) {
 const n=canonical(name);
 const index=tokens[side].findIndex(rx=>rx.test(n));
 return index<0 ? Infinity : index;
}
export function discoverRigAnchors(root) {
 const bones=[];
 root?.traverse?.(object=>{if(object.isBone)bones.push(object)});
 const choose=side=>bones.map(bone=>({bone,score:rank(bone.name,side)}))
   .filter(entry=>Number.isFinite(entry.score))
   .sort((a,b)=>a.score-b.score)[0]?.bone||null;
 const leftHand=choose('left'),rightHand=choose('right'),waist=choose('waist');
 return {
  leftHand,rightHand,waist,
  readyToOffer:Boolean(leftHand&&rightHand&&leftHand!==rightHand),
  readyForSatchel:Boolean(waist),
  detectedBones:bones.length
 };
}
// All positions are in world coordinates. This prevents assuming that bones,
// a normalized FBX root, and independent R3F groups share the same coordinate system.
export function gripMidpoint(anchors,Vector3) {
 if(!anchors?.readyToOffer)return null;
 const left=anchors.leftHand.getWorldPosition(new Vector3());
 const right=anchors.rightHand.getWorldPosition(new Vector3());
 if(![left.x,left.y,left.z,right.x,right.y,right.z].every(Number.isFinite))return null;
 return left.add(right).multiplyScalar(.5);
}
export function waistPosition(anchors,Vector3){
 if(!anchors?.readyForSatchel)return null;
 const p=anchors.waist.getWorldPosition(new Vector3());
 return [p.x,p.y,p.z].every(Number.isFinite)?p:null;
}
