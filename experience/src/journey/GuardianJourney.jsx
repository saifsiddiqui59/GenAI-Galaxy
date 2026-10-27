import React,{useEffect,useMemo,useState} from 'react';
import {phaseAt} from './story.js';
import {cinematicLayoutAt} from '../space/cinematicLayout.js';
import './journey.css';
const MAX_COLLECTION_DISPLAY=17;
export default function GuardianJourney({completed=[],nextIndex=0,nextName='',onAccept,onSelectCompleted,onPhase,onSequence,clockRef,ready=true,reducedMotion=false,openSackSignal=0,onReplay,replaySignal=0}){
 const [elapsed,setElapsed]=useState(0);
 const [skipped,setSkipped]=useState(false);
 const [sackOpen,setSackOpen]=useState(false);
 const count=Math.min(MAX_COLLECTION_DISPLAY,completed.length);
 const view=useMemo(()=>phaseAt(skipped?99999:elapsed,count,reducedMotion),[skipped,elapsed,count,reducedMotion]);
 const stored=completed.slice(0,view.visible);
 const atlasSettled=cinematicLayoutAt(skipped?99999:elapsed,false,false,count,reducedMotion).progress>=.999;
 const stageRevealed=atlasSettled&&view.phase==='offering';
 useEffect(()=>{setElapsed(0);setSkipped(false)},[nextIndex,count,reducedMotion]);
 useEffect(()=>{setElapsed(0);setSkipped(false)},[replaySignal]);
 useEffect(()=>{
  if(reducedMotion||skipped)return undefined;
  const handle=setInterval(()=>setElapsed(clockRef.current.ms),80);
  return ()=>clearInterval(handle);
 },[clockRef,reducedMotion,skipped]);
 useEffect(()=>onPhase?.(view.phase),[view.phase,onPhase]);
 useEffect(()=>onSequence?.({activeIndex:view.activeIndex,visible:view.visible,skipped}),[view.activeIndex,view.visible,skipped,onSequence]);
 useEffect(()=>{if(openSackSignal>0)setSackOpen(true)},[openSackSignal]);
 return <div className={'guardian-journey '+(stageRevealed?'is-revealed':'is-entering')} aria-label="Your Galaxy Guardian">
    <div className="guardian-journey-top">
      <p className="guardian-eyebrow">CURIOSITY IS YOUR COMPASS</p>
      <h1>A universe of<br/><em>possibility.</em></h1>
      <p className="guardian-subtitle">Collect knowledge. Connect ideas. Let your next discovery begin.</p>
    </div>
    <div className="guardian-mission">
      <button type="button" aria-expanded={sackOpen} aria-controls="guardian-sack-panel"
         className="guardian-sack" onClick={()=>setSackOpen(!sackOpen)}>
        <span aria-hidden="true">✦</span> Satchel · {stored.length} / {completed.length} collected
      </button>
      {sackOpen&&<div id="guardian-sack-panel" className="guardian-sack-panel">
        <div className="guardian-sack-header"><strong>Collected worlds</strong>
          <button type="button" aria-label="Close satchel" onClick={()=>setSackOpen(false)}>✕</button></div>
        {stored.length?<ul>{stored.map(w=><li key={w.index}>
          <button type="button" onClick={()=>onSelectCompleted?.(w.index)}>
            <span aria-hidden="true" className="guardian-gem">✧</span>{w.name}
          </button>
        </li>)}</ul>:<p>No planets stored yet. The Skull Master approaches each mastered world in orbit and collects it before the atlas moves aside.</p>}
      </div>}
    </div>
    <div className="guardian-next">
      <span className="guardian-label">YOUR NEXT DISCOVERY <span aria-hidden="true">/ {String(nextIndex+1).padStart(2,'0')}</span></span>
      <strong>{nextName||'World '+(nextIndex+1)}</strong>
      <p>Click the glowing planet in the Skull Master's hands, or choose Accept below.</p>
      <button type="button" className="guardian-accept" onClick={()=>onAccept?.(nextIndex)}>
       Accept this planet <span aria-hidden="true">↗</span>
      </button>
    </div>
    <p className="guardian-live-status" role="status">{!ready?'Preparing your companion':view.phase==='arriving'?'Your guide is arriving':view.phase==='collecting'?`Gathering your discoveries · ${view.visible} / ${count}`:'Your next world awaits'}</p>
    {!reducedMotion&&!skipped&&view.phase!=='offering'&&
      <button type="button" className="guardian-skip" onClick={()=>{clockRef.current.ms=99999;setSkipped(true)}}>Skip introduction</button>}
    {!reducedMotion&&view.phase==='offering'&&<button type="button" className="guardian-replay" onClick={()=>{setElapsed(0);setSkipped(false);onReplay?.()}}>
      Replay guardian entrance
    </button>}
 </div>;
}
