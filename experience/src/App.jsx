import React,{useCallback,useMemo,useState} from 'react';
import {Canvas} from '@react-three/fiber';
import Guardian from './guardian/Guardian.jsx';
import {GalaxyScene} from './space/DeepGalaxy.jsx';
import GuardianJourney from './journey/GuardianJourney.jsx';
import {completedWorlds,recommendedWorld,worldKey} from './journey/story.js';
import WarpGate from './portal/WarpGate.jsx';
import curriculum from '../../data/curriculum.json';

const CHAPTERS=curriculum;
const TOPICS=CHAPTERS.flatMap((chapter,branchIndex)=>
 chapter.groups.flatMap(group=>
  group.items.map(t=>({...t,branch:chapter.title,group:group.title,branchIndex}))
 )
);
const LABELS=CHAPTERS.map(ch=>ch.title);
const SHOW_SAMPLE=new URLSearchParams(window.location.search).get('demo')==='1';
const SAMPLE_USER='explicit-synthetic-browser-demo';
function fakeProgress(){
 // This exists ONLY in opt-in demo mode. Never persist or disguise sample mastery.
 const rows={};
 for(const topic of TOPICS) if([0,2,4].includes(topic.branchIndex)){
  rows[worldKey(topic)]={user_id:SAMPLE_USER,status:2,confidence:4};
 }
 return rows;
}
const PREVIEW_PROGRESS=SHOW_SAMPLE?fakeProgress():{};
export function studyLink(index){
 // Only an integer chapter index is carried across pages; NEVER private progress.
 if(!Number.isInteger(index)||index<0||index>=17)throw Error('Unknown learning world');
 return new URL('../index.html?galaxyWorld='+index,window.location.href).href;
}
function canWebGL(){
 try{
  const canvas=document.createElement('canvas');
  return !!(canvas.getContext('webgl2')||canvas.getContext('webgl'));
 }catch{return false;}
}
export default function App(){
 const reduced=useMemo(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false,[]);
 const [animationEnabled,setAnimationEnabled]=useState(!reduced);
 const [modelPhase,setModelPhase]=useState('arriving');
 const [selected,setSelected]=useState(null);
 const [warp,setWarp]=useState(null);
 const [menuOpen,setMenuOpen]=useState(false);
 const available3D=useMemo(canWebGL,[]);
 const collected=useMemo(()=>SHOW_SAMPLE?
   completedWorlds({chapters:CHAPTERS,topics:TOPICS,progress:PREVIEW_PROGRESS,ownerId:SAMPLE_USER})
   :[],[]);
 const nextIndex=useMemo(()=>SHOW_SAMPLE?recommendedWorld({topics:TOPICS,progress:PREVIEW_PROGRESS}):0,[]);
 const phaseUpdate=useCallback(next=>setModelPhase(next),[]);
 const select=useCallback(index=>{
  if(!Number.isInteger(index)||index<0||index>=17||warp)return;
  setSelected(index);
  setWarp({id:String(Date.now())+'-'+index,index});
 },[warp]);
 const enterLesson=useCallback(index=>{window.location.assign(studyLink(index))},[]);
 return <div className="galaxy-experience">
   {available3D&&<div className="galaxy-canvas" aria-label="Animated 3D galaxy with 17 planets">
     <Canvas camera={{position:[0,0,11.5],fov:57}} dpr={[1,1.5]}
       gl={{antialias:true,alpha:false,powerPreference:'high-performance'}}>
       <GalaxyScene masteredWorlds={collected} selectedIndex={selected} recommendedIndex={nextIndex}
         onSelect={select} reducedMotion={!animationEnabled||reduced}/>
       <Guardian phase={animationEnabled?modelPhase:'idle'}/>
     </Canvas>
   </div>}
   {!available3D&&<div className="galaxy-no-webgl" role="status">
      <h2>3D graphics unavailable on this device</h2>
      <p>The full 17-world navigation is available below without WebGL.</p>
    </div>}
   <div className="galaxy-brand" aria-label="GenAI Galaxy">
     <span aria-hidden="true" className="galaxy-brand-orb">✦</span>
     <span><strong>GENAI GALAXY</strong><small>17 KNOWLEDGE WORLDS</small></span>
   </div>
   <div className="galaxy-mode-tag">{SHOW_SAMPLE?
    'VISUAL DEMO · 3 SAMPLE MASTERED WORLDS · NO ACCOUNT DATA':
    '3D SCENE PREVIEW · NO PRIVATE PROGRESS LOADED'}</div>
   <GuardianJourney completed={collected} nextIndex={nextIndex} nextName={LABELS[nextIndex]}
     onSelectCompleted={select} onAccept={select} onPhase={phaseUpdate}
     reducedMotion={!animationEnabled||reduced}/>
   <div className="galaxy-view-actions">
     <button type="button" aria-expanded={menuOpen} aria-controls="galaxy-world-menu"
       onClick={()=>setMenuOpen(v=>!v)}>Explore all 17 worlds</button>
     <button type="button" aria-pressed={animationEnabled} onClick={()=>setAnimationEnabled(v=>!v)}
       disabled={reduced} title={reduced?'System prefers reduced motion':''}>
       Motion: {animationEnabled?'on':'off'}
     </button>
     <a href="../index.html">Current lesson dashboard ↗</a>
   </div>
   {menuOpen&&<nav id="galaxy-world-menu" className="galaxy-world-menu" aria-label="Keyboard-accessible worlds">
      <div className="galaxy-world-menu-top">
       <h2>Select a learning planet</h2>
       <button type="button" onClick={()=>setMenuOpen(false)} aria-label="Close worlds">✕</button>
      </div>
      <ol>{LABELS.map((label,index)=><li key={index}>
        <button type="button" onClick={()=>{setMenuOpen(false);select(index)}}>
          <span>{String(index+1).padStart(2,'0')}</span>{label}
        </button>
      </li>)}</ol>
    </nav>}
   <WarpGate request={warp} onComplete={enterLesson}
     reducedMotion={!animationEnabled||reduced}/>
 </div>;
}
