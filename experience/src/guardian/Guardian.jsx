import React, {useEffect, useRef, useState, Suspense} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF, useAnimations} from '@react-three/drei';
import * as THREE from 'three';

export const ANIMATION_STATES=Object.freeze({
  arriving:'Walking',
  collecting:'Wave',
  offering:'ThumbsUp',
  idle:'Idle',
  celebrating:'Dance'
});
export function clipFor(phase, available){
  const expected=ANIMATION_STATES[phase]||'Idle';
  if(available?.includes(expected))return expected;
  if(available?.includes('Idle'))return 'Idle';
  return available?.[0]||null;
}
export function phaseX(phase,elapsed,initial=-5,stopping=-1.5){
  if(phase!=='arriving')return stopping;
  return Math.min(stopping, initial+Math.max(0,elapsed)*1.8);
}
function GuardianModel({phase, onPosition}){
 const file=import.meta.env.BASE_URL+'models/guardian.glb';
 const {scene,animations}=useGLTF(file);
 const {actions,names}=useAnimations(animations,scene);
 const character=useRef();
 const elapsed=useRef(0);
 const previousPhase=useRef(phase);
 useEffect(()=>{
   const name=clipFor(phase,names);
   const active=actions[name];
   if(!active)return undefined;
   active.reset().fadeIn(.28).play();
   Object.entries(actions).forEach(([key,act])=>{if(key!==name)act?.fadeOut(.28)});
   return ()=>active.fadeOut(.2);
 },[actions,names,phase]);
 useFrame((_,dt)=>{
   if(previousPhase.current!==phase){previousPhase.current=phase;elapsed.current=0;}
   elapsed.current+=Math.min(dt,.08);
   const x=phaseX(phase,elapsed.current);
   if(character.current){
      character.current.position.x=THREE.MathUtils.damp(character.current.position.x,x,5,dt);
      character.current.rotation.y=.14;
      onPosition?.(character.current.position.x);
   }
 });
 return <group ref={character} position={[-5,-1.8,0]} scale={.52}>
   <primitive object={scene} rotation={[0,Math.PI*.18,0]}/>
 </group>;
}
export function GuardianFallback({phase}){
 const mesh=useRef();
 useFrame((_,delta)=>{
   if(mesh.current && phase!=='idle')mesh.current.rotation.y+=delta*.18;
 });
 return <group ref={mesh} position={[-1.5,-.1,0]}>
    <mesh><icosahedronGeometry args={[.55,2]}/><meshStandardMaterial color="#a5b4fc" metalness={.6} roughness={.2}/></mesh>
    <pointLight intensity={1.4} color="#cbb6ff" distance={5}/>
  </group>;
}
export default function Guardian({phase='idle',onPosition}){
 const [assetError,setAssetError]=useState(false);
 if(assetError) return <GuardianFallback phase={phase}/>;
 return <Suspense fallback={<GuardianFallback phase={phase}/>}>
   <GuardianModelWithBoundary phase={phase} onPosition={onPosition} onError={()=>setAssetError(true)}/>
 </Suspense>;
}
// This narrow error boundary prevents a blocked .glb from blanking the home galaxy.
class GuardianModelWithBoundary extends React.Component{
 constructor(props){super(props);this.state={failed:false}}
 static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(error){console.warn('Guardian GLB unavailable; keeping Galaxy navigable',error?.message)}
 render(){
  if(this.state.failed)return <GuardianFallback phase={this.props.phase}/>;
  return <GuardianModel phase={this.props.phase} onPosition={this.props.onPosition}/>;
 }
}
