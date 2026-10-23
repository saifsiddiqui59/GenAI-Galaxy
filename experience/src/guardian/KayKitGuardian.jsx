import React,{Suspense,useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useAnimations,useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {discoverRigAnchors,gripMidpoint,waistPosition} from './rigAnchors.js';
import {moveWrist} from './handIK.js';

const ASSET=import.meta.env.BASE_URL+'models/kaykit/Skeleton_Mage.glb';
const eye=new THREE.Vector3();
const observed=()=>import.meta.env.DEV||new URLSearchParams(window.location.search).get('demo')==='1';

// Existing CC0 character and original animation clips; NOT a procedural skeleton.
export function chooseKayKitAnimation(phase,names=[]){
 const wants={
  arriving:[/walk/i,/run/i,/move/i],
  collecting:[/^PickUp$/i,/interact/i,/grab/i,/cast/i,/attack/i],
  offering:[/^Unarmed_Idle$/i,/^2H_Melee_Idle$/i,/^Idle$/i,/Spellcast_Summon/i],
  idle:[/idle/i,/breath/i,/stand/i],
  celebrating:[/cheer/i,/dance/i,/victory/i,/idle/i]
 };
 const expressions=wants[phase]||wants.idle;
 for(const re of expressions){const name=names.find(x=>re.test(x));if(name)return name}
 return names[0]||null;
}
function armChain(hand){
 if(!hand)return null;
 let parent=hand;
 let lower=null,upper=null;
 while(parent&&parent.isBone){
  const label=parent.name.toLowerCase().replace(/[^a-z0-9]/g,'');
  if(label.startsWith('lowerarm')||label.startsWith('forearm'))lower=parent;
  if(label.startsWith('upperarm')){upper=parent;break}
  parent=parent.parent;
 }
 return upper&&lower?[upper,lower,hand]:null;
}
export function characterEntranceX(phase,t,compact){
 const start=compact?-1.8:-3.2;
 const stop=compact?-.55:-1.98;
 return phase==='arriving'?Math.min(stop,start+Math.max(0,t)*1.14):stop;
}
function Model({phase,rigPoseRef,reducedMotion=false}){
 const {scene,animations}=useGLTF(ASSET);
 const narrow=useThree(state=>state.size.width<700);
 const holder=useRef(),t=useRef(0),was=useRef(phase);
 const smoothed=useRef(new THREE.Vector3());
 const source=useMemo(()=>{
  scene.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(scene);
  const measure=box.getSize(new THREE.Vector3());
  const height=Math.max(.001,measure.y);
  const factor=3.35/height;
  scene.scale.setScalar(factor);
  scene.position.set(-box.getCenter(new THREE.Vector3()).x*factor,-box.min.y*factor,-box.getCenter(new THREE.Vector3()).z*factor);
  scene.userData.geometryHeight=height;
  scene.traverse(node=>{
   if(node.isMesh||node.isSkinnedMesh){
    node.castShadow=true;
    node.receiveShadow=true;
    // Keep the original KayKit CC0 1024 atlas map, gradient and GLB material intact.
    // Previous P19 code overwrote every bone with flat cream, destroying all artwork.
    const materials=Array.isArray(node.material)?node.material:[node.material];
    for(const material of materials){
      if(material?.name==='Glow'&&material.emissive){
        material.emissive.set('#ffc76e');material.emissiveIntensity=1.6;
        material.toneMapped=false;material.needsUpdate=true;
      }
    }
   }
  });
  return scene;
 },[scene]);
 const {actions,names}=useAnimations(animations,source);
 const rig=useMemo(()=>discoverRigAnchors(source),[source]);
 const arms=useMemo(()=>({left:armChain(rig.leftHand),right:armChain(rig.rightHand)}),[rig]);
 useEffect(()=>{
  const clip=chooseKayKitAnimation(phase,names);
  if(!clip||!actions[clip])return;
  actions[clip].reset().fadeIn(.26).play();
  for(const [name,action] of Object.entries(actions))if(name!==clip)action?.fadeOut(.26);
  return ()=>actions[clip]?.fadeOut(.20);
 },[phase,actions,names]);
 useEffect(()=>{
  if(!observed())return;
  const bones=[],materials=[];
  let meshes=0;
  source.traverse(node=>{
   if(node.isBone)bones.push(node.name);
   if(node.isMesh||node.isSkinnedMesh){
     meshes++;
     (Array.isArray(node.material)?node.material:[node.material]).forEach(material=>{
       if(material)materials.push({name:material.name,map:!!material.map,color:material.color?.getHexString()});
     });
   }
  });
  window.__galaxySkeletonDiagnostics={
   asset:'KayKit CC0 Skeleton_Mage.glb',meshes,bones:bones.length,clips:names.length,
   animationNames:names,boneNames:bones,materials,
   rig:{detectedBones:bones.length,left:rig.leftHand?.name||null,right:rig.rightHand?.name||null,
       waist:rig.waist?.name||null,canOffer:rig.readyToOffer,canCarry:rig.readyForSatchel},
   sourceDimensions:{height:source.userData.geometryHeight}
  };
 },[source,rig,names]);
 useFrame((state,dt)=>{
  const delta=Math.min(dt,.05);
  if(was.current!==phase){was.current=phase;t.current=0}
  t.current+=delta;
  const root=holder.current;
  if(!root)return;
  const x=characterEntranceX(reducedMotion?'idle':phase,t.current,narrow);
  root.position.x=THREE.MathUtils.damp(root.position.x,x,narrow?6:4.5,delta);
  // MIT 3merillon CharacterController approach: damp position/heading,
  // never teleport a moving animated character between keyframes.
  root.rotation.y=THREE.MathUtils.damp(root.rotation.y,phase==='arriving'?.34:0,5,delta);
  smoothed.current.copy(root.position);
  source.updateMatrixWorld(true);
  let maxError=null;
  if(phase==='offering'&&rig.readyToOffer&&rig.waist&&arms.left&&arms.right){
   const hip=rig.waist.getWorldPosition(new THREE.Vector3());
   const width=narrow?.76:1;
   const centre=hip.add(new THREE.Vector3(0,.77*width,.46*width));
   const left=centre.clone().add(new THREE.Vector3(-.24*width,-.04*width,0));
   const right=centre.clone().add(new THREE.Vector3(.24*width,-.04*width,0));
   maxError=Math.max(moveWrist(arms.left,left,8),moveWrist(arms.right,right,8));
  }
  source.updateMatrixWorld(true);
  const hand=gripMidpoint(rig,THREE.Vector3);
  const hip=waistPosition(rig,THREE.Vector3);
  if(rigPoseRef)rigPoseRef.current={hand,hip,rigReady:rig.readyToOffer,
     waistReady:rig.readyForSatchel,ikError:maxError};
  if(observed()&&window.__galaxySkeletonDiagnostics){
   const d=window.__galaxySkeletonDiagnostics;
   d.gripMidpoint=hand?.toArray()||null;
   d.waistPosition=hip?.toArray()||null;
   d.ikError=maxError;
   d.hasArmIK=!!(arms.left&&arms.right);
   d.worldPosition=root.getWorldPosition(eye).toArray();
   d.currentPhase=phase;
   d.currentClip=chooseKayKitAnimation(phase,names);
  }
 });
 return <group ref={holder} position={[narrow?-1.8:-3.2,narrow?-1.55:-2.20,4.3]}
    scale={narrow?.76:1.04}>
   <primitive object={source}/>
   <pointLight position={[.35,2.5,3.7]} intensity={26} color="#ffdeb6" distance={9}/>
   <pointLight position={[-1.3,2.8,-1.8]} intensity={22} color="#a18aff" distance={10}/>
 </group>;
}
export default function KayKitGuardian({phase='idle',rigPoseRef,reducedMotion=false}){
 return <Suspense fallback={null}><Model phase={phase} rigPoseRef={rigPoseRef} reducedMotion={reducedMotion}/></Suspense>;
}
useGLTF.preload(ASSET);
