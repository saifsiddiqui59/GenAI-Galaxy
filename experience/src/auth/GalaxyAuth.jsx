import React,{useEffect,useState} from 'react';
import {createGalaxySession} from './galaxySession.js';
import './auth.css';
export default function GalaxyAuth({demo=false,topicKeys,onSnapshot}){
 const [session,setSession]=useState({status:demo?'demo':'loading',user:null,progress:{}});
 const [opened,setOpened]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [client,setClient]=useState(null);
 useEffect(()=>{
  if(demo){onSnapshot?.({status:'demo',user:null,progress:{}});return}
  const auth=createGalaxySession({topicKeys,onUpdate:value=>{
   setSession(value);onSnapshot?.(value);
  }});
  setClient(auth);
  return ()=>auth.dispose();
 },[demo,topicKeys,onSnapshot]);
 async function submit(event){
  event.preventDefault();if(!client||busy)return;
  setBusy(true);setError('');
  try{await client.signIn(email,password);setOpened(false);setPassword('')}
  catch(err){setError(err.message||'Sign-in failed')}
  finally{setBusy(false)}
 }
 async function out(){
  if(!client||busy)return;setBusy(true);
  try{await client.signOut()}catch(err){setError(err.message||'Sign out failed')}
  finally{setBusy(false)}
 }
 if(demo)return null;
 return <div className="galaxy-auth">
  {session.status==='authenticated'?
   <div className="galaxy-account"><span>PRIVATE WORLDS · {session.user?.email||'Explorer'}</span>
    <button type="button" onClick={out} disabled={busy}>Sign out</button></div>:
   <button type="button" onClick={()=>setOpened(v=>!v)} aria-expanded={opened}
    aria-controls="galaxy-auth-panel">{session.status==='loading'?'Checking account…':'Sign in to restore mastered worlds'}</button>}
  {session.status==='error'&&<small role="alert">{session.message}</small>}
  {opened&&session.status!=='authenticated'&&<form id="galaxy-auth-panel" onSubmit={submit}>
    <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
     autoComplete="email"/></label>
    <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)}
     required autoComplete="current-password"/></label>
    {error&&<small role="alert">{error}</small>}
    <button type="submit" disabled={busy||!client}>{busy?'Signing in…':'Sign in securely'}</button>
    <button type="button" onClick={()=>setOpened(false)}>Cancel</button>
    <p>Your existing Galaxy account is reused. Only your own progress is read; no learning scores are changed.</p>
  </form>}
 </div>;
}
