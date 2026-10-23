/* Read-only owner-scoped progress. No service-role credentials. */
import {createClient} from '@supabase/supabase-js';
export const PUBLIC_GALAXY_SUPABASE_URL='https://vfoghlhtnifpnbevgufa.supabase.co';
export const PUBLIC_GALAXY_SUPABASE_ANON='sb_publishable_KNHVzvYG5hwq1CostAls_Q_7UkQTNJQ';
export const PROGRESS_LIMIT=5000;
export function safeProgress(rows,userId,knownKeys){
 if(typeof userId!=='string'||!userId||!Array.isArray(rows)||!(knownKeys instanceof Set))
  throw Error('Authenticated owner and valid rows required');
 if(rows.length>=PROGRESS_LIMIT)throw Error('Progress result reached cap; cannot claim complete mastery');
 const progress=Object.create(null);
 for(const row of rows){
  if(!row||row.user_id!==userId)throw Error('Unexpected progress ownership');
  if(typeof row.topic_key!=='string'||!knownKeys.has(row.topic_key))continue;
  if(!Number.isInteger(row.status)||row.status<0||row.status>2)continue;
  progress[row.topic_key]={user_id:userId,status:row.status,confidence:row.confidence||0,
    next_review_at:row.next_review_at||null};
 }
 return progress;
}
export function createGalaxySession({onUpdate,topicKeys,client=createClient(PUBLIC_GALAXY_SUPABASE_URL,PUBLIC_GALAXY_SUPABASE_ANON,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
})}){
 let generation=0,closed=false;
 let currentUser=null;
 const report=(value)=>{if(!closed)onUpdate?.(value)};
 const clear=()=>{generation++;currentUser=null;report({status:'guest',user:null,progress:{}})};
 async function refresh(){
  const epoch=++generation;
  try{
   const {data:auth,error:authError}=await client.auth.getUser();
   if(closed||epoch!==generation)return;
   if(authError||!auth?.user){clear();return}
   const user=auth.user;
   if(!user.id)throw Error('Signed-in identity missing');
   const result=await client.from('genai_study_progress').select('user_id,topic_key,status,confidence,next_review_at')
      .eq('user_id',user.id).limit(PROGRESS_LIMIT);
   if(closed||epoch!==generation)return;
   if(result.error)throw Error('Galaxy progress sync unavailable');
   const progress=safeProgress(result.data||[],user.id,topicKeys);
   currentUser={id:user.id,email:user.email||''};
   report({status:'authenticated',user:currentUser,progress});
  }catch(error){
   if(closed||epoch!==generation)return;
   currentUser=null;
   report({status:'error',user:null,progress:{},message:error?.message||'Galaxy sync unavailable'});
  }
 }
 const {data:subscription}=client.auth.onAuthStateChange((event)=>{
  if(event==='SIGNED_OUT'){clear();return}
  if(event==='INITIAL_SESSION'||event==='SIGNED_IN'||event==='TOKEN_REFRESHED')
   queueMicrotask(()=>{if(!closed)void refresh()});
 });
 async function signIn(email,password){
  if(closed)throw Error('Auth session closed');
  if(typeof email!=='string'||typeof password!=='string'||!email.trim()||!password)
    throw Error('Enter email and password');
  const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
  if(error)throw Error(error.message||'Sign-in failed');
  await refresh();
 }
 async function signOut(){
  const {error}=await client.auth.signOut();
  clear();
  if(error)throw Error('Sign out failed');
 }
 void refresh();
 return {refresh,signIn,signOut,getUser:()=>currentUser,dispose:()=>{
   closed=true;generation++;subscription?.subscription?.unsubscribe?.();
 }};
}
