import React,{useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {layoutWorlds,COLORS} from '../space/DeepGalaxy.jsx';
import './collection.css';
export const COLLECT_START_MS=1700;
export const PER_WORLD_MS=560;
export const BAG_POSITION=[-2.05,-.57,1.1];
export function collectPosition(world,index,time,disabled=false){
 const to=new THREE.Vector3(...BAG_POSITION);
 const start=new THREE.Vector3(world.x,world.y,world.z+.35);
 if(disabled)return {point:to,arrived:true};
 const elapsed=time-(COLLECT_START_MS+index*PER_WORLD_MS);
 const t=THREE.MathUtils.clamp(elapsed/Math.min(520,PER_WORLD_MS),0,1);
 const eased=t*t*(3-2*t);
 const point=start.lerp(to,eased);
 point.y+=Math.sin(Math.PI*t)*1.1;
 point.z+=Math.sin(Math.PI*t)*.75;
 return {point,arrived:t>=1};
}
function CollectedOrb({world,order,reducedMotion,epoch,ready}){
 const mesh=useRef(),halo=useRef();
 const worldLayout=layoutWorlds()[world.index];
 const begin=useRef(null);
 useFrame(({clock},delta)=>{
  if(!mesh.current||!worldLayout)return;
  if(begin.current?.epoch!==epoch)begin.current={epoch,start:clock.elapsedTime*1000};
  const time=clock.elapsedTime*1000-begin.current.start;
  const {point,arrived}=collectPosition(worldLayout,order,time,reducedMotion);
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
function Satchel({onOpenSack,count}){
 const bag=useRef();
 useFrame((state)=>{
  if(bag.current)bag.current.rotation.z=Math.sin(state.clock.elapsedTime*1.7)*.035;
 });
 return <group ref={bag} position={BAG_POSITION}
  onClick={e=>{e.stopPropagation();onOpenSack?.()}}>
   <mesh scale={[.55,.4,.3]}>
      <sphereGeometry args={[1,28,22]}/>
      <meshStandardMaterial color="#aa6f59" roughness={.84} metalness={.05}/>
   </mesh>
   <mesh position={[0,.32,0]} rotation={[Math.PI/2,0,0]}>
      <torusGeometry args={[.22,.05,8,28]}/>
      <meshStandardMaterial color="#e8b77c" roughness={.44} metalness={.26}/>
   </mesh>
   <mesh position={[0,.08,.28]} scale={[.17,.16,.06]}>
      <sphereGeometry args={[1,16,16]}/>
      <meshStandardMaterial color={count>0?"#f7d99e":"#6d4b5c"} emissive="#a77bbf" emissiveIntensity={count>0?.8:.05}/>
   </mesh>
   <pointLight color="#dfb5ff" intensity={count>0?1.5:.25} distance={3}/>
 </group>;
}
export default function CollectionFX({completed=[],reducedMotion=false,epoch=0,onOpenSack}){
 return <>
   <Satchel onOpenSack={onOpenSack} count={completed.length}/>
   {completed.filter(w=>Number.isInteger(w.index)&&w.index>=0&&w.index<17).slice(0,17).map((world,order)=>
     <CollectedOrb key={world.index} world={world} order={order}
      epoch={epoch} reducedMotion={reducedMotion} ready={true}/>)}
 </>;
}
