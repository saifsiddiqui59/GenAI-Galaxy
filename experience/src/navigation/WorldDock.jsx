import React,{useEffect} from 'react';
import './world-dock.css';
export default function WorldDock({worlds=[],recommended=0,onSelect,selected=null,visible=false,onClose}){
 useEffect(()=>{
  if(!visible)return;
  const listen=event=>{if(event.key==='Escape')onClose?.()};
  document.addEventListener('keydown',listen);
  return ()=>document.removeEventListener('keydown',listen);
 },[visible,onClose]);
 if(!visible)return null;
 return <nav className="galaxy-dock" aria-label="Galaxy planet navigator">
   <div className="galaxy-dock-header">
    <div><small>SELECT A KNOWLEDGE WORLD</small><h2>17 planets · One universe</h2></div>
    <button type="button" onClick={onClose} aria-label="Close world navigator">✕</button>
   </div>
   <ol>{worlds.map((name,index)=>
    <li key={index}><button type="button"
      aria-current={selected===index?'page':undefined} onClick={()=>onSelect?.(index)}>
       <span className="galaxy-dock-index">{String(index+1).padStart(2,'0')}</span>
       <span>{name}</span>
       {index===recommended&&<span className="galaxy-dock-recommend">Next</span>}
    </button></li>)}</ol>
 </nav>;
}
