/* A walkable spectral bridge follows the SAME 3D curve as the character's
 * actual root motion. It has no hit targets, no ground teleport and no sphere
 * replacement; the true world stays in its orbit until real palm contact.
 */
import React,{useMemo,useRef,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {walkingPathPoint} from '../journey/orbitalApproach.js';

const N=42;
function makeLine(){
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((N+1)*3),3));
 g.setDrawRange(0,N+1);
 return g;
}
export default function SpectralFootpath({rigPoseRef,reducedMotion=false}){
 const left=useRef(),right=useRef(),points=useRef(),surface=useRef();
 const compact=useThree(s=>s.size.width<700);
 const geo=useMemo(()=>[makeLine(),makeLine()],[]);
 const deck=useMemo(()=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((N+1)*2*3),3));
  const indices=[];
  for(let i=0;i<N;i++){
   const a=i*2,b=a+2;
   indices.push(a,a+1,b,a+1,b+1,b);
  }
  g.setIndex(indices);return g;
 },[]);
 useEffect(()=>()=>{geo.forEach(g=>g.dispose());deck.dispose()},[geo,deck]);
 const matrix=new THREE.Matrix4();
 const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0));
 useFrame(()=>{
  const pose=rigPoseRef?.current;
  const ready=!reducedMotion&&pose?.walkingRouteFrom&&pose.walkingRouteTo;
  if(!left.current||!right.current||!points.current||!surface.current)return;
  left.current.visible=!!ready;right.current.visible=!!ready;points.current.visible=!!ready;surface.current.visible=!!ready;
  if(!ready)return;
  const a=pose.walkingRouteFrom,b=pose.walkingRouteTo,scale=pose.scale;
  // Same constant neutral bone height as the actual foot IK. Never derive
  // the bridge height from moving ankle bones; it must NOT bob or skate.
  const offset=(Number.isFinite(pose.walkFloorOffset)?pose.walkFloorOffset:-.12)*scale;
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.max(.001,Math.hypot(dx,dz));
  const nx=-dz/len,nz=dx/len;
  for(let i=0;i<=N;i++){
   const t=i/N,p=walkingPathPoint(a,b,t,compact);
   for(const [idx,side] of [-1,1].entries()){
    const attr=geo[idx].getAttribute('position');
    attr.setXYZ(i,p.x+nx*side*.33*scale,p.y+offset,p.z+nz*side*.33*scale);
    deck.getAttribute('position').setXYZ(i*2+idx,p.x+nx*side*.33*scale,p.y+offset-.01*scale,p.z+nz*side*.33*scale);
   }
  }
  geo.forEach(g=>{g.attributes.position.needsUpdate=true;g.computeBoundingSphere()});
  deck.attributes.position.needsUpdate=true;deck.computeVertexNormals();deck.computeBoundingSphere();
  // Short, evenly spaced luminous stepping plates, light enough not to
  // compete with the seventeen clickable world markers.
  const spacing=compact?5:9;
  for(let i=0;i<10;i++){
   const t=i/9,site=walkingPathPoint(a,b,t,compact);
   const visible=i<spacing;
   matrix.compose(new THREE.Vector3(site.x,site.y+offset-.016*scale,site.z),rotation,
    new THREE.Vector3(visible ? 0.43*scale : 0.00001,visible ? 0.26*scale : 0.00001,visible ? 0.26*scale : 0.00001));
   points.current.setMatrixAt(i,matrix);
  }
  points.current.instanceMatrix.needsUpdate=true;
  if(window.__galaxySkeletonDiagnostics){
   window.__galaxySkeletonDiagnostics.walkableRoute={from:[a.x,a.y,a.z],to:[b.x,b.y,b.z],
    railsVisible:true,progress:pose.walkingRouteProgress,stepPlates:spacing,
    stableFloorOffset:offset};
  }
 },-1);
 return <>
  <mesh ref={surface} geometry={deck} visible={false}>
    <meshBasicMaterial color="#769fcb" transparent opacity={.11} side={THREE.DoubleSide} depthWrite={false}/>
  </mesh>
  <line ref={left} geometry={geo[0]} visible={false}>
   <lineBasicMaterial color="#72b9d1" transparent opacity={.59} depthWrite={false}/>
  </line>
  <line ref={right} geometry={geo[1]} visible={false}>
   <lineBasicMaterial color="#b6a0df" transparent opacity={.28} depthWrite={false}/>
  </line>
  <instancedMesh ref={points} args={[null,null,10]} visible={false} frustumCulled={false}>
   <ringGeometry args={[.65,.75,24]}/>
   <meshBasicMaterial color="#8bb4d9" transparent opacity={.42} side={THREE.DoubleSide} depthWrite={false}/>
  </instancedMesh>
 </>;
}
