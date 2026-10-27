import React,{useCallback,useEffect,useRef} from 'react';
import './warp.css';

// Original CSS warp portal, visually inspired by React Bits Hyperspeed.
// Does NOT vendor restricted Commons-Clause component code or paid shaders.
export const WARP_MS=1050;
export function allowPortal({reducedMotion=false,enabled=true,request=null}={}){
 return !!request && enabled && !reducedMotion;
}
export default function WarpGate({request,onComplete,onCancel,enabled=true,reducedMotion=false}){
 const completed=useRef(false);
 const finish=useCallback(()=>{
  if(!request||completed.current)return;
  completed.current=true;
  onComplete?.(request.index);
 },[request,onComplete]);
 useEffect(()=>{
  completed.current=false;
  if(!request)return undefined;
  const animate=allowPortal({reducedMotion,enabled,request});
  // Both motion and no-motion must navigate once, regardless of animationend support.
  const timer=setTimeout(finish,animate?WARP_MS+220:0);
  return ()=>clearTimeout(timer);
 },[request?.id,request?.index,enabled,reducedMotion,finish]);
 if(!request) return null;
 const animated=allowPortal({reducedMotion,enabled,request});
 return <div className={'galaxy-portal'+(animated?' is-warping':' no-motion')}
   role="status" aria-live="polite" aria-label="Entering selected learning planet"
   onAnimationEnd={event=>{if(event.target===event.currentTarget)finish()}}>
  {animated&&<div className="galaxy-portal-rings" aria-hidden="true">
    {Array.from({length:14},(_,i)=><i key={i} style={{'--ring':i}} />)}
  </div>}
  <div className="galaxy-portal-core" aria-hidden="true"/>
  <div className="galaxy-portal-label">
    <strong>ENTERING WORLD {request.index+1}</strong>
    <span>Preparing your next learning mission</span>
  </div>
  <button type="button" className="galaxy-portal-skip" onClick={finish}>
    Skip transition
  </button>
 </div>;
}
