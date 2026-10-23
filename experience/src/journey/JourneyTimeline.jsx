import {useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {phaseAt} from './story.js';
import {COLLECT_START_MS,PER_WORLD_MS,OFFER_SETTLE_MS} from './choreography.js';
export default function JourneyTimeline({clockRef,count,ready,reducedMotion,active=true}){
 const {invalidate}=useThree();
 useEffect(()=>{
  if(!active||reducedMotion)return;
  const timer=setInterval(invalidate,1000/30);
  return ()=>clearInterval(timer);
 },[active,reducedMotion,invalidate]);
 useFrame((_,dt)=>{
  if(window.__galaxyV6)window.__galaxyV6.frames=(window.__galaxyV6.frames||0)+1;
  const c=clockRef.current;
  if(reducedMotion)c.ms=COLLECT_START_MS+count*PER_WORLD_MS+OFFER_SETTLE_MS+1;
  else if(ready&&active&&!c.hold)c.ms+=Math.min(dt,.065)*1000;
  c.view=phaseAt(c.ms,count,reducedMotion);
 },-3);
 return null;
}
