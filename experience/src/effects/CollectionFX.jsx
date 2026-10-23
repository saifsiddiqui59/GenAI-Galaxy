import React,{useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {layoutWorlds,COLORS} from '../space/DeepGalaxy.jsx';
import './collection.css';
export const COLLECT_START_MS=1700;
export const PER_WORLD_MS=1050;
export const BAG_POSITION=[-2.65,-.85,3.35];
export function collectPosition(world,index,time,disabled=false,bagPosition=BAG_POSITION,handPosition=null){
 const to=new THREE.Vector3(...bagPosition);
 const start=new THREE.Vector3(world.x,world.y,world.z+.35);
 if(disabled)return {point:to,arrived:true};
 const elapsed=time-(COLLECT_START_MS+index*PER_WORLD_MS);
 const t=THREE.MathUtils.clamp(elapsed/PER_WORLD_MS,0,1);
 const ease=x=>x*x*(3-2*x);
 const pickup=handPosition?new THREE.Vector3(...handPosition):null;
 let point;
 if(pickup&&t<.48){
   const u=ease(t/.48);
   point=start.clone().lerp(pickup,u);
   point.y+=Math.sin(Math.PI*u)*.24;
 }else if(pickup){
   point=pickup.clone().lerp(to,ease((t-.48)/.52));
 }else{
   point=start.clone().lerp(to,ease(t));
   point.y+=Math.sin(Math.PI*t)*.6;
 }
 return {point,arrived:t>=1,atHand:Boolean(pickup&&t>=.44&&t<.52)};
}
function CollectedOrb({world,order,reducedMotion,epoch,ready,bagPosition,rigPoseRef,compact}){
 const mesh=useRef(),halo=useRef();
 const worldLayout=layoutWorlds()[world.index];
 const begin=useRef(null);
 useFrame(({clock},delta)=>{
  if(!mesh.current||!worldLayout)return;
  if(begin.current?.epoch!==epoch)begin.current={epoch,start:clock.elapsedTime*1000};
  const time=clock.elapsedTime*1000-begin.current.start;
  const dynamicBag=rigPoseRef?.current?.hip;
  const position=dynamicBag?dynamicBag.toArray().map((v,i)=>v+([.38,-.25,.16][i])):bagPosition;
  const hand=rigPoseRef?.current?.hand?.toArray()||null;
  const sourceWorld=compact?{...worldLayout,x:worldLayout.x*.48,y:worldLayout.y*.73+.4,z:worldLayout.z*.8-1.8}:worldLayout;
  const {point,arrived}=collectPosition(sourceWorld,order,time,reducedMotion,position,hand);
  const sackOffset=new THREE.Vector3((order%4-1.5)*.115,Math.floor(order/4)*.08,order*.007);
  if(arrived)point.add(sackOffset);
  mesh.current.position.copy(point);
  mesh.current.scale.setScalar(arrived?.42:.56);
  if(halo.current){
    const shine=arrived?.45:.8+Math.sin(time*.012)*.22;
    halo.current.material.opacity=shine;
    halo.current.scale.setScalar(arrived?1.1:1.25);
  }
  mesh.current.visible=ready;
 });
 if(!worldLayout)return null;
 return <group ref={mesh} position={[worldLayout.x,worldLayout.y,worldLayout.z]}>
   <mesh><icosahedronGeometry args={[.22,2]}/><meshStandardMaterial color={COLORS[world.index]}
     emissive={COLORS[world.index]} emissiveIntensity={.7} metalness={.25} roughness={.25}/></mesh>
   <mesh ref={halo}>
    <sphereGeometry args={[.29,16,16]}/>
    <meshBasicMaterial color={COLORS[world.index]} transparent opacity={.3} wireframe depthWrite={false}/>
   </mesh>
 </group>;
}
function Satchel({onOpenSack,count,bagPosition,rigPoseRef}){
 const bag=useRef();
 useFrame((state)=>{
  if(!bag.current)return;
  const hip=rigPoseRef?.current?.hip;
  if(hip)bag.current.position.copy(hip).add(new THREE.Vector3(.38,-.25,.16));
  bag.current.rotation.z=Math.sin(state.clock.elapsedTime*1.7)*.035;
 });
 return <group ref={bag} position={bagPosition}
  onClick={e=>{e.stopPropagation();onOpenSack?.()}}>
   <mesh scale={[.37,.30,.24]}>
      <sphereGeometry args={[1,28,22]}/>
      <meshStandardMaterial color="#aa6f59" roughness={.84} metalness={.05}/>
   </mesh>
   <mesh position={[0,.24,0]} rotation={[Math.PI/2,0,0]}>
      <torusGeometry args={[.195,.034,8,28]}/>
      <meshStandardMaterial color="#e8b77c" roughness={.44} metalness={.26}/>
   </mesh>
   <mesh position={[0,.06,.23]} scale={[.10,.10,.04]}>
      <sphereGeometry args={[1,16,16]}/>
      <meshStandardMaterial color={count>0?"#f7d99e":"#6d4b5c"} emissive="#a77bbf" emissiveIntensity={count>0?.8:.05}/>
   </mesh>
   <mesh position={[0,.17,.20]} scale={[.37,.115,.08]}><sphereGeometry args={[1,18,12]}/><meshStandardMaterial color="#755044" roughness={.87}/></mesh>
   <pointLight color="#dfb5ff" intensity={count>0?1.5:.25} distance={3}/>
 </group>;
}

function OfferingOrb({worldIndex,phase,bagPosition,rigPoseRef,compact}){
 const orb=useRef();
 useFrame((state,dt)=>{
  if(!orb.current)return;
  orb.current.rotation.y+=Math.min(.04,dt)*.36;
  orb.current.rotation.z+=Math.min(.04,dt)*.18;
  // The world-space location comes from the two real hand bones rather than a prop sphere.
  const hand=rigPoseRef?.current?.hand;
  orb.current.visible=Boolean(hand);
  if(hand)orb.current.position.copy(hand);
  orb.current.rotation.y+=Math.min(.04,dt)*.15;
 });
 if(phase!=='offering')return null;
 const color=COLORS[worldIndex%COLORS.length]||'#a6c3ff';
 return <group>
   <group ref={orb} scale={compact?.72:1}>
     <mesh><sphereGeometry args={[.42,42,32]}/>
       <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.1}
          metalness={.22} roughness={.35} toneMapped={false}/></mesh>
     <mesh rotation={[1.2,.2,.6]}>
       <torusGeometry args={[.57,.017,8,64]}/>
       <meshBasicMaterial color="#fbe7a8" transparent opacity={.9}/></mesh>
     <mesh rotation={[-.8,.6,1.1]}>
       <torusGeometry args={[.65,.012,7,64]}/>
       <meshBasicMaterial color="#b1f1ff" transparent opacity={.75}/></mesh>
     <pointLight intensity={8} color={color} distance={5}/>
   </group>
 </group>;
}

export default function CollectionFX({completed=[],reducedMotion=false,epoch=0,onOpenSack,phase='idle',nextWorldIndex=0,rigPoseRef}){
 const size=useThree(state=>state.size);
 const bagPosition=size.width<700?[-.75,-.82,3.7]:BAG_POSITION;
 return <>
   <Satchel onOpenSack={onOpenSack} count={completed.length} bagPosition={bagPosition} rigPoseRef={rigPoseRef}/>
   <OfferingOrb phase={phase} worldIndex={nextWorldIndex} bagPosition={bagPosition} rigPoseRef={rigPoseRef} compact={size.width<680}/>
   {completed.filter(w=>Number.isInteger(w.index)&&w.index>=0&&w.index<17).slice(0,17).map((world,order)=>
     <CollectedOrb key={world.index} world={world} order={order}
      epoch={epoch} reducedMotion={reducedMotion} ready={true} bagPosition={bagPosition} rigPoseRef={rigPoseRef} compact={size.width<680}/>)}
 </>;
}
