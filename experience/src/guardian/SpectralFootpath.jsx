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
 const left=useRef(),right=useRef(),points=useRef(),surface=useRef(),keel=useRef();
 const compact=useThree(s=>s.size.width<700);
 const geo=useMemo(()=>[makeLine(),makeLine(),makeLine()],[]);
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
 useFrame(()=>{
  const pose=rigPoseRef?.current;
  const ready=!reducedMotion&&pose?.walkingRouteFrom&&pose.walkingRouteTo;
  if(!left.current||!right.current||!points.current||!surface.current||!keel.current)return;
  left.current.visible=!!ready;right.current.visible=!!ready;points.current.visible=!!ready;surface.current.visible=!!ready;keel.current.visible=!!ready;
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
    attr.setXYZ(i,p.x+nx*side*.45*scale,p.y+offset,p.z+nz*side*.45*scale);
    deck.getAttribute('position').setXYZ(i*2+idx,p.x+nx*side*.45*scale,p.y+offset-.018*scale,p.z+nz*side*.45*scale);
   }
  }
  for(let i=0;i<=N;i++){
   const p=walkingPathPoint(a,b,i/N,compact);
   geo[2].getAttribute('position').setXYZ(i,p.x,p.y+offset-.028*scale,p.z);
  }
  geo.forEach(g=>{g.attributes.position.needsUpdate=true;g.computeBoundingSphere()});
  deck.attributes.position.needsUpdate=true;deck.computeVertexNormals();deck.computeBoundingSphere();
  // Short, evenly spaced luminous stepping plates, light enough not to
  // compete with the seventeen clickable world markers.
  const spacing=10;
  for(let i=0;i<10;i++){
   const t=i/9,site=walkingPathPoint(a,b,t,compact);
   const visible=i<spacing;
   matrix.compose(new THREE.Vector3(site.x,site.y+offset-.06*scale,site.z),new THREE.Quaternion(),
    new THREE.Vector3(visible ? 1.05*scale : 0.00001,visible ? 0.85*scale : 0.00001,visible ? 1.05*scale : 0.00001));
   points.current.setMatrixAt(i,matrix);
  }
  points.current.instanceMatrix.needsUpdate=true;
  if(window.__galaxySkeletonDiagnostics){
   window.__galaxySkeletonDiagnostics.walkableRoute={from:[a.x,a.y,a.z],to:[b.x,b.y,b.z],
    railsVisible:true,solidWalkway:true,progress:pose.walkingRouteProgress,stepPlates:spacing,
    stableFloorOffset:offset};
  }
 },-1);
 return <>
  <mesh ref={surface} geometry={deck} visible={false}>
    <meshBasicMaterial color="#26394f" transparent opacity={.54} side={THREE.DoubleSide} depthWrite={false}/>
  </mesh>
  <line ref={left} geometry={geo[0]} visible={false}>
   <lineBasicMaterial color="#8fecef" transparent opacity={.83} depthWrite={false}/>
  </line>
  <line ref={right} geometry={geo[1]} visible={false}>
   <lineBasicMaterial color="#9cb0ed" transparent opacity={.72} depthWrite={false}/>
  </line>
  <line ref={keel} geometry={geo[2]} visible={false}>
   <lineBasicMaterial color="#d4ba82" transparent opacity={.35} depthWrite={false}/>
  </line>
  <instancedMesh ref={points} args={[null,null,10]} visible={false} frustumCulled={false}>
   <cylinderGeometry args={[.36,.4,.045,12]}/>
   <meshStandardMaterial color="#546d91" emissive="#5e80ad" emissiveIntensity={.32}
    transparent opacity={.43} metalness={.34} roughness={.52} depthWrite={false}/>
  </instancedMesh>
 </>;
}
