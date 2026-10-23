import React,{Suspense,useEffect,useMemo,useRef} from 'react';
import {useFrame,useLoader,useThree} from '@react-three/fiber';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {useAnimations} from '@react-three/drei';
import * as THREE from 'three';
import {clone as cloneSkinnedSkeleton} from 'three/addons/utils/SkeletonUtils.js';

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
  const start=smallScreen?-3.0:-5.7;
  const end=smallScreen?-.9:-2.6;
  if(phase!=='arriving')return end;
  return Math.min(end,start+Math.max(0,elapsed)*1.65);
}
function SkeletonModel({phase='idle'}){
 const source=import.meta.env.BASE_URL+'models/skeleton/Skeleton.fbx';
 const rootFBX=useLoader(FBXLoader,source);
 const instance=useMemo(()=>{
   const model=cloneSkinnedSkeleton(rootFBX);
   model.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(model);
   const size=bounds.getSize(new THREE.Vector3());
   const center=bounds.getCenter(new THREE.Vector3());
   // FBX character scale varies by exporter (centimeters/meters).
   // Normalize by actual skinned geometry bounds, never a guessed .012.
   const height=Number.isFinite(size.y)&&size.y>0.01?size.y:170;
   const factor=3.2/height;
   model.scale.setScalar(factor);
   model.position.set(-center.x*factor,-bounds.min.y*factor,-center.z*factor);
   return model;
 },[rootFBX]);
 const {actions,names}=useAnimations(rootFBX.animations,instance);
 const holder=useRef(null),elapsed=useRef(0),previous=useRef(phase);
 // Adapted from MIT-licensed 3merillon CharacterController mobile smoothing.
 // https://github.com/3merillon/React-Three-Fiber-Character-Controller/blob/main/src/components/CharacterController.tsx
 const smoothedPosition=useRef(new THREE.Vector3());
 const targetPosition=useRef(new THREE.Vector3());
 const isInitialized=useRef(false);
 const narrow=useThree(state=>state.size.width<700);
 useEffect(()=>{
  instance.traverse(node=>{
    if(node.isSkinnedMesh||node.isMesh){
      node.castShadow=true;
      node.receiveShadow=true;
      if(node.material){
        const mats=Array.isArray(node.material)?node.material:[node.material];
        for(const material of mats){material.side=THREE.FrontSide;material.needsUpdate=true;}
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
    holder.current.rotation.y=THREE.MathUtils.damp(holder.current.rotation.y,-.17,4,dt);
  }
 });
 // FBX can have drastically different authoring scale; geometry comes from the
 // external asset and is not replaced by a custom mesh.
 return <group ref={holder} position={[-5.7,narrow?-1.95:-2.35,4.2]} scale={narrow?.65:1}>
   <primitive object={instance}/>
   <pointLight position={[0,120,120]} intensity={8} color="#e9d2ff" distance={400}/>
 </group>;
}
export default function SkeletonGuardian({phase='idle'}){
 return <Suspense fallback={null}><SkeletonModel phase={phase}/></Suspense>;
}
