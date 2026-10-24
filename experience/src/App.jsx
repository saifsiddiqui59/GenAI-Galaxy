import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import JourneyTimeline from './journey/JourneyTimeline.jsx';
import GalaxyAuth from './auth/GalaxyAuth.jsx';
import WorldDock from './navigation/WorldDock.jsx';
import {lessonHref,powerBudget,validWorld} from './navigation/navigation.js';
import {Canvas} from '@react-three/fiber';
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
const TOPIC_KEYS=new Set(TOPICS.map(worldKey));
export function studyLink(index){
 const url=new URL(window.location.href);
 const prefix=url.pathname.match(/^\/previews\/galaxy-3d-v[0-9]+\//)?.[0];
 if(prefix){
   if(!validWorld(index))throw Error('Invalid learning world');
   return new URL(prefix+'lesson/index.html?galaxyWorld='+index,url.origin).href;
 }
 return lessonHref(index,url.origin);
}
function canWebGL(){
 try{
  const canvas=document.createElement('canvas');
  return !!(canvas.getContext('webgl2')||canvas.getContext('webgl'));
 }catch{return false;}
}
export default function App(){
 const budget=useMemo(powerBudget,[]);
 const reduced=budget.noMotion;
 const [animationEnabled,setAnimationEnabled]=useState(!reduced);
 const choreographyRef=useRef({ms:0,epoch:0,hold:false});
 const invalidateRef=useRef(()=>{});
 const [visible,setVisible]=useState(!document.hidden);
 const [sequence,setSequence]=useState({activeIndex:-1,visible:0,skipped:false});
 const [selected,setSelected]=useState(null);
 const [warp,setWarp]=useState(null);
 const [menuOpen,setMenuOpen]=useState(false);
 const [authSnapshot,setAuthSnapshot]=useState({status:'guest',user:null,progress:{}});
 const receiveAuth=useCallback(value=>setAuthSnapshot(value),[]);
 const available3D=useMemo(canWebGL,[]);
 const activeOwner=SHOW_SAMPLE?SAMPLE_USER:(authSnapshot.status==='authenticated'?authSnapshot.user?.id:null);
 const activeProgress=SHOW_SAMPLE?PREVIEW_PROGRESS:(activeOwner?authSnapshot.progress:{});
 const collected=useMemo(()=>{
   if(!activeOwner)return [];
   try{return completedWorlds({chapters:CHAPTERS,topics:TOPICS,progress:activeProgress,ownerId:activeOwner});}
   catch(error){console.warn('Galaxy mastery display unavailable',error?.message);return [];}
 },[activeOwner,activeProgress]);
 const nextIndex=useMemo(()=>activeOwner?
   recommendedWorld({topics:TOPICS,progress:activeProgress}):0,[activeOwner,activeProgress]);
 const sequenceUpdate=useCallback(next=>setSequence(old=>old.activeIndex===next.activeIndex&&old.visible===next.visible&&old.skipped===next.skipped?old:next),[]);
 const resetClock=useCallback(()=>{
  choreographyRef.current={ms:0,epoch:choreographyRef.current.epoch+1,hold:false};
  invalidateRef.current();
 },[]);
 useEffect(()=>{resetClock()},[activeOwner,collected.length,nextIndex,resetClock]);
 useEffect(()=>{const handler=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',handler);return()=>document.removeEventListener('visibilitychange',handler)},[]);
 useEffect(()=>{
  if(!SHOW_SAMPLE)return;
  window.__galaxyV6={
   seek(ms){if(!Number.isFinite(ms)||ms<0||ms>60000)throw Error('Invalid preview time');choreographyRef.current.ms=ms;choreographyRef.current.hold=true;invalidateRef.current()},
   resume(){choreographyRef.current.hold=false;invalidateRef.current()},
   reset:resetClock
  };
  return()=>{delete window.__galaxyV6};
 },[resetClock]);
 const select=useCallback(index=>{
  if(!validWorld(index)||warp)return;
  setSelected(index);
  setWarp({id:String(Date.now())+'-'+index,index});
 },[warp]);
 const enterLesson=useCallback(index=>{window.location.assign(studyLink(index))},[]);
 return <div className="galaxy-experience">
   {available3D&&<div className="galaxy-canvas" aria-label="Animated 3D galaxy with 17 planets">
     <Canvas camera={{position:[0,.3,12.5],fov:48}} dpr={[1,1.5]} frameloop="demand"
       onCreated={state=>{invalidateRef.current=state.invalidate;state.gl.setClearColor('#050916');state.gl.toneMappingExposure=1.18}}
       gl={{antialias:true,alpha:false,powerPreference:'default'}}>
       <JourneyTimeline clockRef={choreographyRef} count={collected.length} ready={true}
         reducedMotion={!animationEnabled||reduced} active={visible}/>
       <GalaxyScene masteredWorlds={collected} selectedIndex={selected} recommendedIndex={nextIndex}
         onSelect={select} reducedMotion={!animationEnabled||reduced} clockRef={choreographyRef}/>
     </Canvas>
   </div>}
   {!available3D&&<div className="galaxy-no-webgl" role="status">
      <h2>3D graphics unavailable on this device</h2>
      <p>The full 17-world navigation is available below without WebGL.</p>
    </div>}
   <div className="galaxy-brand" aria-label="GenAI Galaxy">
     <span aria-hidden="true" className="galaxy-brand-orb">✦</span>
     <span><strong>GENAI GALAXY</strong><small>THE LEARNING EXPEDITION</small></span>
   </div>
   <div className="galaxy-mode-tag">{SHOW_SAMPLE?
    'VISUAL DEMO · 3 SAMPLE MASTERED WORLDS · NO ACCOUNT DATA':
    (authSnapshot.status==='authenticated'?'YOUR PRIVATE LEARNING GALAXY':'3D GALAXY · SIGN IN TO SYNC PROGRESS')}</div>
   <GalaxyAuth demo={SHOW_SAMPLE} topicKeys={TOPIC_KEYS} onSnapshot={receiveAuth}/>
   <GuardianJourney completed={collected} nextIndex={nextIndex} nextName={LABELS[nextIndex]}
     onSelectCompleted={select} onAccept={select}
     onSequence={sequenceUpdate} clockRef={choreographyRef} ready={true}
     onReplay={resetClock}
     reducedMotion={true}/>
   <div className="galaxy-atlas-label" aria-hidden="true"><span>THE LEARNING ATLAS</span><p>Seventeen worlds. Infinite connections.</p></div>
   <div className="galaxy-view-actions">
     <button type="button" aria-expanded={menuOpen} aria-controls="galaxy-world-menu"
       onClick={()=>setMenuOpen(v=>!v)}>Explore all 17 worlds</button>
     <button type="button" aria-pressed={animationEnabled} onClick={()=>setAnimationEnabled(v=>!v)}
       disabled={reduced} title={reduced?'System prefers reduced motion':''}>
       Motion: {animationEnabled?'on':'off'}
     </button>
     <a href={studyLink(0)}>Current lesson dashboard ↗</a>
   </div>
   <WorldDock worlds={LABELS} visible={menuOpen} recommended={nextIndex}
      selected={selected} onClose={()=>setMenuOpen(false)}
      onSelect={index=>{setMenuOpen(false);select(index)}}/>
   <WarpGate request={warp} onComplete={enterLesson}
     reducedMotion={!animationEnabled||reduced}/>
 </div>;
}
