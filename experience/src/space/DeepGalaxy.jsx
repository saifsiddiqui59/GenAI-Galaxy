import React,{useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {planetSurfaceTexture} from './PlanetSurface.js';

export const PLANET_COUNT=17;
export const COLORS=['#88d5ff','#ae9cff','#e5b6ff','#ffb39f','#72e8e2','#ffc98d','#a4d48a','#c2acff','#fa96cc','#ffdb9a','#91aeff','#b3f4da','#fdd4c8','#a5befa','#ffd591','#88e4ee','#f39aca'];
export function layoutWorlds(count=PLANET_COUNT){
 return Array.from({length:count},(_,index)=>{
   const arm=index%3,band=Math.floor(index/3),a=arm*2.094+band*.72;
   const radius=2.5+band*.68;
   return {index,x:Math.sin(a)*radius,y:Math.cos(a)*radius*.45,z:-band*.44,scale:.29+(index%4)*.095};
 });
}
export function starData(count=920){
 const positions=new Float32Array(count*3);
 let seed=314159265;
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<count;i++){
  const theta=rand()*Math.PI*2,dist=12+rand()*30;
  positions[i*3]=Math.cos(theta)*dist;
  positions[i*3+1]=(rand()-.5)*25;
  positions[i*3+2]=-8-rand()*35;
 }
 return positions;
}
function Starfield({lowPower}){
 const geo=useMemo(()=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(starData(lowPower?330:1150),3));
  return g;
 },[lowPower]);
 return <points geometry={geo}>
  <pointsMaterial color="#b9bbff" size={lowPower?.07:.05} sizeAttenuation transparent opacity={.78} depthWrite={false}/>
 </points>;
}
const cloudVertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const cloudFragment=[
 'precision mediump float;varying vec2 vUv;uniform float time;uniform float uLow;',
 'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
 'float n(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);',
 'return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.)),f.x),f.y);}',
 'void main(){vec2 q=(vUv-.5)*vec2(2.,1.25);float swirl=atan(q.y,q.x)+length(q)*1.5;',
 'float clouds=n(q*3.+vec2(cos(swirl),sin(swirl))*1.4+time*.009);',
 'float wisps=n(q*8.+clouds*2.3+time*.004);float glow=exp(-length(q*vec2(1.25,1.4))*2.6);',
 'vec3 color=mix(vec3(.006,.012,.05),vec3(.25,.12,.52),clamp(clouds*glow*2.,0.,1.));',
 'color+=vec3(.045,.16,.35)*pow(wisps*glow,2.)*2.3;',
 'gl_FragColor=vec4(color,uLow>.5?.54:.76);}'
].join(' ');
function NebulaCloud({lowPower}){
 const mat=useRef();
 const uniforms=useMemo(()=>({time:{value:0},uLow:{value:lowPower?1:0}}),[lowPower]);
 useFrame((state)=>{
  if(mat.current&&!lowPower)mat.current.uniforms.time.value=Math.min(120000,state.clock.elapsedTime);
 });
 return <mesh position={[0,0,-35]} scale={[65,38,1]} renderOrder={-10}>
  <planeGeometry args={[1,1]}/>
  <shaderMaterial ref={mat} vertexShader={cloudVertex} fragmentShader={cloudFragment}
     uniforms={uniforms} transparent depthWrite={false} depthTest={false}/>
 </mesh>;
}
function Planet({world,mastered,recommended,selected,onSelect,reducedMotion,lowPower}){
 const group=useRef();
 useFrame((state,delta)=>{
  if(!group.current||reducedMotion)return;
  group.current.rotation.y+=Math.min(delta,.05)*(.15+world.index%3*.035);
  group.current.position.y=world.y+Math.sin(state.clock.elapsedTime*.7+world.index)*.045;
 });
 const color=COLORS[world.index];
 const surface=useMemo(()=>planetSurfaceTexture(world.index,color,lowPower),[world.index,color,lowPower]);
 React.useEffect(()=>()=>surface.dispose(),[surface]);
 return <group ref={group} position={[world.x,world.y,world.z]}>
    <mesh onClick={e=>{e.stopPropagation();onSelect?.(world.index);}}
      onPointerOver={()=>{document.body.style.cursor='pointer';}}
      onPointerOut={()=>{document.body.style.cursor='';}}>
     <sphereGeometry args={[world.scale,32,22]}/>
     <meshStandardMaterial map={surface} color="#ffffff" emissive={color} emissiveIntensity={recommended?.49:selected?.34:.20} roughness={.75} metalness={.05}/>
    </mesh>
    {!lowPower&&<mesh scale={1.08}>
      <sphereGeometry args={[world.scale,28,20]}/>
      <meshBasicMaterial color={color} transparent opacity={.095} blending={THREE.AdditiveBlending}
        depthWrite={false} side={THREE.BackSide}/>
    </mesh>}
    {!lowPower&&Array.from({length:5},(_,i)=>{
      const phi=(i*2.399963229728653+world.index*.61),theta=.62+(i%3)*.74;
      const rr=world.scale*1.008;
      return <mesh key={i} position={[Math.sin(theta)*Math.cos(phi)*rr,Math.cos(theta)*rr,Math.sin(theta)*Math.sin(phi)*rr]}
        rotation={[theta,0,phi]} scale={[.12+.025*(i%2),.045,.012]}>
        <sphereGeometry args={[world.scale,9,7]}/>
        <meshStandardMaterial color={i%2?'#10283b':'#30213c'} transparent opacity={.58} roughness={.9}/>
      </mesh>;
    })}
    {mastered&&<mesh rotation={[.48,.2,.55]}>
      <torusGeometry args={[world.scale*1.35,.022,8,64]}/>
      <meshBasicMaterial color="#efc878"/>
    </mesh>}
    {recommended&&<mesh rotation={[.2,0,.45]}>
      <torusGeometry args={[world.scale*1.62,.012,6,64]}/>
      <meshBasicMaterial color="#c0faff" transparent opacity={.86}/>
    </mesh>}
 </group>;
}
export function GalaxyScene({masteredWorlds=[],recommendedIndex=0,selectedIndex=null,onSelect,reducedMotion=false}){
 const {size}=useThree();
 const lowPower=size.width<680;
 const set=new Set(masteredWorlds.map(x=>typeof x==='number'?x:x?.index).filter(Number.isInteger));
 return <>
  <color attach="background" args={['#030817']}/>
  <ambientLight intensity={1.7}/>
  <hemisphereLight color="#d0f5ff" groundColor="#413166" intensity={2.1}/>
  <spotLight position={[-2,5,9]} color="#fff0d8" intensity={115} angle={.65} penumbra={.8} distance={22}/>
  <pointLight position={[0,3,5]} color="#a6c2ff" intensity={65} distance={24}/>
  <pointLight position={[-4,-3,1]} color="#8662dc" intensity={35} distance={24}/>
  <NebulaCloud lowPower={lowPower||reducedMotion}/>
  <Starfield lowPower={lowPower}/>
  <group position={lowPower?[0,.4,-1.8]:[0,0,0]} scale={lowPower?[.48,.73,.8]:[1,1,1]}>
  {layoutWorlds().map(world=><Planet key={world.index} world={world} mastered={set.has(world.index)}
   recommended={world.index===recommendedIndex} selected={world.index===selectedIndex}
   onSelect={onSelect} reducedMotion={reducedMotion} lowPower={lowPower}/>)}
  </group>
 </>;
}
