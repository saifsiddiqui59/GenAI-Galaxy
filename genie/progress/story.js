/* Pure Genie progress storytelling model. No document, storage or provider access.
 * Inputs MUST be the signed-in user's owner-scoped Supabase snapshot.
 * Never awards mastery: only reads existing status=2.
 */
(function (root) {
  'use strict';
  function topicKey(topic) {
    return [topic.branch,topic.group,topic.title].join(' / ');
  }
  function build({userId,subjects,topics,progress,now=Date.now()}={}) {
    if(typeof userId!=='string'||!userId) throw Error('Verified account required');
    if(!Array.isArray(subjects)||subjects.length!==17) throw Error('Exactly 17 chapter worlds required');
    if(!Array.isArray(topics)||topics.length===0) throw Error('Valid study topics required');
    if(!progress||typeof progress!=='object'||Array.isArray(progress)) throw Error('Owner-scoped progress required');
    if(!Number.isFinite(now)) throw Error('Invalid review clock');
    const known = new Set();
    const chapters = Array.from({length:17},()=>[]);
    topics.forEach(t=>{
      if(!t||!Number.isInteger(t.branchIndex)||t.branchIndex<0||t.branchIndex>=17
        ||typeof t.title!=='string'||typeof t.group!=='string'||typeof t.branch!=='string')
        throw Error('Invalid topic hierarchy');
      const k=topicKey(t);
      if(known.has(k)) throw Error('Duplicate persisted topic key');
      known.add(k);
      chapters[t.branchIndex].push({topic:t,key:k});
    });
    // Fail closed on any snapshot mixing other accounts or missing owner metadata.
    for(const value of Object.values(progress)) {
      if(!value||value.user_id!==userId) throw Error('Unexpected progress owner');
    }
    function p(k) {return progress[k]||{};}
    const masteredWorlds=[];
    let masteredTopicCount=0;
    chapters.forEach((entries,index)=>{
      const count=entries.filter(e=>p(e.key).status===2).length;
      masteredTopicCount+=count;
      if(entries.length>0&&count===entries.length)
        masteredWorlds.push({index,name:String(subjects[index].title||'Chapter '+(index+1))});
    });
    let pick=null;
    for(const t of topics){
      const value=p(topicKey(t));
      const time=Date.parse(value.next_review_at);
      if(typeof value.next_review_at==='string'&&Number.isFinite(time)&&time<=now){
        pick={topic:t,kind:'revision'};break;
      }
    }
    if(!pick){
      const t=topics.find(t=>p(topicKey(t)).status!==2);
      if(t) pick={topic:t,kind:'new'};
    }
    if(!pick) pick={topic:topics[0],kind:'consolidation'};
    const next=pick.topic;
    // Return only display-safe chapter/topic strings and index, never account identity.
    return {
      masteredWorlds,
      masteredTopicCount,
      totalTopicCount:topics.length,
      next:{index:next.branchIndex,title:String(subjects[next.branchIndex].title||next.branch),
        topic:next.title,kind:pick.kind,isReview:pick.kind!=='new'},
      allWorldsMastered:masteredWorlds.length===17
    };
  }
  root.GalaxyProgressStory={build,topicKey};
})(typeof window==='object'?window:this);
