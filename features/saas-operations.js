/* P37: SaaS notice policies: in-app only, server values authoritative. */
(function(root){
 'use strict';
 function daysUntil(value, now=Date.now()){
   const ms=Date.parse(value||'');
   if(!Number.isFinite(ms))return null;
   return Math.ceil((ms-now)/86400000);
 }
 function renewal(lifecycle,now=Date.now()){
   const l=lifecycle||{},plan=String(l.plan_code||'FREE'),status=String(l.status||'ACTIVE');
   if(plan==='FREE'&&status==='ACTIVE')return null;
   if(status==='SUSPENDED')return {level:'critical',title:'Subscription suspended',message:'Your paid AI access is restricted. Contact Galaxy support or your administrator.',daysRemaining:null};
   if(['CANCELLED','PAST_DUE','EXPIRED'].includes(status))return {level:'critical',title:'Subscription needs attention',message:'Your prior paid subscription is '+status.toLowerCase()+'. Free access may still be available. Check with your administrator.',daysRemaining:null};
   const days=daysUntil(l.expires_at,now);
   if(days===null)return {level:'attention',title:'Plan expiry unavailable',message:'Your plan expiry could not be verified. Refresh your account.',daysRemaining:null};
   if(days<=0)return {level:'critical',title:'Paid plan expired',message:'Your plan has expired. Paid evaluation limits no longer apply; FREE entitlement may be available.',daysRemaining:days};
   if(days>30)return null;
   if(days>14)return {level:'info',title:'Renewal reminder',message:'Your '+plan+' plan expires in '+days+' days.',daysRemaining:days};
   if(days>7)return {level:'attention',title:'Plan renewal approaching',message:'Your '+plan+' plan expires in '+days+' days. Ask your administrator about renewal.',daysRemaining:days};
   return {level:days<=2?'critical':'attention',title:'Plan expires soon',message:'Your '+plan+' plan expires in '+days+' day'+(days===1?'':'s')+'. Ask your administrator to renew it.',daysRemaining:days};
 }
 function warnings(summary,failed=false){
   if(failed||!summary)return [{level:'critical',title:'Monitoring unavailable',message:'Platform metrics could not be verified. Counts are not assumed to be zero.'}];
   const required=['accounts','pending','active_subscriptions','suspended','expiring_in_7_days','ai_evaluations_today'];
   if(required.some(k=>typeof summary[k]!=='number'||!Number.isFinite(summary[k])))
     return [{level:'critical',title:'Incomplete monitoring',message:'The server did not provide complete metrics. Investigate rather than assuming healthy operation.'}];
   const items=[];
   if(summary.pending>0)items.push({level:'attention',title:summary.pending+' pending approvals',message:'Review onboarding requests in the approval queue.'});
   if(summary.suspended>0)items.push({level:'critical',title:summary.suspended+' suspended accounts',message:'Review subscription status and customer access.'});
   if(summary.expiring_in_7_days>0)items.push({level:'attention',title:summary.expiring_in_7_days+' plans expiring within 7 days',message:'Review expiring accounts before access changes.'});
   if(summary.expired_or_past_due>0)items.push({level:'attention',title:summary.expired_or_past_due+' expired, overdue or cancelled entitlements',message:'Verify the affected users in the account directory.'});
   if(summary.accounts===0)items.push({level:'info',title:'No Galaxy accounts onboarded',message:'Use the normal Galaxy signup flow; never seed anonymous super-admin accounts.'});
   if(summary.ai_evaluations_today>=0.8*(summary.ai_global_daily_cap||50))items.push({level:'attention',title:'AI usage approaching daily cap',message:'Review server-enforced model budget before adding spending.'});
   items.push({level:'info',title:'Payments, cloud spend and API uptime are not monitored here',message:'Their status is unverified, not zero. No payment gateway or paid monitoring is configured.'});
   return items;
 }
 const api=Object.freeze({daysUntil,renewal,warnings});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GalaxySaaSOperations=api;
})(typeof window!=='undefined'?window:globalThis);
