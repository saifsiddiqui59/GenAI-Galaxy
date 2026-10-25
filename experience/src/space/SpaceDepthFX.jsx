import React,{useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {makeDepthStars} from './starDepthData.js';

// Sparse volumetric star layers create real depth/parallax while keeping the
// planet and guardian world coordinates (and the pickup IK) completely intact.
function DustLayer({count,depth,color,size,opacity,seed,clockRef,parallax,reducedMotion}){
 const group=useRef();
 const geometry=useMemo(()=>{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(makeDepthStars(count,depth,seed),3));
  return g;
 },[count,depth,seed]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useFrame(()=>{
  if(!group.current)return;
  const t=clockRef.current.ms*.001;
  group.current.position.x=reducedMotion?0:Math.sin(t*.11+seed)*parallax;
  group.current.position.y=reducedMotion?0:Math.cos(t*.08+seed)*parallax*.4;
 });
 return <group ref={group}><points geometry={geometry}>
  <pointsMaterial color={color} size={size} transparent opacity={opacity} depthWrite={false} sizeAttenuation/>
 </points></group>;
}
const CLOUD_VERTEX='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const CLOUD_FRAGMENT=`precision highp float;varying vec2 vUv;
uniform float time;uniform vec3 tint;
float glow(vec2 p,vec2 origin,vec2 spread){vec2 q=(p-origin)/spread;return exp(-dot(q,q)*2.7);}
void main(){
 vec2 uv=vUv;
 float a=glow(uv,vec2(.43,.56),vec2(.48,.28))*.20;
 a+=glow(uv,vec2(.65,.40),vec2(.38,.32))*.14;
 a*=.89+.11*sin(time*.25+uv.x*2.);
 gl_FragColor=vec4(tint,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export default function SpaceDepthFX({clockRef,reducedMotion=false,compact=false}){
 const material=useRef();
 const uniforms=useMemo(()=>({time:{value:0},tint:{value:new THREE.Color('#5866b1')}}),[]);
 useFrame(()=>{if(material.current&&!reducedMotion)material.current.uniforms.time.value=clockRef.current.ms*.001});
 return <>
  <mesh position={[0,.2,-29]} scale={[57,29,1]} renderOrder={-9}>
   <planeGeometry/>
   <shaderMaterial ref={material} vertexShader={CLOUD_VERTEX} fragmentShader={CLOUD_FRAGMENT}
    uniforms={uniforms} transparent blending={THREE.AdditiveBlending} depthWrite={false}/>
  </mesh>
  <DustLayer count={compact?120:300} depth={-31} seed={23} color="#9eb1dc" size={.045}
   opacity={.54} clockRef={clockRef} parallax={.13} reducedMotion={reducedMotion}/>
  <DustLayer count={compact?70:180} depth={-17} seed={91} color="#cfbce7" size={.052}
   opacity={.49} clockRef={clockRef} parallax={.36} reducedMotion={reducedMotion}/>
  <DustLayer count={compact?24:75} depth={-8} seed={173} color="#d8eaff" size={.024}
   opacity={.42} clockRef={clockRef} parallax={.70} reducedMotion={reducedMotion}/>
 </>;
}
