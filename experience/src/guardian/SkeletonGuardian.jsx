import React,{Suspense,useEffect,useMemo,useRef} from 'react';
import {useFrame,useLoader,useThree} from '@react-three/fiber';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {useAnimations} from '@react-three/drei';
import * as THREE from 'three';
import {discoverRigAnchors,gripMidpoint,waistPosition} from './rigAnchors.js';
import {identifyArmChains,poseTwoHandOffering} from './handIK.js';
// The scene uses one character, so keep FBXLoader's original skinned mesh and bindings.

// Real Quaternius 2018 CC0 skeletal FBX, not generated placeholder geometry.
// Animation names from the original asset are detected and logged on load.
export function chooseSkeletonClip(phase,names=[]){
  const patterns={
    arriving:/walk|run|move/i,
    collecting:/pick|attack|punch|grab|collect/i,
    offering:/idle|attack|punch|pose/i,
    idle:/idle|breath|stand/i,
    celebrating:/jump|dance|victory/i
  };
  const wanted=patterns[phase]||patterns.idle;
  return names.find(name=>wanted.test(name))
    ||names.find(name=>/idle/i.test(name))||names[0]||null;
}
export function advanceSkeletonX(phase,elapsed,smallScreen=false){
  const start=smallScreen?-1.8:-3.0;
  const end=smallScreen?-.5:-1.95;
  if(phase!=='arriving')return end;
  return Math.min(end,start+Math.max(0,elapsed)*1.65);
}
function SkeletonModel({phase='idle',rigPoseRef}){
 const source=import.meta.env.BASE_URL+'models/skeleton/Skeleton.fbx';
 const rootFBX=useLoader(FBXLoader,source);
 const instance=useMemo(()=>{
   const model=rootFBX;
   model.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(model);
   const size=bounds.getSize(new THREE.Vector3());
   const center=bounds.getCenter(new THREE.Vector3());
   // FBX character scale varies by exporter (centimeters/meters).
   // Normalize by actual skinned geometry bounds, never a guessed .012.
   const height=Number.isFinite(size.y)&&size.y>0.01?size.y:170;
   const factor=3.2/height;
   const originalScale=model.scale.clone();
   const originalPosition=model.position.clone();
   model.userData.sourceDimensions={height,width:size.x,depth:size.z,factor,
       initialScale:originalScale.toArray(),
       min:[bounds.min.x,bounds.min.y,bounds.min.z],max:[bounds.max.x,bounds.max.y,bounds.max.z]};
   // Keep FBXLoader's built-in unit conversion. The bounds measured above
   // already include it; replacing root scale would double-apply units.
   model.scale.copy(originalScale).multiplyScalar(factor);
   model.position.copy(originalPosition).add(new THREE.Vector3(-center.x*factor,-bounds.min.y*factor,-center.z*factor));
   return model;
 },[rootFBX]);
 const {actions,names}=useAnimations(rootFBX.animations,instance);
 const rig=useMemo(()=>discoverRigAnchors(instance),[instance]);
 const chains=useMemo(()=>identifyArmChains(instance),[instance]);
 const holder=useRef(null),elapsed=useRef(0),previous=useRef(phase);
 // Adapted from MIT-licensed 3merillon CharacterController mobile smoothing.
 // https://github.com/3merillon/React-Three-Fiber-Character-Controller/blob/main/src/components/CharacterController.tsx
 const smoothedPosition=useRef(new THREE.Vector3());
 const targetPosition=useRef(new THREE.Vector3());
 const isInitialized=useRef(false);
 const narrow=useThree(state=>state.size.width<700);
 useEffect(()=>{
  let meshes=0,bones=0;
  instance.traverse(node=>{if(node.isMesh||node.isSkinnedMesh)meshes++;if(node.isBone)bones++;});
  if(!meshes)throw Error('Loaded CC0 Skeleton FBX has no drawable mesh');
  // Synthetic-browser acceptance instrumentation only: never include private data.
  if(import.meta.env.DEV||new URLSearchParams(window.location.search).has('demo'))
    window.__galaxySkeletonDiagnostics={meshes,bones,clips:names.length,
       sourceDimensions:instance.userData.sourceDimensions,
       worldPosition:instance.getWorldPosition(new THREE.Vector3()).toArray(),
       rig:{boneNames:(()=>{const a=[];instance.traverse(n=>{if(n.isBone)a.push(n.name)});return a})(),detectedBones:rig.detectedBones,left:rig.leftHand?.name||null,
        right:rig.rightHand?.name||null,waist:rig.waist?.name||null,
        canOffer:rig.readyToOffer,canCarry:rig.readyForSatchel}};
 },[instance,names,rig]);
 useEffect(()=>{
  instance.traverse(node=>{
    if(node.isSkinnedMesh||node.isMesh){
      node.castShadow=true;
      node.receiveShadow=true;
      if(node.material){
        const mats=Array.isArray(node.material)?node.material:[node.material];
        if(import.meta.env.DEV||new URLSearchParams(window.location.search).has('demo')){
          window.__galaxyMaterialQA=mats.map(mat=>({name:mat.name,type:mat.type,hasDiffuseTexture:!!mat.map,color:mat.color?.getHexString(),roughness:mat.roughness,metalness:mat.metalness}));
        }
        for(const material of mats){
          // FBX winding can differ across authoring exporters; avoid culling bones.
          material.side=THREE.DoubleSide;
          material.transparent=false;
          material.opacity=1;
          if(material.color)material.color.set('#fff3dd');
          if(material.emissive){material.emissive.set('#d7bda9');material.emissiveIntensity=.62;}
          material.needsUpdate=true;
        }
      }
    }
  });
 },[instance]);
 useEffect(()=>{
   const key=chooseSkeletonClip(phase,names);
   if(!key)return;
   const active=actions[key]; if(!active)return;
   active.reset().fadeIn(.28).play();
   for(const [name,action] of Object.entries(actions))if(name!==key)action?.fadeOut(.28);
   return ()=>active.fadeOut(.22);
 },[phase,names,actions]);
 useFrame((_,delta)=>{
  const dt=Math.min(delta,.05);
  if(previous.current!==phase){previous.current=phase;elapsed.current=0;}
  elapsed.current+=dt;
  if(holder.current){
    const targetX=advanceSkeletonX(phase,elapsed.current,narrow);
    // Source technique: target position and mobile-specific vector smoothing.
    targetPosition.current.set(targetX,holder.current.position.y,holder.current.position.z);
    if(!isInitialized.current){smoothedPosition.current.copy(holder.current.position);isInitialized.current=true;}
    if(narrow){
      smoothedPosition.current.lerp(targetPosition.current,.15);
      holder.current.position.copy(smoothedPosition.current);
    }else{
      holder.current.position.x=THREE.MathUtils.damp(holder.current.position.x,targetX,5,dt);
      smoothedPosition.current.copy(holder.current.position);
    }
    holder.current.rotation.y=THREE.MathUtils.damp(holder.current.rotation.y,Math.PI-.12,4,dt);
    // Capture actual animated bone positions for visual QA; no fake IK claims.
    instance.updateMatrixWorld(true);
    const ik=phase==='offering'?poseTwoHandOffering(chains,rig.waist,narrow?12:7,narrow?.58:1):null;
    if(rigPoseRef){
      const hand=gripMidpoint(rig,THREE.Vector3);
      const hip=waistPosition(rig,THREE.Vector3);
      rigPoseRef.current={hand,hip,rigReady:rig.readyToOffer,waistReady:rig.readyForSatchel,ikError:ik?Math.max(ik.errorLeft,ik.errorRight):null};
    }
    if((import.meta.env.DEV||new URLSearchParams(window.location.search).has('demo'))&&window.__galaxySkeletonDiagnostics){
      window.__galaxySkeletonDiagnostics.gripMidpoint=gripMidpoint(rig,THREE.Vector3)?.toArray()||null;
      window.__galaxySkeletonDiagnostics.waistPosition=waistPosition(rig,THREE.Vector3)?.toArray()||null;
      window.__galaxySkeletonDiagnostics.ikError=ik?Math.max(ik.errorLeft,ik.errorRight):null;
      window.__galaxySkeletonDiagnostics.hasArmIK=Boolean(chains.left&&chains.right);
    }
  }
 });
 // FBX can have drastically different authoring scale; geometry comes from the
 // external asset and is not replaced by a custom mesh.
 return <group ref={holder} position={[narrow?-1.8:-3.0,narrow?-1.55:-2.35,4.2]} scale={narrow?.58:1}>
   <primitive object={instance}/>
   <pointLight position={[0,2.2,4.8]} intensity={95} color="#fff0d2" distance={12}/>
   <pointLight position={[-2,1.7,-.9]} intensity={30} color="#ad9bff" distance={9}/>
 </group>;
}
export default function SkeletonGuardian({phase='idle',rigPoseRef}){
 return <Suspense fallback={null}><SkeletonModel phase={phase} rigPoseRef={rigPoseRef}/></Suspense>;
}
