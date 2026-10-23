/* Galaxy P29 · privacy-preserving learning report from already-owned attempts. */
(function(root){
 'use strict';
 const dateOf=x=>{const d=new Date(x);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):null};
 const clean=s=>String(s??'').slice(0,140);
 function summarize({attempts=[],progress={},session=null}={}){
  const rows=(Array.isArray(attempts)?attempts:[]).filter(a=>a&&dateOf(a.created_at));
  const dates={};let reviewed=0,local=0,strong=0;
  const byTopic=new Map();
  rows.forEach(a=>{
   const d=dateOf(a.created_at);dates[d]=(dates[d]||0)+1;
   const factual=a.serverReviewed===true||a.source==='server_model';
   if(factual){reviewed++;if(a.correct===true)strong++}else local++;
   const key=clean(a.topic_key);
   if(key)byTopic.set(key,(byTopic.get(key)||0)+1);
  });
  const status=Object.values(progress||{}).reduce((a,p)=>{if(p?.status===2)a.mastered++;else if(p?.status===1)a.inProgress++;return a},{mastered:0,inProgress:0});
  return {attemptCount:rows.length,modelReviewed:reviewed,localOnly:local,modelReportedStrong:strong,progress:status,
   activity:Object.entries(dates).sort((a,b)=>a[0].localeCompare(b[0])).map(([day,count])=>({day,count})),
   frequentTopics:[...byTopic].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([topic,count])=>({topic,count})),
   session:session?{questionsCompleted:Math.max(0,session.done||0),role:clean(session.role||'')}:null,
   accuracyStatus:'No independent factual accuracy score; model self-grading and local keyword matches are not certified results'};
 }
 function toCsv(report){
  const rows=[['metric','value'],['attempts',report.attemptCount],['model_reviewed',report.modelReviewed],
   ['local_only',report.localOnly],['topics_mastered',report.progress?.mastered||0],['topics_in_progress',report.progress?.inProgress||0]];
  const esc=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
  return rows.map(row=>row.map(esc).join(',')).join('\n')+'\n';
 }
 const api=Object.freeze({summarize,toCsv});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxySessionReports=api;
})(typeof window!=='undefined'?window:globalThis);
