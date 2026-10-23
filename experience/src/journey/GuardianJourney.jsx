import React,{useEffect,useMemo,useState} from 'react';
import {phaseAt} from './story.js';
import './journey.css';
const MAX_COLLECTION_DISPLAY=17;
export default function GuardianJourney({completed=[],nextIndex=0,nextName='',onAccept,onSelectCompleted,onPhase,reducedMotion=false,openSackSignal=0,onReplay}){
 const [start,setStart]=useState(0);
 const [elapsed,setElapsed]=useState(0);
 const [skipped,setSkipped]=useState(false);
 const [sackOpen,setSackOpen]=useState(false);
 const count=Math.min(MAX_COLLECTION_DISPLAY,completed.length);
 const view=useMemo(()=>phaseAt(skipped?99999:elapsed,count,reducedMotion),[skipped,elapsed,count,reducedMotion]);
 useEffect(()=>{setStart(performance.now());setElapsed(0);setSkipped(false)},[nextIndex,count,reducedMotion]);
 useEffect(()=>{
  if(reducedMotion||skipped)return undefined;
  const handle=setInterval(()=>setElapsed(Math.min(25000,performance.now()-start)),80);
  return ()=>clearInterval(handle);
 },[start,reducedMotion,skipped]);
 useEffect(()=>onPhase?.(view.phase),[view.phase,onPhase]);
 useEffect(()=>{if(openSackSignal>0)setSackOpen(true)},[openSackSignal]);
 const visual=completed.slice(0,view.visible);
 return <div className="guardian-journey" aria-label="Your Galaxy Guardian">
    <div className="guardian-journey-top">
      <p className="guardian-eyebrow">YOUR COSMIC COMPANION</p>
      <h1>The next world is yours to explore.</h1>
      <p className="guardian-subtitle">The galaxy remembers every mastered world.</p>
    </div>
    <div className="guardian-mission">
      <button type="button" aria-expanded={sackOpen} aria-controls="guardian-sack-panel"
         className="guardian-sack" onClick={()=>setSackOpen(!sackOpen)}>
        <span aria-hidden="true">✦</span> Satchel · {completed.length} mastered
      </button>
      {sackOpen&&<div id="guardian-sack-panel" className="guardian-sack-panel">
        <div className="guardian-sack-header"><strong>Collected worlds</strong>
          <button type="button" aria-label="Close satchel" onClick={()=>setSackOpen(false)}>✕</button></div>
        {completed.length?<ul>{completed.map(w=><li key={w.index}>
          <button type="button" onClick={()=>onSelectCompleted?.(w.index)}>
            <span aria-hidden="true" className="guardian-gem">✧</span>{w.name}
          </button>
        </li>)}</ul>:<p>No fully mastered worlds yet. Your collection starts here.</p>}
      </div>}
    </div>
    <div className="guardian-collected" aria-hidden="true">
      {visual.map((w,i)=><span key={w.index} className="guardian-mini-world"
        style={{'--collect-i':i,'--hue':i*28}}/>)}
    </div>
    <div className="guardian-next">
      <span className="guardian-label">YOUR NEXT MISSION</span>
      <strong>{nextName||'World '+(nextIndex+1)}</strong>
      <button type="button" className="guardian-accept" onClick={()=>onAccept?.(nextIndex)}>
       Accept this planet <span aria-hidden="true">↗</span>
      </button>
    </div>
    {!reducedMotion&&!skipped&&view.phase!=='offering'&&
      <button type="button" className="guardian-skip" onClick={()=>setSkipped(true)}>Skip introduction</button>}
    <button type="button" className="guardian-replay" onClick={()=>{setStart(performance.now());setElapsed(0);setSkipped(false);onReplay?.()}}>
      Replay guardian entrance
    </button>
 </div>;
}
