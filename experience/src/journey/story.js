/* Pure, no-I/O learning-world collection and reveal choreography. */
export const TOTAL_WORLDS=17;
export function worldKey(t){return [t.branch,t.group,t.title].join(' / ')}
export function completedWorlds({chapters,topics,progress,ownerId}={}){
 if(!Array.isArray(chapters)||chapters.length!==TOTAL_WORLDS)throw Error('Expected exactly 17 worlds');
 if(!Array.isArray(topics)||!progress||typeof progress!=='object')throw Error('Invalid Galaxy progress');
 if(typeof ownerId!=='string'||!ownerId)throw Error('Verified owner required');
 const owned=Object.values(progress);
 if(owned.some(v=>!v||v.user_id!==ownerId))throw Error('Reject cross-user progress');
 return chapters.flatMap((chapter,index)=>{
   const items=topics.filter(t=>t.branchIndex===index);
   if(!items.length)return[];
   return items.every(t=>progress[worldKey(t)]?.status===2)?[{index,name:chapter.title}]:[];
 });
}
export function recommendedWorld({topics,progress,now=Date.now()}={}){
 if(!topics?.length)return 0;
 // Preserve existing curriculum order; prioritize legitimately due reviews.
 const due=topics.find(t=>{
  const v=progress?.[worldKey(t)],ts=Date.parse(v?.next_review_at);
  return typeof v?.next_review_at==='string'&&Number.isFinite(ts)&&ts<=now;
 });
 return (due||topics.find(t=>progress?.[worldKey(t)]?.status!==2)||topics[0]).branchIndex;
}
import {COLLECT_START_MS,PER_WORLD_MS,OFFER_SETTLE_MS,finiteCount} from './choreography.js';
export {COLLECT_START_MS,PER_WORLD_MS};
export function phaseAt(ms,completedCount,reducedMotion=false){
 const count=finiteCount(completedCount);
 if(reducedMotion)return {phase:'offering',visible:count,activeIndex:-1};
 if(ms<COLLECT_START_MS)return {phase:'arriving',visible:0,activeIndex:-1};
 const since=Math.max(0,ms-COLLECT_START_MS);
 const deposited=Math.min(count,Math.floor(since/PER_WORLD_MS));
 if(deposited<count)return {phase:'collecting',visible:deposited,activeIndex:deposited};
 if(ms<COLLECT_START_MS+count*PER_WORLD_MS+OFFER_SETTLE_MS)
  return {phase:'collecting',visible:count,activeIndex:-1};
 return {phase:'offering',visible:count,activeIndex:-1};
}
