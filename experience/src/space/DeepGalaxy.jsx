import React,{useMemo,useRef,useEffect,useState} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {planetSurfaceTexture} from './PlanetSurface.js';
import {atlasLayout} from './worldAnchors.js';
import {orbitAt,planetHiddenFromAtlas,ORBIT_CENTER,ORBIT_Y_ASPECT} from './worldOrbit.js';
import {overlapsGuardian} from './markerClearance.js';
import {cinematicLayoutAt} from './cinematicLayout.js';
import SpaceDepthFX from './SpaceDepthFX.jsx';
import curriculum from '../../../data/curriculum.json';
export const PLANET_COUNT=17;
export const COLORS=['#74cce5','#b7a0e9','#e4b57c','#a8dfed','#7dceb3','#dfb77e','#c78d73','#91b4eb','#a7ca9c','#d3b1f0','#78b8dc','#deb28d','#9ad0c1','#b9a3e5','#e2bb8e','#83b8d6','#c894bf'];
export function layoutWorlds(count=PLANET_COUNT){return atlasLayout(count)}
export function starData(count=920){
 const positions=new Float32Array(count*3);let seed=314159265;
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<count;i++){
  positions[i*3]=(rand()-.5)*65;positions[i*3+1]=(rand()-.5)*38;positions[i*3+2]=-9-rand()*35;
 }
 return positions;
}
function Starfield({lowPower}){
 const geo=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(starData(lowPower?420:1300),3));return g},[lowPower]);
 useEffect(()=>()=>geo.dispose(),[geo]);
 return <points geometry={geo}><pointsMaterial color="#c6d3ed" size={.035} transparent opacity={.75} depthWrite={false}/></points>;
}
const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const fragment=`precision highp float;varying vec2 vUv;uniform float time;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
void main(){
 vec2 p=vUv*5.;p.x+=time*.002;
 float f=.52*noise(p)+.27*noise(p*2.1+4.)+.13*noise(p*4.3+7.);
 float band=exp(-pow((vUv.y-.42)-(vUv.x-.5)*.38,2.)*24.);
 float veil=smoothstep(.25,.86,f)*band;
 vec3 violet=vec3(.082,.035,.17),blue=vec3(.015,.10,.17);
 vec3 col=mix(violet,blue,smoothstep(.2,.9,vUv.x));
 col*=veil*1.45;
 col+=vec3(.12,.074,.12)*pow(veil,3.)*1.8;
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
function NebulaCloud({reducedMotion,clockRef}){
 const mat=useRef();const uniforms=useMemo(()=>({time:{value:0}}),[]);
 useFrame(()=>{if(mat.current&&!reducedMotion)mat.current.uniforms.time.value=clockRef.current.ms*.001});
 return <mesh position={[0,0,-36]} scale={[95,62,1]} renderOrder={-10}>
  <planeGeometry/><shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} depthWrite={false}/>
 </mesh>;
}
// Dim ellipse lanes make the 360° revolution perceptible without UI clutter.
function OrbitLanes(){
 const geometries=useMemo(()=>[1.05,1.72,2.42,3.20].map(r=>{
  const p=[];for(let i=0;i<128;i++){
   const a=i/128*Math.PI*2;
   p.push(r*Math.cos(a),r*ORBIT_Y_ASPECT*Math.sin(a),0);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return g;
 }),[]);
 useEffect(()=>()=>geometries.forEach(g=>g.dispose()),[geometries]);
 return <group position={[ORBIT_CENTER.x,ORBIT_CENTER.y,-3.65]}>
  {geometries.map((geo,i)=><lineLoop key={i} geometry={geo}>
   <lineBasicMaterial color="#8aaecb" transparent opacity={.09+i*.012} depthWrite={false}/>
  </lineLoop>)}
 </group>;
}
function Planet({world,mastered,collectionOrder=-1,recommended,selected,onSelect,reducedMotion,lowPower,clockRef}){
 const group=useRef(),halo=useRef(),ring=useRef(),collectedBeacon=useRef(),orbit=useRef(),indexMarker=useRef(),titleMarker=useRef(),projection=useRef(new THREE.Vector3()),[hover,setHover]=useState(false);
 const color=COLORS[world.index];
 const surface=useMemo(()=>planetSurfaceTexture(world.index,color,lowPower),[world.index,color,lowPower]);
 useEffect(()=>()=>surface.dispose(),[surface]);
 useFrame(state=>{
  const ms=clockRef.current.ms;
  if(orbit.current){
   const p=orbitAt(world,ms);orbit.current.position.set(p.x,p.y,p.z);
   // Drei Html elements render on top of WebGL, so use projected bounding
   // coordinates to prevent labels painting over the skull or its dark hood.
   const pos=orbit.current.localToWorld(projection.current.set(0,-world.scale-.085,0)).project(state.camera);
   const x=(pos.x+1)*state.size.width/2,y=(1-pos.y)*state.size.height/2;
   const hidden=overlapsGuardian(x,y,state.size.width,state.size.height,lowPower);
   if(indexMarker.current)indexMarker.current.style.visibility=hidden?'hidden':'visible';
   if(titleMarker.current)titleMarker.current.style.visibility=hidden?'hidden':'visible';
  }
  const transferred=planetHiddenFromAtlas(ms,collectionOrder,reducedMotion);
  if(group.current){group.current.rotation.y=reducedMotion?world.index:ms*.000045+world.index;group.current.visible=!transferred}
  if(halo.current)halo.current.visible=!transferred;
  if(ring.current)ring.current.visible=!transferred;
  if(collectedBeacon.current)collectedBeacon.current.visible=transferred;
 });
 return <group ref={orbit} position={[world.x,world.y,world.z]}
  onClick={e=>{e.stopPropagation();onSelect?.(world.index)}}
  onPointerOver={()=>{setHover(true);document.body.style.cursor='pointer'}}
  onPointerOut={()=>{setHover(false);document.body.style.cursor=''}}>
  <group ref={group}>
   <mesh>
    <sphereGeometry args={[world.scale,lowPower?28:40,lowPower?20:28]}/>
    <meshStandardMaterial map={surface} bumpMap={surface} bumpScale={.012} roughness={world.index%3===0?.54:.82} metalness={.02} emissive={color} emissiveIntensity={.025}/>
   </mesh>
  </group>
  {/* Invisible touch/pen target is larger than the rendered planet; navigator remains keyboard accessible. */}
  <mesh>
   <sphereGeometry args={[Math.max(world.scale*1.28,lowPower?.42:.36),16,12]}/>
   <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false}/>
  </mesh>
  <mesh ref={halo} scale={1.085}><sphereGeometry args={[world.scale,24,16]}/><meshBasicMaterial color={color} transparent opacity={hover||selected?.25:.12} depthWrite={false} side={THREE.BackSide}/></mesh>
  {(mastered||recommended||world.index%6===5)&&<mesh ref={ring} rotation={[1.15,.16,.35]}>
   <ringGeometry args={[world.scale*1.32,world.scale*(recommended?1.41:1.72),64]}/>
   <meshBasicMaterial color={mastered?'#dfbc75':color} side={THREE.DoubleSide} transparent opacity={mastered?.8:.4} depthWrite={false}/>
  </mesh>}
  {/* A mastered world becomes a tiny named navigation beacon, not an empty giant ring. */}
  {mastered&&<mesh ref={collectedBeacon} visible={false}>
   <sphereGeometry args={[world.scale*.18,12,9]}/>
   <meshBasicMaterial color="#d4c39f" transparent opacity={.65} depthWrite={false}/>
  </mesh>}
  {/* Every world keeps a numbered, accessible marker; expand long names only when useful. */}
  <Html center position={[0,-world.scale-.085,0]} style={{pointerEvents:'none'}}>
   <span ref={indexMarker} className="planet-index-caption" data-world-index={world.index} title={curriculum[world.index].title} aria-label={curriculum[world.index].title}>{String(world.index+1).padStart(2,'0')}</span>
  </Html>
  {!lowPower&&(hover||recommended||selected)&&<Html center position={[0,-world.scale-.34,0]} style={{pointerEvents:'none'}}>
   <div ref={titleMarker} className={'planet-caption'+(recommended?' planet-caption-next':'')} data-world-label={world.index} title={curriculum[world.index].title}>
    <strong>{curriculum[world.index].title}</strong>
   </div>
  </Html>}
 </group>;
}
function Observatory({compact,short}){
 const x=compact?-.48:-2.05,y=compact?(short?-.96:-1.59):-2.26,scale=compact?(short?.68:.77):1;
 return <group position={[x,y,3.2]} scale={scale}>
  <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.4,64]}/><meshStandardMaterial color="#152139" metalness={.5} roughness={.7} transparent opacity={.8}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.005,0]}><ringGeometry args={[1.35,1.365,80]}/><meshBasicMaterial color="#8bb2c9" transparent opacity={.4}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.009,0]} scale={[1,.65,1]}><circleGeometry args={[.72,48]}/><meshBasicMaterial color="#010510" transparent opacity={.52}/></mesh>
  <mesh position={[-.68,.02,.72]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.20,.215,40]}/><meshBasicMaterial color="#e5c68a" transparent opacity={.7}/></mesh>
 </group>;
}
export function GalaxyScene({masteredWorlds=[],recommendedIndex=0,selectedIndex=null,onSelect,reducedMotion=false,clockRef}){
 const {size,camera}=useThree();const lowPower=size.width<700,short=size.height<780;
 const atlasRoot=useRef();
 const set=new Set(masteredWorlds.map(x=>typeof x==='number'?x:x?.index).filter(Number.isInteger));
 const startingLayout=cinematicLayoutAt(0,lowPower,short,masteredWorlds.length,reducedMotion);
 useFrame(()=>{
  const layout=cinematicLayoutAt(clockRef.current.ms,lowPower,short,masteredWorlds.length,reducedMotion);
  if(atlasRoot.current){
   atlasRoot.current.position.set(...layout.position);
   atlasRoot.current.scale.set(...layout.scale);
  }
  if(window.__galaxySkeletonDiagnostics){
   window.__galaxySkeletonDiagnostics.atlasReveal={progress:layout.progress,phase:layout.phase,position:layout.position};
  }
 },-2);
 useEffect(()=>{camera.lookAt(0,lowPower?.05:.15,0);camera.updateProjectionMatrix()},[camera,lowPower]);
 return <>
  <color attach="background" args={['#050916']}/>
  <ambientLight intensity={.6}/>
  <hemisphereLight color="#d4e4ff" groundColor="#29243f" intensity={1.4}/>
  <directionalLight position={[-3,5,8]} color="#fff0d7" intensity={3.6}/>
  <directionalLight position={[3,2,-3]} color="#849fee" intensity={2.1}/>
  <pointLight position={[-2.6,.4,6.5]} color="#ffdfba" intensity={15} distance={9}/>
  <NebulaCloud reducedMotion={reducedMotion} clockRef={clockRef}/>
  <SpaceDepthFX compact={lowPower} clockRef={clockRef} reducedMotion={reducedMotion}/>
  <Starfield lowPower={lowPower}/>
  <Observatory compact={lowPower} short={short}/>
  <group ref={atlasRoot} position={startingLayout.position} scale={startingLayout.scale}>
   <OrbitLanes/>
   {layoutWorlds().map(world=><Planet key={world.index} world={world} mastered={set.has(world.index)} collectionOrder={masteredWorlds.findIndex(w=>(typeof w==='number'?w:w.index)===world.index)}
    recommended={world.index===recommendedIndex} selected={world.index===selectedIndex} onSelect={onSelect}
    reducedMotion={reducedMotion} lowPower={lowPower} clockRef={clockRef}/>)}
  </group>
 </>;
}
