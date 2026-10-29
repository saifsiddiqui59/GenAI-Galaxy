import React,{Suspense,useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {discoverRigAnchors,gripMidpoint} from './rigAnchors.js';
import {styleKayKit,STYLE_PROFILE} from './styleKayKit.js';
import {SKULLMASTER_PROFILE,attachSkullMasterCloak} from './skullMasterMantle.js';
import {guardianApproachAt} from '../journey/orbitalApproach.js';
import {orbitalPluckPose} from '../journey/orbitalPluckPose.js';
import {mountDetailedSkull,SKULL_ASSET} from './detailSkull.js';
import {ANATOMY_ASSET,ANATOMY_MODE,attachAnatomicalSkeleton} from './retargetAnatomy.js';
import {guardianStageScale,guardianFloorY} from './guardianFraming.js';
import {moveWrist} from './handIK.js';
import {groundedStrideAt,STRIDE_DISTANCE} from './groundedStride.js';
import {walkingFootTarget} from './footPlantIK.js';
import {straightenSkeletonLegs,lengthenSkeletonLegs} from './standingLegPose.js';
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
 const leftPad=useRef(),rightPad=useRef();
 const source=useMemo(()=>{
  const object=clone(scene);object.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(object),height=box.getSize(new THREE.Vector3()).y;
  const factor=3.6/Math.max(.001,height);
  object.scale.setScalar(factor);
  object.position.set(-box.getCenter(new THREE.Vector3()).x*factor,-box.min.y*factor,-box.getCenter(new THREE.Vector3()).z*factor);
  object.userData.geometryHeight=height;
  object.userData.legProportions=lengthenSkeletonLegs(object,1.55);
  object.userData.disposeStyle=styleKayKit(object,THREE,{anatomical:ANATOMY_MODE});
  const detailed=mountDetailedSkull(object,anatomicalSkull);
  if(!detailed.active)throw Error('CC0 detailed skull failed to attach: original rig is incompatible');
  object.userData.disposeDetail=detailed.dispose;
  // Dark, short mantle frames the skull without hiding moving legs or feet.
  object.userData.disposeMantle=attachSkullMasterCloak(object,THREE);
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
  // Stabilize legs in a real extended standing pose before storing the rest
  // quaternions. The original source clips tuck knees under the rib cage.
  object.userData.standingLegs=straightenSkeletonLegs(object,THREE);
  object.updateWorldMatrix(true,true);
  // One stable floor reference from the immutable, straight-legged rest pose;
  // NOT recalculated from gait ankle positions every animation frame.
  const ankles=['foot.l','foot.r'].map(name=>object.getObjectByName(name)?.getWorldPosition(new THREE.Vector3()));
  if(ankles.some(v=>!v))throw Error('Walking model needs both original ankle bones');
  const rootY=object.getWorldPosition(new THREE.Vector3()).y;
  object.userData.ankleFloorOffset=(ankles[0].y+ankles[1].y)/2-rootY;
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
    standingLegs:source.userData.standingLegs?.corrected||0,
    legLengthFactor:source.userData.legProportions?.factor||1,
    visibleLegMeshes:(()=>{let n=0;source.traverse(o=>{if(o.isMesh&&o.visible&&/^SkullMaster(Femur|Tibia|Foot)_/.test(o.name))n++});return n})()};
  }
  return ()=>{mixer.stopAllAction();mixer.uncacheRoot(source);source.userData.disposeAnatomy?.();source.userData.disposeDetail?.();source.userData.disposeMantle?.();source.userData.disposeStyle?.()};
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
  // Drive the authored KayKit walking arm/torso clip while using upright,
  // connected foot geometry. The lower limbs must not inherit the source
  // clip's folded-knee pose. Never sample the ground PickUp clip.
  const walkingClip=actions['Walking_A']?.getClip();
  const stride=groundedStrideAt(approach.walkDistance,approach.speed,reducedMotion);
  const walkTime=walkingClip?((stride.stepDistance/STRIDE_DISTANCE)%1)*walkingClip.duration:0;
  // Avoid the source clip's deeply tucked knees; blend its upper-body stride
  // modestly over the original upright rest pose, then supply our own stable
  // alternating thigh, knee and ankle movement with connected feet.
  const clipWeight=walkWeight*.46;
  sample('Idle',.14,1-clipWeight);
  if(walkingClip&&walkWeight>0)sample('Walking_A',walkTime,clipWeight);
  mixer.update(0);
  // Corrected standing chains are the neutral base. Walk-cycle motion on
  // those connected legs comes from bounded procedural leg articulation,
  // not a raw authored clip that folds both feet under the torso.
  for(const {bone,rest} of uprightBones)bone.quaternion.copy(rest);
  const gesture=stride;
  // Each step uses travelled distance, not elapsed playback time.
  // At planet contact speed and vertical weight shift converge to zero.
  body.position.y+=gesture.pelvisBob*approach.scale;
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
    entry.bone.quaternion.multiply(jointRotation.setFromAxisAngle(axis,angle));
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
  // V6.10.1: stable world-space landing sites. Each foot's landing is a
  // constant point for its entire stance half-cycle. The walkable surface is
  // independently built from the immutable neutral ankle height, never
  // recalculated from a moving ankle (which previously made it drift).
  const contactErrors={left:0,right:0},groundContacts={};
  source.updateWorldMatrix(true,true);
  for(const [side,part] of [['left','l'],['right','r']]){
   const chain=[jointMap.get('upperleg'+part)?.bone,jointMap.get('lowerleg'+part)?.bone,jointMap.get('foot'+part)?.bone];
   if(!chain.every(Boolean))continue;
   const target=walkingFootTarget({
    walking:walkWeight>.04,walkDistance:approach.walkDistance,
    walkSpeed:approach.speed,walkingRouteFrom:approach.routeFrom,
    walkingRouteTo:approach.routeTo,walkingRouteProgress:approach.routeProgress
   },side,narrow,approach.scale,source.userData.ankleFloorOffset);
   groundContacts[side]=target;
   if(!target||target.weight<.025)continue;
   const neutral=chain[2].getWorldPosition(new THREE.Vector3());
   const desired=neutral.lerp(new THREE.Vector3(target.x,target.y,target.z),target.weight);
   // CCD acts on real femur and tibia, never on detached ankle meshes.
   moveWrist(chain,desired,16);
   source.updateWorldMatrix(true,true);
   const actual=chain[2].getWorldPosition(new THREE.Vector3());
   contactErrors[side]=actual.distanceTo(desired);
  }
  source.updateWorldMatrix(true,true);
  const anklePositions={};
  for(const side of ['l','r']){
   const ankle=jointMap.get('foot'+side)?.bone;
   anklePositions[side]=ankle?.getWorldPosition(new THREE.Vector3())||null;
  }
  for(const [side,pad] of [['left',leftPad],['right',rightPad]]){
   if(!pad.current)continue;
   const site=groundContacts[side],pos=anklePositions[side==='left'?'l':'r'];
   const strength=site?.weight||0;
   pad.current.visible=!!pos&&!reducedMotion&&strength>.16;
   if(site){
    const floorHeight=site.y-.11*approach.scale;
    pad.current.position.set(site.x,floorHeight,site.z);
    pad.current.scale.setScalar(approach.scale*(.72+.16*strength));
    pad.current.rotation.set(0,0,0);
   }
   pad.current.children.forEach(mesh=>{
    if(mesh.material?.opacity!==undefined)mesh.material.opacity=
     mesh.userData.baseOpacity==null
      ?(mesh.material.opacity=.45*strength,mesh.userData.baseOpacity=.45)
      :mesh.userData.baseOpacity*strength;
   });
  }
  const rightHand=rig.rightHand?.getWorldPosition(new THREE.Vector3());
  const grip=rig.rightHand?.localToWorld(new THREE.Vector3(0,.045,.035));
  const hand=gripMidpoint(rig,THREE.Vector3);
  rigPoseRef.current={hand,hip,bag,mouth,staging,grip,rightHand,offer,offerReveal,scale,bodyPosition:body.position.clone(),
   rigReady:rig.readyToOffer,waistReady:rig.readyForSatchel,ikError:error,phase:view.phase,
   walking:walkWeight>.09,walkSpeed:approach.speed,walkDistance:approach.walkDistance,
   walkingRouteFrom:approach.routeFrom,walkingRouteTo:approach.routeTo,walkingRouteProgress:approach.routeProgress,
   footL:anklePositions.l?.toArray(),footR:anklePositions.r?.toArray(),
   walkFloorOffset:source.userData.ankleFloorOffset-.11,
   plantedTargets:groundContacts};
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
    movementMode:walkWeight>.09?'distance-linked-footsteps':'stationary-planet-reach',
    walkingClip:walkWeight>.08?'Walking_A':'Idle',
    walkingWeight:walkWeight,walkPhase:stride.phase,walkingSpeed:approach.speed,
    walkingDistance:approach.walkDistance,stanceFoot:gesture.stanceFoot,
    footPlantL:gesture.leftPlant,footPlantR:gesture.rightPlant,
    feetWorld:{left:anklePositions.l?.toArray(),right:anklePositions.r?.toArray()},
    stanceContactErrors:contactErrors,
    plantedTargets:groundContacts,
    walkwayOffset:source.userData.ankleFloorOffset-.11,
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
 return <>
  <group ref={root}><primitive object={source}/></group>
  {['left','right'].map((side,i)=><group key={side} ref={i===0?leftPad:rightPad} visible={false}>
    <mesh rotation={[-Math.PI/2,0,0]}>
     <ringGeometry args={[.12,.165,32]}/>
     <meshBasicMaterial color="#8fdfe5" transparent opacity={.83} depthWrite={false} side={THREE.DoubleSide}/>
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.004,0]}>
     <circleGeometry args={[.11,24]}/>
     <meshBasicMaterial color="#98afe8" transparent opacity={.21} depthWrite={false}/>
    </mesh>
  </group>)}
 </>;
}
export default function KayKitGuardian(props){return <Suspense fallback={null}><Model {...props}/></Suspense>}
useGLTF.preload(ASSET);
useGLTF.preload(DETAIL_ASSET);
if(ANATOMY_MODE)useGLTF.preload(BODY_ASSET);
