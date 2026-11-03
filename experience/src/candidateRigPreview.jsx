/* V6.11 research-only visual gate. The publisher's ACTUAL full-quality GLB
 * is downloaded ephemerally into experience/public/research by CI. This page
 * is NOT linked from the Galaxy and must NOT ship or change production.
 * Keep its source materials unmodified: a cowboy silhouette cannot be
 * "made accepted" by hiding a hat or repainting it in a screenshot.
 */
import React,{Suspense,useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls,useGLTF} from '@react-three/drei';
import {clone as cloneSkinned} from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {mapSkinnedMixamoRig} from './guardian/candidateSkinnedRig.js';

const GLB='/research/v611-skeleton-gunslinger.glb';
const round=v=>Number(v.toFixed(4));
const worldPosition=b=>b.getWorldPosition(new THREE.Vector3());
const vec=v=>[round(v.x),round(v.y),round(v.z)];
function Actor({clip}){
 const gltf=useGLTF(GLB);
 // SkeletonUtils.clone preserves the bind poses and skin attachments.
 const actor=useMemo(()=>cloneSkinned(gltf.scene),[gltf.scene]);
 const rig=useMemo(()=>mapSkinnedMixamoRig(actor),[actor]);
 const mixer=useMemo(()=>new THREE.AnimationMixer(actor),[actor]);
 const geometryFrame=useMemo(()=>{
   actor.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(actor);
   const min=box.min.clone(),center=box.getCenter(new THREE.Vector3());
   const height=Math.max(.001,box.max.y-box.min.y);
   const factor=3.65/height;
   return {position:[-center.x*factor,-min.y*factor,-center.z*factor],
     scale:factor,originalHeight:round(height)};
 },[actor]);
 useEffect(()=>{
   const selected=gltf.animations.find(a=>a.name.toLowerCase()===clip);
   if(!selected)throw Error('Missing source animation '+clip);
   mixer.stopAllAction();mixer.setTime(0);
   mixer.clipAction(selected).reset().setLoop(THREE.LoopRepeat,Infinity).play();
   const existing=window.__actorCandidate||{};
   window.__actorCandidate={...existing,ready:true,clip,
     source:'AutoSprite-Skeleton-Gunslinger',visuallyApproved:false,
     originalHeight:geometryFrame.originalHeight,normalizedScale:geometryFrame.scale,
     jointCount:rig.boneCount,
     animationClips:gltf.animations.map(a=>({name:a.name,duration:round(a.duration)})),
     skinnedMeshes:(()=>{let n=0;actor.traverse(o=>{if(o.isSkinnedMesh)n++});return n})(),
     sourceMaterials:(()=>{const m=new Set();actor.traverse(o=>{if(o.isMesh)m.add(o.material)});return m.size})()};
   document.getElementById('status').textContent='Real source rig: '+rig.boneCount+
       ' joints · '+clip+' · unapproved artwork · inspect face, hands and feet';
   return ()=>{mixer.stopAllAction();delete window.__actorCandidate?.ready};
 },[clip,actor,gltf.animations,mixer,geometryFrame,rig]);
 useFrame((_,dt)=>{
   mixer.update(Math.min(dt,.06));
   // World-space marker coordinates help detect root translation/foot slide.
   actor.updateMatrixWorld(true);
   const l=rig.sides.left,r=rig.sides.right;
   if(window.__actorCandidate?.ready){
      window.__actorCandidate.pose={
       hips:vec(worldPosition(rig.hips)),
       leftHand:vec(worldPosition(l.arm[2])),
       rightHand:vec(worldPosition(r.arm[2])),
       leftFoot:vec(worldPosition(l.leg[2])),
       rightFoot:vec(worldPosition(r.leg[2])),
       leftKnee:vec(worldPosition(l.leg[1])),
       rightKnee:vec(worldPosition(r.leg[1])),
       walkTime:round(mixer.time)
      };
   }
 });
 return <primitive object={actor} position={geometryFrame.position} scale={geometryFrame.scale}/>;
}
function Stage(){
 const [clip,setClip]=useState('idle');
 useEffect(()=>{
   const idle=document.querySelector('#idle'),walk=document.querySelector('#walk');
   const update=v=>()=>setClip(v);
   const a=update('idle'),b=update('walk_loop');
   idle.addEventListener('click',a);walk.addEventListener('click',b);
   return ()=>{idle.removeEventListener('click',a);walk.removeEventListener('click',b)};
 },[]);
 useEffect(()=>{
   document.querySelector('#idle').setAttribute('aria-pressed',String(clip==='idle'));
   document.querySelector('#walk').setAttribute('aria-pressed',String(clip==='walk_loop'));
 },[clip]);
 return <Canvas gl={{antialias:true,alpha:false,powerPreference:'high-performance'}}
    camera={{position:[0,2.35,7.1],fov:40,near:.1,far:100}}
    onCreated={({gl})=>{gl.setClearColor('#0b0e1b');window.__actorCanvasCreated=true}}>
   <color attach="background" args={['#101523']}/>
   <hemisphereLight args={['#c9d8ff','#21111f',2.4]}/>
   <ambientLight intensity={.35}/>
   <directionalLight position={[4,7,6]} intensity={3.1} color="#eaf2ff"/>
   <directionalLight position={[-4,4,-5]} intensity={2.1} color="#9c8fff"/>
   <directionalLight position={[1,2,-3]} intensity={1.4} color="#ffc7a0"/>
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.032,0]}>
    <planeGeometry args={[200,200]}/>
    <meshStandardMaterial color="#0e1628" roughness={1}/>
   </mesh>
   <gridHelper args={[10,20,'#4c5b7b','#29364e']} position={[0,-.02,0]}/>
   <Suspense fallback={null}><Actor clip={clip}/></Suspense>
   <OrbitControls target={[0,1.66,0]} enableDamping minDistance={3.5} maxDistance={11}
     maxPolarAngle={Math.PI/2+.12}/>
 </Canvas>;
}
window.__actorCandidate={ready:false,visuallyApproved:false};
createRoot(document.getElementById('rig-stage')).render(<Stage/>);
