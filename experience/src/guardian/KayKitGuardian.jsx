import React,{Suspense,useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {discoverRigAnchors,gripMidpoint} from './rigAnchors.js';
import {styleKayKit,STYLE_PROFILE} from './styleKayKit.js';
import {SKULLMASTER_PROFILE} from './skullMasterMantle.js';
import {guardianApproachAt} from '../journey/orbitalApproach.js';
import {orbitalPluckPose} from '../journey/orbitalPluckPose.js';
import {mountDetailedSkull,SKULL_ASSET} from './detailSkull.js';
import {ANATOMY_ASSET,ANATOMY_MODE,attachAnatomicalSkeleton} from './retargetAnatomy.js';
import {guardianStageScale,guardianFloorY} from './guardianFraming.js';
import {moveWrist} from './handIK.js';
import {articulatedHoverAt} from './articulatedHover.js';
import {entranceAt,pickupAt,smooth,CONTACT,RELEASE,COLLECT_START_MS,PER_WORLD_MS,OFFER_SETTLE_MS} from '../journey/choreography.js';
import {phaseAt} from '../journey/story.js';
const ASSET=import.meta.env.BASE_URL+'models/kaykit/Skeleton_Mage.glb';
const DETAIL_ASSET=import.meta.env.BASE_URL+SKULL_ASSET;
const BODY_ASSET=import.meta.env.BASE_URL+(ANATOMY_MODE?ANATOMY_ASSET:SKULL_ASSET);
const observed=()=>import.meta.env.DEV||new URLSearchParams(window.location.search).get('demo')==='1';
export function chooseKayKitAnimation(phase,names=[]){
 const preferred='Idle';
 return names.includes(preferred)?preferred:names.find(n=>/^Idle$/i.test(n))||names[0];
}
function armChain(hand){
 let node=hand,lower=null,upper=null;
 while(node?.isBone){
  const name=node.name.toLowerCase().replace(/[^a-z0-9]/g,'');
  if(name.startsWith('lowerarm'))lower=node;
  if(name.startsWith('upperarm')){upper=node;break}
  node=node.parent;
 }
 return upper&&lower&&hand?[upper,lower,hand]:null;
}
function solveBlended(chain,target,weight){
 if(!chain||!target)return Infinity;
 const before=chain.slice(0,2).map(b=>b.quaternion.clone());
 moveWrist(chain,target,12);
 chain.slice(0,2).forEach((b,i)=>b.quaternion.copy(before[i].slerp(b.quaternion,weight)));
 chain[0].updateWorldMatrix(true,true);
 return chain[2].getWorldPosition(new THREE.Vector3()).distanceTo(target);
}
function Model({rigPoseRef,clockRef,completedCount=0,worldIndexes=[],reducedMotion=false,onReady}){
 const {scene,animations}=useGLTF(ASSET);
 const {scene:anatomicalSkull}=useGLTF(DETAIL_ASSET);
 // The default build reuses the cached skull; only isolated V6 art preview
 // loads the verified 322-mesh anatomical model, packaged at build time.
 const {scene:anatomicalBody}=useGLTF(BODY_ASSET);
 const narrow=useThree(state=>state.size.width<700);
 const short=useThree(state=>state.size.height<780);
 const root=useRef(),lastIndex=useRef(-1),lastEpoch=useRef(-1),contactLocal=useRef(null);
 const source=useMemo(()=>{
  const object=clone(scene);object.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(object),height=box.getSize(new THREE.Vector3()).y;
  const factor=3.6/Math.max(.001,height);
  object.scale.setScalar(factor);
  object.position.set(-box.getCenter(new THREE.Vector3()).x*factor,-box.min.y*factor,-box.getCenter(new THREE.Vector3()).z*factor);
  object.userData.geometryHeight=height;
  object.userData.disposeStyle=styleKayKit(object,THREE,{anatomical:ANATOMY_MODE});
  const detailed=mountDetailedSkull(object,anatomicalSkull);
  if(!detailed.active)throw Error('CC0 detailed skull failed to attach: original rig is incompatible');
  object.userData.disposeDetail=detailed.dispose;
  if(ANATOMY_MODE){
   const anatomy=attachAnatomicalSkeleton(object,anatomicalBody,THREE);
   object.userData.disposeAnatomy=anatomy.dispose;
   object.userData.updateSpectral=anatomy.update;
   object.userData.spectralActive=anatomy.spectralActive;
   object.userData.articulatedArms=anatomy.articulatedArms;
   object.userData.articulatedLegs=anatomy.articulatedLegs;
   object.userData.anatomicalParts=anatomy.attached;
   object.userData.anatomicalClusters=anatomy.clusters;
  }
  return object;
 },[scene,anatomicalSkull,anatomicalBody]);
 const rig=useMemo(()=>discoverRigAnchors(source),[source]);
 // Capture the original rest joints before controlled procedural joint motion.
 // Never run floor-pickup clips: use real hips, thighs, knees, ankles and chest
 // joints for small upright hover strides while keeping the hand IK independent.
 const uprightBones=useMemo(()=>{
  const list=[];
  source.traverse(node=>{
   // glTFLoader normalizes separator characters in bone IDs; compare the same
   // canonical names used by the already-working IK / anatomical rig mapping.
   const key=String(node.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
   if(node.isBone&&/^(hips|spine|chest|upperleg[lr]|lowerleg[lr]|foot[lr])/.test(key)){
    list.push({bone:node,rest:node.quaternion.clone()});
   }
  });
  return list;
 },[source]);
 const jointMap=useMemo(()=>new Map(uprightBones.map(v=>[v.bone.name.toLowerCase().replace(/[^a-z0-9]/g,''),v])),[uprightBones]);
 const jointAxis=new THREE.Vector3(1,0,0),jointRollAxis=new THREE.Vector3(0,0,1);
 const jointRotation=new THREE.Quaternion();
 const arms=useMemo(()=>({left:armChain(rig.leftHand),right:armChain(rig.rightHand)}),[rig]);
 const mixer=useMemo(()=>new THREE.AnimationMixer(source),[source]);
 const actions=useMemo(()=>Object.fromEntries(animations.map(clip=>{
  const action=mixer.clipAction(clip);action.play();action.paused=true;action.setEffectiveWeight(0);
  return [clip.name,action];
 })),[animations,mixer]);
 useEffect(()=>{
  Object.values(actions).forEach(a=>a.play());
  onReady?.();
  if(observed()){
   const materials=[];let meshes=0;
   source.traverse(n=>{if(n.isMesh){meshes++;materials.push({name:n.material.name,map:!!n.material.map})}});
   window.__galaxySkeletonDiagnostics={asset:'KayKit CC0 Skeleton_Mage.glb',skullAsset:'Khronos ScatteringSkull CC0',styleProfile:STYLE_PROFILE,bones:rig.detectedBones,clips:animations.length,
    animationNames:animations.map(a=>a.name),meshes,materials,pickupLog:[],
    rig:{detectedBones:rig.detectedBones,canOffer:rig.readyToOffer,canCarry:rig.readyForSatchel},
    sourceDimensions:{height:source.userData.geometryHeight},
    toyEyesHidden:!source.getObjectByName('Skeleton_Mage_Eyes')?.visible,
    anatomyEnabled:ANATOMY_MODE,anatomicalParts:source.userData.anatomicalParts||0,
    anatomicalClusters:source.userData.anatomicalClusters||0,
    spectralActive:!!source.userData.spectralActive,
    articulatedArms:!!source.userData.articulatedArms,
    articulatedLegs:!!source.userData.articulatedLegs,
    visibleLegMeshes:(()=>{let n=0;source.traverse(o=>{if(o.isMesh&&o.visible&&/^SkullMaster(Femur|Tibia|Foot)_/.test(o.name))n++});return n})()};
  }
  return ()=>{mixer.stopAllAction();mixer.uncacheRoot(source);source.userData.disposeAnatomy?.();source.userData.disposeDetail?.();source.userData.disposeStyle?.()};
 },[source,rig,mixer,animations,onReady]);
 useFrame((state,dt)=>{
  if(!root.current)return;
  const c=clockRef.current,ms=c.ms,view=phaseAt(ms,completedCount,reducedMotion);
  source.userData.updateSpectral?.(ms);
  const compactScale=guardianStageScale(narrow,short),body=root.current;
  const entrance=entranceAt(reducedMotion?99999:ms,narrow);
  body.position.set(entrance.x,guardianFloorY(narrow,short),3.2);
  body.scale.setScalar(compactScale);
  const pickup=view.activeIndex>=0?pickupAt(ms,view.activeIndex):null;
  body.rotation.y=pickup?0:entrance.yaw;
  body.rotation.x=0;body.rotation.z=0;
  Object.values(actions).forEach(a=>a.setEffectiveWeight(0));
  function sample(name,time,weight){const a=actions[name];if(!a)return;a.enabled=true;a.time=Math.max(0,Math.min(a.getClip().duration-.00001,time));a.setEffectiveWeight(weight)}
  if(!contactLocal.current&&rig.rightHand){
   // Stage the miniature at the exact source clip's palm contact, not a guessed waypoint.
   // Interact reaches outward; PickUp bends to the feet and made orbital grabs look wrong.
   sample('Interact',.58,1);mixer.update(0);body.updateWorldMatrix(true,true);
   contactLocal.current=body.worldToLocal(rig.rightHand.localToWorld(new THREE.Vector3(0,.045,.035)));
   Object.values(actions).forEach(a=>a.setEffectiveWeight(0));
  }
  // The origin of every reach is the real orbiting sphere at the contact tick.
  // Shift the entire rig towards the orbital target. Never stage a dummy at its feet.
  const approach=guardianApproachAt(ms,worldIndexes,contactLocal.current,narrow,short,reducedMotion);
  body.position.set(approach.x,approach.y,approach.z);
  body.scale.setScalar(approach.scale);
  const walkWeight=Math.max(0,Math.min(1,approach.walkWeight||0));
  body.rotation.y=walkWeight>.08?(approach.yaw??entrance.yaw):(pickup?0:entrance.yaw);
  body.rotation.x=0;body.rotation.z=0;
  const pluck=pickup?orbitalPluckPose(pickup.t):null;
  // Drive the ACTUAL authored KayKit walking clip, including hip/knee/ankle
  // rotation and arm swing. Never sample the ground PickUp clip. The walk
  // weight eases to zero at every planet contact, protecting the hand IK.
  const walkingClip=actions['Walking_A']?.getClip();
  const walkTime=walkingClip?(ms*.001*1.35)%Math.max(.01,walkingClip.duration):0;
  sample('Idle',.14,1-walkWeight);
  if(walkingClip&&walkWeight>0)sample('Walking_A',walkTime,walkWeight);
  mixer.update(0);
  const animatedLegs=new Map();
  if(walkWeight>.001)for(const {bone} of uprightBones){
   const name=bone.name.toLowerCase().replace(/[^a-z0-9]/g,'');
   if(/^(upperleg|lowerleg|foot)[lr]/.test(name))animatedLegs.set(bone,bone.quaternion.clone());
  }
  // Keep the torso upright, but blend actual knee/foot clips into the real
  // articulated rig while walking. No frozen legs or rigid teleport effect.
  for(const {bone,rest} of uprightBones){
   bone.quaternion.copy(rest);
   const sampled=animatedLegs.get(bone);
   if(sampled)bone.quaternion.slerp(sampled,walkWeight);
  }
  const gesture=articulatedHoverAt(ms,view.phase,reducedMotion);
  const joints=[
   ['upperlegl',gesture.leftThigh,jointAxis],['upperlegr',gesture.rightThigh,jointAxis],
   ['lowerlegl',gesture.leftKnee,jointAxis],['lowerlegr',gesture.rightKnee,jointAxis],
   ['footl',gesture.leftFoot,jointAxis],['footr',gesture.rightFoot,jointAxis],
   ['hips',gesture.pelvis,jointRollAxis],['spine',gesture.spine,jointRollAxis],
   ['chest',gesture.chest,jointRollAxis]
  ];
  for(const [name,angle,axis] of joints){
   const entry=jointMap.get(name);
   if(entry){
    const leg=/^(upperleg|lowerleg|foot)[lr]/.test(name);
    if(!leg)entry.bone.quaternion.copy(entry.rest);
    entry.bone.quaternion.multiply(jointRotation.setFromAxisAngle(axis,angle*(leg?1-walkWeight:1)));
   }
  }
  // Clip sampling controls all 95 animations; keep the skull/hood proportion aligned.
  const headBone=source.getObjectByName('head');
  if(headBone)headBone.scale.setScalar(SKULLMASTER_PROFILE.headScale);
  body.updateWorldMatrix(true,true);
  const hip=rig.waist?.getWorldPosition(new THREE.Vector3());
  if(!hip)return;
  const scale=compactScale;
  const bag=hip.clone().add(new THREE.Vector3(-.44*scale,.10*scale,.12*scale));
  const mouth=bag.clone().add(new THREE.Vector3(0,.19*scale,.13*scale));
  const staging=approach.orbitalTarget?new THREE.Vector3(approach.orbitalTarget.x,approach.orbitalTarget.y,approach.orbitalTarget.z):rig.rightHand.getWorldPosition(new THREE.Vector3());
  let error=null,palmTarget=null;
  if(pickup&&arms.right){
   const lift=hip.clone().add(new THREE.Vector3(-.57*scale,.45*scale,.43*scale));
   const above=mouth.clone().add(new THREE.Vector3(0,.24*scale,.12*scale));
   palmTarget=staging.clone();
   if(pickup.t>=CONTACT&&pickup.t<.64)palmTarget.lerp(lift,smooth((pickup.t-CONTACT)/.14));
   else if(pickup.t>=.64&&pickup.t<.74)palmTarget.copy(lift).lerp(above,smooth((pickup.t-.64)/.10));
   else if(pickup.t>=.74)palmTarget.copy(above).lerp(mouth,smooth((pickup.t-.74)/.10));
   const weight=pluck.reachWeight;
   const before=arms.right.slice(0,2).map(b=>b.quaternion.clone());
   for(let pass=0;pass<3;pass++){
    const gripOffset=rig.rightHand.localToWorld(new THREE.Vector3(0,.045,.035)).sub(rig.rightHand.getWorldPosition(new THREE.Vector3()));
    error=moveWrist(arms.right,palmTarget.clone().sub(gripOffset),12);
   }
   arms.right.slice(0,2).forEach((b,i)=>b.quaternion.copy(before[i].slerp(b.quaternion,weight)));
  }
  // End with a side-held offering, not a planet embedded in the ribcage.
  // The right palm supports the globe from its inner/lower rim; the left arm
  // stays naturally idle rather than bending both arms over the thorax.
  // The right shoulder is at ~-.21 local X; this is still inside its .50 reach.
  const offer=hip.clone().add(new THREE.Vector3(-.58*scale,.72*scale,.32*scale));
  const offerReveal=reducedMotion?1:smooth((ms-(COLLECT_START_MS+completedCount*PER_WORLD_MS+OFFER_SETTLE_MS-650))/650);
  if(offerReveal>0&&view.activeIndex<0&&arms.right){
   const right=offer.clone().add(new THREE.Vector3(.16*scale,-.10*scale,-.02*scale));
   error=solveBlended(arms.right,right,offerReveal);
  }
  source.updateWorldMatrix(true,true);
  const rightHand=rig.rightHand?.getWorldPosition(new THREE.Vector3());
  const grip=rig.rightHand?.localToWorld(new THREE.Vector3(0,.045,.035));
  const hand=gripMidpoint(rig,THREE.Vector3);
  rigPoseRef.current={hand,hip,bag,mouth,staging,grip,rightHand,offer,offerReveal,scale,bodyPosition:body.position.clone(),
   rigReady:rig.readyToOffer,waistReady:rig.readyForSatchel,ikError:error,phase:view.phase};
  if(observed()&&window.__galaxySkeletonDiagnostics){
   const d=window.__galaxySkeletonDiagnostics;
   if(lastEpoch.current!==c.epoch){lastEpoch.current=c.epoch;lastIndex.current=-1;d.pickupLog=[];}
   if(view.activeIndex>=0&&view.activeIndex!==lastIndex.current){
    lastIndex.current=view.activeIndex;d.pickupLog.push({index:view.activeIndex,clip:'OrbitalPluckIK'});
   }
   Object.assign(d,{currentPhase:view.phase,currentClip:chooseKayKitAnimation(view.phase,animations.map(a=>a.name)),
    currentPickupIndex:view.activeIndex,pickupStage:pickup?.stage||view.phase,time:ms,
    ikError:error,hasArmIK:!!(arms.left&&arms.right),gripMidpoint:hand?.toArray(),
    pickupTargetError:pickup&&grip?grip.distanceTo(palmTarget):null,staging:staging.toArray(),
    rightGrip:grip?.toArray(),waistPosition:hip.toArray(),bagMouth:mouth.toArray(),
    worldPosition:body.position.toArray(),orbitalContact:approach.orbitalTarget?[approach.orbitalTarget.x,approach.orbitalTarget.y,approach.orbitalTarget.z]:null,approachTravel:approach.travel,offeringCenter:offer.toArray(),
    movementMode:walkWeight>.08?'walking-orbit':'upright-orbital-pluck',
    walkingClip:walkWeight>.08?'Walking_A':'Idle',
    walkingWeight:walkWeight,walkPhase:walkTime,
    walkHeading:body.rotation.y,
    groundWalkWeight:walkWeight,
    groundPickupWeight:actions['PickUp']?.getEffectiveWeight()??0,
    torsoBendRadians:uprightBones.filter(({bone})=>/^(hips|spine|chest)$/i.test(bone.name)).reduce((m,{bone,rest})=>Math.max(m,bone.quaternion.angleTo(rest)),0),
    legMotionRadians:uprightBones.filter(({bone})=>/^(upperleg|lowerleg|foot)[lr]/.test(bone.name.toLowerCase().replace(/[^a-z0-9]/g,''))).reduce((m,{bone,rest})=>Math.max(m,bone.quaternion.angleTo(rest)),0),
    legBoneCount:uprightBones.filter(({bone})=>/^(upperleg|lowerleg|foot)[lr]/.test(bone.name.toLowerCase().replace(/[^a-z0-9]/g,''))).length,
    feetVisible:(()=>{let count=0;source.traverse(o=>{if(o.isMesh&&o.visible&&/^SkullMasterSole_/.test(o.name))count++});return count===2})(),
    pluckReachWeight:pluck?.reachWeight??0,
    palmContactInOrbit:!!pluck?.palmContact});
   const top=body.position.clone().add(new THREE.Vector3(0,3.6*scale,0)).project(state.camera);
   const bottom=body.position.clone().project(state.camera);
   d.screenBody={top:(1-top.y)*state.size.height/2,bottom:(1-bottom.y)*state.size.height/2};
  }
 },-2);
 return <group ref={root}><primitive object={source}/></group>;
}
export default function KayKitGuardian(props){return <Suspense fallback={null}><Model {...props}/></Suspense>}
useGLTF.preload(ASSET);
useGLTF.preload(DETAIL_ASSET);
if(ANATOMY_MODE)useGLTF.preload(BODY_ASSET);
