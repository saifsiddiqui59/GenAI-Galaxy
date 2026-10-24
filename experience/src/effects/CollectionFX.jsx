import React,{useRef,useMemo,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {planetSurfaceTexture} from '../space/PlanetSurface.js';
import {COLORS} from '../space/DeepGalaxy.jsx';
import curriculum from '../../../data/curriculum.json';
import {pickupAt,smooth,COLLECT_START_MS,PER_WORLD_MS,RELEASE} from '../journey/choreography.js';
export {COLLECT_START_MS,PER_WORLD_MS};
import './collection.css';

function Miniature({world,order,rigPoseRef,clockRef,compact}){
 const orb=useRef();
 const texture=useMemo(()=>planetSurfaceTexture(world.index,COLORS[world.index],compact),[world.index,compact]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 useFrame(()=>{
  const pose=rigPoseRef.current,c=clockRef.current;if(!orb.current||!pose)return;
  const pick=pickupAt(c.ms,order),s=pose.scale;
  const active=c.view?.activeIndex??0;
  orb.current.visible=!pick.stored&&pose.phase!=='offering'&&c.ms>1450&&order<=Math.max(0,active)+2;
  if(pick.t<0)orb.current.position.copy(pose.staging).add(new THREE.Vector3(-(order-Math.max(0,active))*.28*s,0,-.12*s));
  else if(pick.t<.30)orb.current.position.copy(pose.staging);
  else if(pick.attached&&pose.grip)orb.current.position.copy(pose.grip);
  else orb.current.position.copy(pose.mouth).add(new THREE.Vector3(0,-.32*s*smooth((pick.t-RELEASE)/.14),0));
  orb.current.scale.setScalar(s*(pick.t>=RELEASE?1-smooth((pick.t-.90)/.10):1));
  orb.current.rotation.y=c.ms*.00018+order;
  const d=window.__galaxySkeletonDiagnostics;
  if(d){
   d.miniatures??={};d.miniatures[order]={stage:pick.stage,visible:orb.current.visible,
    position:orb.current.position.toArray(),attached:pick.attached,
    contactError:pick.attached&&pose.grip?orb.current.position.distanceTo(pose.grip):null};
  }
 },-1);
 return <group ref={orb}>
  <mesh><sphereGeometry args={[.135,24,16]}/><meshStandardMaterial map={texture} roughness={.62} metalness={.05}/></mesh>
  <mesh scale={1.10}><sphereGeometry args={[.135,16,12]}/><meshBasicMaterial color={COLORS[world.index]} transparent opacity={.12} side={THREE.BackSide} depthWrite={false}/></mesh>
 </group>;
}
function Satchel({onOpenSack,rigPoseRef,clockRef,count}){
 const bag=useRef();
 useFrame(()=>{
  const pose=rigPoseRef.current;if(!bag.current||!pose)return;
  bag.current.position.copy(pose.bag);
  const order=clockRef.current.view?.activeIndex??-1;
  const t=order<0?0:pickupAt(clockRef.current.ms,order).t;
  const pulse=t>=RELEASE?Math.sin(Math.min(1,(t-RELEASE)/.16)*Math.PI)*.055:0;
  bag.current.scale.set(pose.scale*(1+pulse),pose.scale*(1-pulse*.5),pose.scale*(1+pulse));
 },-1);
 return <group ref={bag} onClick={e=>{e.stopPropagation();onOpenSack?.()}}>
  {/* Soft leather profile, rather than a rigid bucket silhouette. Keep the mouth open for genuine deposits. */}
  <mesh scale={[1.10,.70,.80]}><sphereGeometry args={[.305,20,14]}/><meshStandardMaterial color="#85543f" roughness={.93}/></mesh>
  <mesh position={[0,-.10,.201]} scale={[1,.8,1]}><boxGeometry args={[.40,.18,.038]}/><meshStandardMaterial color="#a26c50" roughness={.91}/></mesh>
  <mesh position={[0,.22,0]} rotation={[-Math.PI/2,0,0]} scale={[1,.72,1]}>
   <circleGeometry args={[.245,28]}/><meshBasicMaterial color="#140f19" side={THREE.DoubleSide}/>
  </mesh>
  <mesh position={[0,.237,0]} rotation={[Math.PI/2,0,0]} scale={[1,.72,1]}>
   <torusGeometry args={[.248,.022,8,32]}/><meshStandardMaterial color="#e8b76e" metalness={.55} roughness={.4}/>
  </mesh>
  <mesh position={[0,-.015,.183]} rotation={[Math.PI/2,0,0]}>
   <cylinderGeometry args={[.075,.075,.025,6]}/><meshStandardMaterial color="#eac780" metalness={.55} roughness={.32} emissive="#9d6621" emissiveIntensity={count?.12:0}/>
  </mesh>
  <mesh position={[.32,.29,-.10]} rotation={[0,0,-.36]}><boxGeometry args={[.068,.73,.07]}/><meshStandardMaterial color="#624136" roughness={.9}/></mesh>
  <mesh position={[-.19,.04,.22]}><sphereGeometry args={[.023,8,6]}/><meshStandardMaterial color="#d4ad73" metalness={.45} roughness={.4}/></mesh>
  <mesh position={[.19,.04,.22]}><sphereGeometry args={[.023,8,6]}/><meshStandardMaterial color="#d4ad73" metalness={.45} roughness={.4}/></mesh>
 </group>;
}
function OfferingOrb({worldIndex,rigPoseRef,clockRef,compact,reducedMotion,onSelect}){
 const orb=useRef(),labelRef=useRef();
 const color=COLORS[worldIndex];
 const texture=useMemo(()=>planetSurfaceTexture(worldIndex,color,compact),[worldIndex,color,compact]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 useFrame(state=>{
  const pose=rigPoseRef.current;if(!orb.current||!pose)return;
  orb.current.visible=pose.offerReveal>.45;
  if(labelRef.current)labelRef.current.style.visibility=orb.current.visible?'visible':'hidden';
  orb.current.position.copy(pose.offer);
  orb.current.scale.setScalar(pose.scale*smooth((pose.offerReveal-.45)/.55));
  orb.current.rotation.y=reducedMotion?0:clockRef.current.ms*.00012;
  const diagnostics=window.__galaxySkeletonDiagnostics;
  if(diagnostics&&orb.current.visible){
   const p=orb.current.getWorldPosition(new THREE.Vector3()).project(state.camera);
   diagnostics.offeredHitPoint=[(p.x+1)*state.size.width/2,(1-p.y)*state.size.height/2];
   diagnostics.offeredWorldIndex=worldIndex;
  }
 },-1);
 return <group ref={orb} visible={false}
  onClick={e=>{e.stopPropagation();if(orb.current?.visible)onSelect?.(worldIndex)}}
  onPointerOver={()=>{document.body.style.cursor='pointer'}}
  onPointerOut={()=>{document.body.style.cursor=''}}>
  <mesh><sphereGeometry args={[.275,40,28]}/><meshStandardMaterial map={texture} roughness={.54} metalness={.06} emissive={color} emissiveIntensity={.12}/></mesh>
  <mesh scale={1.09}><sphereGeometry args={[.275,24,16]}/><meshBasicMaterial color={color} transparent opacity={.18} side={THREE.BackSide} depthWrite={false}/></mesh>
  {/* Slightly oversized invisible pick surface so the offered planet is touch-friendly. */}
  <mesh><sphereGeometry args={[.37,20,14]}/><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/></mesh>
  <Html center position={[0,-.47,0]} style={{pointerEvents:'auto',whiteSpace:'nowrap'}}>
   <button ref={labelRef} type="button" style={{visibility:'hidden'}} className="galaxy-offer-label" onClick={e=>{e.stopPropagation();onSelect?.(worldIndex)}}>NEXT · {curriculum[worldIndex]?.title || 'Learning world'} ↗</button>
  </Html>
  <pointLight intensity={1.4} color={color} distance={2.2}/>
 </group>;
}
export default function CollectionFX({completed=[],collectedCount,clockRef,reducedMotion=false,onOpenSack,onSelectWorld,nextWorldIndex=0,rigPoseRef}){
 const compact=useThree(s=>s.size.width<700);
 return <>
  <Satchel onOpenSack={onOpenSack} count={collectedCount} rigPoseRef={rigPoseRef} clockRef={clockRef}/>
  <OfferingOrb worldIndex={nextWorldIndex} rigPoseRef={rigPoseRef} clockRef={clockRef} compact={compact} reducedMotion={reducedMotion} onSelect={onSelectWorld}/>
  {completed.slice(0,17).map((world,order)=><Miniature key={world.index} world={world} order={order} rigPoseRef={rigPoseRef} clockRef={clockRef} compact={compact}/>)}
 </>;
}
