import React,{Suspense,useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {discoverRigAnchors,gripMidpoint} from './rigAnchors.js';
import {styleKayKit,STYLE_PROFILE} from './styleKayKit.js';
import {SKULLMASTER_PROFILE} from './skullMasterMantle.js';
import {moveSkullMasterCloak} from './cloakMotion.js';
import {mountDetailedSkull,SKULL_ASSET} from './detailSkull.js';
import {guardianStageScale,guardianFloorY} from './guardianFraming.js';
import {moveWrist} from './handIK.js';
import {entranceAt,pickupAt,smooth,CONTACT,RELEASE,COLLECT_START_MS,PER_WORLD_MS} from '../journey/choreography.js';
import {phaseAt} from '../journey/story.js';
const ASSET=import.meta.env.BASE_URL+'models/kaykit/Skeleton_Mage.glb';
const DETAIL_ASSET=import.meta.env.BASE_URL+SKULL_ASSET;
const observed=()=>import.meta.env.DEV||new URLSearchParams(window.location.search).get('demo')==='1';
export function chooseKayKitAnimation(phase,names=[]){
 const preferred=phase==='arriving'?'Walking_A':phase==='collecting'?'PickUp':'Unarmed_Idle';
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
function Model({rigPoseRef,clockRef,completedCount=0,reducedMotion=false,onReady}){
 const {scene,animations}=useGLTF(ASSET);
 const {scene:anatomicalSkull}=useGLTF(DETAIL_ASSET);
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
  object.userData.disposeStyle=styleKayKit(object,THREE);
  const detailed=mountDetailedSkull(object,anatomicalSkull);
  if(!detailed.active)throw Error('CC0 detailed skull failed to attach: original rig is incompatible');
  object.userData.disposeDetail=detailed.dispose;
  return object;
 },[scene,anatomicalSkull]);
 const rig=useMemo(()=>discoverRigAnchors(source),[source]);
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
    sourceDimensions:{height:source.userData.geometryHeight}};
  }
  return ()=>{mixer.stopAllAction();mixer.uncacheRoot(source);source.userData.disposeDetail?.();source.userData.disposeStyle?.()};
 },[source,rig,mixer,animations,onReady]);
 useFrame((state,dt)=>{
  if(!root.current)return;
  const c=clockRef.current,ms=c.ms,view=phaseAt(ms,completedCount,reducedMotion);
  const compactScale=guardianStageScale(narrow,short),body=root.current;
  const entrance=entranceAt(reducedMotion?99999:ms,narrow);
  body.position.set(entrance.x,guardianFloorY(narrow,short),3.2);
  body.scale.setScalar(compactScale);
  const pickup=view.activeIndex>=0?pickupAt(ms,view.activeIndex):null;
  const turn=pickup?Math.sin(smooth((pickup.t-.46)/.4)*Math.PI)*-.20:0;
  body.rotation.y=entrance.yaw+turn;
  Object.values(actions).forEach(a=>a.setEffectiveWeight(0));
  function sample(name,time,weight){const a=actions[name];if(!a)return;a.enabled=true;a.time=Math.max(0,Math.min(a.getClip().duration-.00001,time));a.setEffectiveWeight(weight)}
  if(!contactLocal.current&&rig.rightHand){
   // Stage the miniature at the exact source clip's palm contact, not a guessed waypoint.
   sample('PickUp',CONTACT/.49*1.3,1);mixer.update(0);body.updateWorldMatrix(true,true);
   contactLocal.current=body.worldToLocal(rig.rightHand.localToWorld(new THREE.Vector3(0,.045,.035)));
   Object.values(actions).forEach(a=>a.setEffectiveWeight(0));
  }
  let pickupWeight=0;
  if(pickup)pickupWeight=smooth(pickup.t/.10)*(1-smooth((pickup.t-.49)/.17));
  const walk=view.phase==='arriving'?entrance.walkWeight:0;
  const travelled=entrance.x-entranceAt(0,narrow).x;
  sample('Walking_A',(travelled/.78*1.0666667)%1.0666667,walk);
  sample('PickUp',pickup?Math.min(1,pickup.t/.49)*1.3:0,pickupWeight);
  sample('Unarmed_Idle',(ms/1000)%1.0666667,Math.max(0,1-walk-pickupWeight));
  // Unlike useAnimations' independent delta, sample clips on the prop clock.
  // Weighted sampling replaces fadeIn/fadeOut without restarting PickUp at contact.
  mixer.update(0);
  // Clip sampling controls all 95 animations; keep the skull/hood proportion aligned.
  const headBone=source.getObjectByName('head');
  if(headBone)headBone.scale.setScalar(SKULLMASTER_PROFILE.headScale);
  body.updateWorldMatrix(true,true);
  const hip=rig.waist?.getWorldPosition(new THREE.Vector3());
  if(!hip)return;
  const scale=compactScale;
  const bag=hip.clone().add(new THREE.Vector3(-.61*scale,.12*scale,.10*scale));
  const mouth=bag.clone().add(new THREE.Vector3(0,.255*scale,.015*scale));
  const staging=contactLocal.current.clone().multiplyScalar(scale).add(new THREE.Vector3(entranceAt(99999,narrow).x,body.position.y,3.2));
  let error=null,palmTarget=null;
  if(pickup&&arms.right){
   const lift=hip.clone().add(new THREE.Vector3(-.57*scale,.45*scale,.43*scale));
   const above=mouth.clone().add(new THREE.Vector3(0,.24*scale,.12*scale));
   palmTarget=staging.clone();
   if(pickup.t>=CONTACT&&pickup.t<.49)palmTarget.lerp(lift,smooth((pickup.t-CONTACT)/.19));
   else if(pickup.t>=.49&&pickup.t<.68)palmTarget.copy(lift).lerp(above,smooth((pickup.t-.49)/.19));
   else if(pickup.t>=.68)palmTarget.copy(above).lerp(mouth,smooth((pickup.t-.68)/.16));
   const weight=smooth((pickup.t-.08)/.18)*(1-smooth((pickup.t-RELEASE)/.12));
   const before=arms.right.slice(0,2).map(b=>b.quaternion.clone());
   for(let pass=0;pass<3;pass++){
    const gripOffset=rig.rightHand.localToWorld(new THREE.Vector3(0,.045,.035)).sub(rig.rightHand.getWorldPosition(new THREE.Vector3()));
    error=moveWrist(arms.right,palmTarget.clone().sub(gripOffset),12);
   }
   arms.right.slice(0,2).forEach((b,i)=>b.quaternion.copy(before[i].slerp(b.quaternion,weight)));
  }
  const offer=hip.clone().add(new THREE.Vector3(0,.78*scale,.70*scale));
  const offerReveal=reducedMotion?1:smooth((ms-(COLLECT_START_MS+completedCount*PER_WORLD_MS))/650);
  if(offerReveal>0&&view.activeIndex<0&&arms.left&&arms.right){
   const influence=offerReveal;
   const left=offer.clone().add(new THREE.Vector3(.225*scale,-.15*scale,-.025*scale));
   const right=offer.clone().add(new THREE.Vector3(-.225*scale,-.15*scale,-.025*scale));
   error=Math.max(solveBlended(arms.left,left,influence),solveBlended(arms.right,right,influence));
  }
  moveSkullMasterCloak(source,ms,view.phase==='arriving');
  source.updateWorldMatrix(true,true);
  const rightHand=rig.rightHand?.getWorldPosition(new THREE.Vector3());
  const grip=rig.rightHand?.localToWorld(new THREE.Vector3(0,.045,.035));
  const hand=gripMidpoint(rig,THREE.Vector3);
  rigPoseRef.current={hand,hip,bag,mouth,staging,grip,rightHand,offer,offerReveal,scale,
   rigReady:rig.readyToOffer,waistReady:rig.readyForSatchel,ikError:error,phase:view.phase};
  if(observed()&&window.__galaxySkeletonDiagnostics){
   const d=window.__galaxySkeletonDiagnostics;
   if(lastEpoch.current!==c.epoch){lastEpoch.current=c.epoch;lastIndex.current=-1;d.pickupLog=[];}
   if(view.activeIndex>=0&&view.activeIndex!==lastIndex.current){
    lastIndex.current=view.activeIndex;d.pickupLog.push({index:view.activeIndex,clip:'PickUp'});
   }
   Object.assign(d,{currentPhase:view.phase,currentClip:chooseKayKitAnimation(view.phase,animations.map(a=>a.name)),
    currentPickupIndex:view.activeIndex,pickupStage:pickup?.stage||view.phase,time:ms,
    ikError:error,hasArmIK:!!(arms.left&&arms.right),gripMidpoint:hand?.toArray(),
    pickupTargetError:pickup&&grip?grip.distanceTo(palmTarget):null,staging:staging.toArray(),
    rightGrip:grip?.toArray(),waistPosition:hip.toArray(),bagMouth:mouth.toArray(),
    worldPosition:body.position.toArray(),offeringCenter:offer.toArray()});
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
