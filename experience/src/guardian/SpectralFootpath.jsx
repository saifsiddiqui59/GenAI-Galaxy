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
 const left=useRef(),right=useRef(),points=useRef();
 const compact=useThree(s=>s.size.width<700);
 const geo=useMemo(()=>[makeLine(),makeLine()],[]);
 useEffect(()=>()=>geo.forEach(g=>g.dispose()),[geo]);
 const matrix=new THREE.Matrix4();
 const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0));
 useFrame(()=>{
  const pose=rigPoseRef?.current;
  const ready=!reducedMotion&&pose?.walking&&pose.walkingRouteFrom&&pose.walkingRouteTo;
  if(!left.current||!right.current||!points.current)return;
  left.current.visible=!!ready;right.current.visible=!!ready;points.current.visible=!!ready;
  if(!ready)return;
  const a=pose.walkingRouteFrom,b=pose.walkingRouteTo,scale=pose.scale;
  const feet=[pose.footL,pose.footR].filter(Boolean);
  // A line under the ACTUAL rig ankles, never in the middle of the torso.
  const ankleY=feet.length?feet.reduce((sum,f)=>sum+f[1],0)/feet.length:pose.bodyPosition.y-.2*scale;
  const offset=THREE.MathUtils.clamp(ankleY-pose.bodyPosition.y-.10*scale,-1.8*scale,.35*scale);
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.max(.001,Math.hypot(dx,dz));
  const nx=-dz/len,nz=dx/len;
  for(let i=0;i<=N;i++){
   const t=i/N,p=walkingPathPoint(a,b,t,compact);
   for(const [idx,side] of [-1,1].entries()){
    const attr=geo[idx].getAttribute('position');
    attr.setXYZ(i,p.x+nx*side*.24*scale,p.y+offset,p.z+nz*side*.24*scale);
   }
  }
  geo.forEach(g=>{g.attributes.position.needsUpdate=true;g.computeBoundingSphere()});
  // Short, evenly spaced luminous stepping plates, light enough not to
  // compete with the seventeen clickable world markers.
  const spacing=compact?5:9;
  for(let i=0;i<10;i++){
   const t=i/9,site=walkingPathPoint(a,b,t,compact);
   const visible=i<spacing;
   matrix.compose(new THREE.Vector3(site.x,site.y+offset-.016*scale,site.z),rotation,
    new THREE.Vector3(visible?.26*scale:.00001,visible?.26*scale:.00001,visible?.26*scale:.00001));
   points.current.setMatrixAt(i,matrix);
  }
  points.current.instanceMatrix.needsUpdate=true;
  if(window.__galaxySkeletonDiagnostics){
   window.__galaxySkeletonDiagnostics.walkableRoute={from:[a.x,a.y,a.z],to:[b.x,b.y,b.z],
    railsVisible:true,progress:pose.walkingRouteProgress,stepPlates:spacing};
  }
 },-1);
 return <>
  <line ref={left} geometry={geo[0]} visible={false}>
   <lineBasicMaterial color="#72b9d1" transparent opacity={.28} depthWrite={false}/>
  </line>
  <line ref={right} geometry={geo[1]} visible={false}>
   <lineBasicMaterial color="#b6a0df" transparent opacity={.28} depthWrite={false}/>
  </line>
  <instancedMesh ref={points} args={[null,null,10]} visible={false} frustumCulled={false}>
   <ringGeometry args={[.65,.75,24]}/>
   <meshBasicMaterial color="#8bb4d9" transparent opacity={.22} side={THREE.DoubleSide} depthWrite={false}/>
  </instancedMesh>
 </>;
}
