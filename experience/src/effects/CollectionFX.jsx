import React,{useRef,useMemo,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {planetSurfaceTexture} from '../space/PlanetSurface.js';
import {COLORS} from '../space/DeepGalaxy.jsx';
import {galaxySpaceAt,launchAt,flightProgress} from '../space/worldOrbit.js';
import {pickupAt,smooth,COLLECT_START_MS,PER_WORLD_MS,CONTACT,RELEASE} from '../journey/choreography.js';
export {COLLECT_START_MS,PER_WORLD_MS};
import './collection.css';

function Miniature({world,order,rigPoseRef,clockRef,compact,short,completedCount,reducedMotion}){
 const orb=useRef(),trail=useRef(),sparks=useRef(),beam=useRef();
 const beamMatrices=useMemo(()=>({up:new THREE.Vector3(0,1,0),matrix:new THREE.Matrix4(),quat:new THREE.Quaternion(),scale:new THREE.Vector3(),mid:new THREE.Vector3()}),[]);
 const sparksGeometry=useMemo(()=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(26*3),3));
  return g;
 },[]);
 useEffect(()=>()=>sparksGeometry.dispose(),[sparksGeometry]);
 const trailGeometry=useMemo(()=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(16*3),3));
  return g;
 },[]);
 useEffect(()=>()=>trailGeometry.dispose(),[trailGeometry]);
 const texture=useMemo(()=>planetSurfaceTexture(world.index,COLORS[world.index],compact),[world.index,compact]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 useFrame(()=>{
  const pose=rigPoseRef.current,c=clockRef.current;if(!orb.current||!pose)return;
  const pick=pickupAt(c.ms,order),s=pose.scale;
  const origin=galaxySpaceAt(world.index,launchAt(order)+CONTACT*PER_WORLD_MS,compact,short,completedCount,reducedMotion);
  const source=new THREE.Vector3(origin.x,origin.y,origin.z);
  // The sphere stays in its orbit until the Skull Master's real hand arrives.
  // At palm contact, the orbital planet becomes a handheld miniature in place:
  // there is no fabricated flight to the character's legs or a dummy pickup.
  orb.current.visible=pick.t>=CONTACT&&!pick.stored&&pose.phase!=='offering';
  if(pick.t<CONTACT){
   orb.current.position.copy(source);
   orb.current.scale.setScalar(origin.scale/.135);
  }else if(pick.attached&&pose.grip){
   const take=smooth((pick.t-CONTACT)/.11);
   orb.current.position.copy(source).lerp(pose.grip,take);
   if(take>=1)orb.current.position.copy(pose.grip);
   orb.current.scale.setScalar(THREE.MathUtils.lerp(origin.scale/.135,s,take));
  }else{
   orb.current.position.copy(pose.mouth).add(new THREE.Vector3(0,-.24*s*smooth((pick.t-RELEASE)/.14),0));
   orb.current.scale.setScalar(s*(pick.t>=RELEASE?1-smooth((pick.t-.90)/.10):1));
  }
  // A short luminous tether shows one unbroken journey from the real orbit
  // into the hand. The source halo/ring is hidden when this flight begins.
  if(trail.current){
   const visible=!reducedMotion&&pick.t>CONTACT+.01&&pick.t<CONTACT+.11&&orb.current.visible;
   trail.current.visible=visible;
   if(sparks.current)sparks.current.visible=visible;
   if(beam.current)beam.current.visible=visible;
   if(visible){
    const attr=trailGeometry.getAttribute('position'),end=orb.current.position;
    for(let j=0;j<16;j++){
     const a=j/15,arc=Math.sin(Math.PI*a)*.08;
     attr.setXYZ(j,
      source.x+(end.x-source.x)*a+Math.sin(a*12+c.ms*.012)*arc,
      source.y+(end.y-source.y)*a+arc,
      source.z+(end.z-source.z)*a);
    }
    attr.needsUpdate=true;
    trailGeometry.computeBoundingSphere();
    if(beam.current){
     // A faceted curved energy ribbon replaces the former rigid straight rod.
     // Animate 16 GPU-instanced segments; no per-frame geometry allocations.
     const strand=u=>{
      const p=source.clone().lerp(end,u),arc=Math.sin(Math.PI*u);
      p.x+=arc*(.24+Math.sin(u*11+c.ms*.009)*.035)*s;
      p.y+=arc*.12*s;
      p.z+=arc*Math.cos(u*9+c.ms*.012)*.055*s;
      return p;
     };
     for(let k=0;k<16;k++){
      const a=strand(k/16),b=strand((k+1)/16);
      const direction=b.sub(a),length=direction.length(),u=(k+.5)/16;
      beamMatrices.mid.copy(a).addScaledVector(direction,.5);
      beamMatrices.quat.setFromUnitVectors(beamMatrices.up,direction.normalize());
      const radius=.018+.018*Math.sin(Math.PI*u);
      beamMatrices.scale.set(radius,length,radius);
      beamMatrices.matrix.compose(beamMatrices.mid,beamMatrices.quat,beamMatrices.scale);
      beam.current.setMatrixAt(k,beamMatrices.matrix);
     }
     beam.current.instanceMatrix.needsUpdate=true;
    }
    if(sparks.current){
     const sparkPos=sparksGeometry.getAttribute('position');
     const t=Math.max(0,Math.min(1,(pick.t-CONTACT)/.11));
     for(let i=0;i<26;i++){
      const u=((i/26+t*.9)%1),twist=u*12.56+i*2.4;
      const spread=.07*(1-u)*s;
      sparkPos.setXYZ(i,
       source.x+(end.x-source.x)*u+Math.cos(twist)*spread,
       source.y+(end.y-source.y)*u+Math.sin(Math.PI*u)*.12*s,
       source.z+(end.z-source.z)*u+Math.sin(twist)*spread);
     }
     sparkPos.needsUpdate=true;sparksGeometry.computeBoundingSphere();
    }
   }
  }
  orb.current.rotation.y=c.ms*.00018+order;
  const d=window.__galaxySkeletonDiagnostics;
  if(d){
   d.miniatures??={};d.miniatures[order]={stage:pick.stage,visible:orb.current.visible,
    position:orb.current.position.toArray(),sourceWorldIndex:world.index,atlasOrigin:source.toArray(),beamVisible:!!beam.current?.visible,attached:pick.attached,
    contactError:pick.attached&&pose.grip?orb.current.position.distanceTo(pose.grip):null};
  }
 },-1);
 return <>
  <group ref={orb}>
   <mesh><sphereGeometry args={[.135,24,16]}/><meshStandardMaterial map={texture} roughness={.62} metalness={.05}/></mesh>
   <mesh scale={1.10}><sphereGeometry args={[.135,16,12]}/><meshBasicMaterial color={COLORS[world.index]} transparent opacity={.12} side={THREE.BackSide} depthWrite={false}/></mesh>
  </group>
  <line ref={trail} geometry={trailGeometry} visible={false}>
   <lineBasicMaterial color={COLORS[world.index]} transparent opacity={.65} depthWrite={false} blending={THREE.AdditiveBlending}/>
  </line>
  <points ref={sparks} geometry={sparksGeometry} visible={false}>
   <pointsMaterial color={COLORS[world.index]} size={.105} sizeAttenuation
     transparent opacity={.88} depthWrite={false} blending={THREE.AdditiveBlending}/>
  </points>
  <instancedMesh ref={beam} args={[null,null,16]} visible={false} frustumCulled={false}>
   <cylinderGeometry args={[1,1,1,6,1,true]}/>
   <meshBasicMaterial color="#a3dbff" transparent opacity={.48} depthWrite={false}
     blending={THREE.AdditiveBlending}/>
  </instancedMesh>
 </>;
}
function Satchel({onOpenSack,rigPoseRef,clockRef,count}){
 const vault=useRef(),iris=useRef(),outer=useRef();
 useFrame(()=>{
  const pose=rigPoseRef.current;
  if(!vault.current||!pose)return;
  // This is a small dimensional pocket tethered to the living rig, not
  // a solid cylindrical 'pot' or rectangular cartoon prop.
  vault.current.position.copy(pose.bag);
  const order=clockRef.current.view?.activeIndex??-1;
  const t=order<0?0:pickupAt(clockRef.current.ms,order).t;
  const depositPulse=t>=RELEASE?Math.sin(Math.min(1,(t-RELEASE)/.16)*Math.PI):0;
  const scale=pose.scale*(.87+depositPulse*.13);
  vault.current.scale.setScalar(scale);
  const seconds=clockRef.current.ms/1000;
  if(iris.current)iris.current.rotation.z=-seconds*.85;
  if(outer.current)outer.current.rotation.z=seconds*.31;
 },-1);
 return <group ref={vault} onClick={e=>{e.stopPropagation();onOpenSack?.()}}>
  {/* Hollow void portal: flat and otherworldly, not a sack, bucket or pot.
      It is the entrance for mastered worlds and opens the same collection UI. */}
  <group position={[0,.19,.13]} rotation={[-.23,0,-.1]}>
   <mesh>
    <circleGeometry args={[.20,48]}/>
    <meshBasicMaterial color="#040711" side={THREE.DoubleSide}
      transparent opacity={.97} depthWrite={false}/>
   </mesh>
   <mesh>
    <ringGeometry args={[.145,.185,64]}/>
    <meshBasicMaterial color="#423259" side={THREE.DoubleSide}
      transparent opacity={.72} depthWrite={false}/>
   </mesh>
   <mesh ref={outer} position={[0,0,.015]}>
    <torusGeometry args={[.225,.013,9,56]}/>
    <meshBasicMaterial color="#a882d3" transparent opacity={.74}
      depthWrite={false}/>
   </mesh>
   <mesh ref={iris} position={[0,0,.029]}>
    <torusGeometry args={[.13,.011,8,48]}/>
    <meshBasicMaterial color="#e6a35c" transparent opacity={.92}
      depthWrite={false}/>
   </mesh>
   {Array.from({length:6},(_,i)=>{
     const angle=Math.PI*2*i/6;
     return <mesh key={i} position={[Math.cos(angle)*.217,Math.sin(angle)*.217,.031]}
       rotation={[0,0,angle]}>
      <octahedronGeometry args={[.028,0]}/>
      <meshBasicMaterial color={i%2?'#b5a8f5':'#cf9b62'}/>
     </mesh>;
   })}
   {/* Invisible touch area is local to the vault; it cannot steal planet clicks. */}
   <mesh position={[0,0,.033]}>
    <circleGeometry args={[.29,32]}/>
    <meshBasicMaterial transparent opacity={0} colorWrite={false}
      side={THREE.DoubleSide} depthWrite={false}/>
   </mesh>
  </group>
 </group>;
}
function OfferingOrb({worldIndex,rigPoseRef,clockRef,compact,reducedMotion,onSelect}){
 const orb=useRef();
 const color=COLORS[worldIndex];
 const texture=useMemo(()=>planetSurfaceTexture(worldIndex,color,compact),[worldIndex,color,compact]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 useFrame(state=>{
  const pose=rigPoseRef.current;if(!orb.current||!pose)return;
  orb.current.visible=pose.offerReveal>.45;
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
 return <>
 <group ref={orb} visible={false}
  onClick={e=>{e.stopPropagation();if(orb.current?.visible)onSelect?.(worldIndex)}}
  onPointerOver={()=>{document.body.style.cursor='pointer'}}
  onPointerOut={()=>{document.body.style.cursor=''}}>
  <mesh><sphereGeometry args={[.275,40,28]}/><meshStandardMaterial map={texture} roughness={.54} metalness={.06} emissive={color} emissiveIntensity={.12}/></mesh>
  <mesh scale={1.09}><sphereGeometry args={[.275,24,16]}/><meshBasicMaterial color={color} transparent opacity={.18} side={THREE.BackSide} depthWrite={false}/></mesh>
  {/* Slightly oversized invisible pick surface so the offered planet is touch-friendly. */}
  <mesh><sphereGeometry args={[.37,20,14]}/><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/></mesh>
  <pointLight intensity={1.4} color={color} distance={2.2}/>
 </group></>;
}
export default function CollectionFX({completed=[],collectedCount,clockRef,reducedMotion=false,onOpenSack,onSelectWorld,nextWorldIndex=0,rigPoseRef}){
 const compact=useThree(s=>s.size.width<700);
 const short=useThree(s=>s.size.height<780);
 return <>
  <Satchel onOpenSack={onOpenSack} count={collectedCount} rigPoseRef={rigPoseRef} clockRef={clockRef}/>
  <OfferingOrb worldIndex={nextWorldIndex} rigPoseRef={rigPoseRef} clockRef={clockRef} compact={compact} reducedMotion={reducedMotion} onSelect={onSelectWorld}/>
  {completed.slice(0,17).map((world,order)=><Miniature key={world.index} world={world} order={order} rigPoseRef={rigPoseRef} clockRef={clockRef} compact={compact} short={short} completedCount={completed.length} reducedMotion={reducedMotion}/>)}
 </>;
}
