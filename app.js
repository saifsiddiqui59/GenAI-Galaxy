/* GenAI Galaxy V4 — preserved V3 chapter/group/topic identifiers, no MCQ, no privileged keys. */
'use strict';
const SB_URL='https://vfoghlhtnifpnbevgufa.supabase.co';
const SB_PUBLISHABLE_KEY='sb_publishable_KNHVzvYG5hwq1CostAls_Q_7UkQTNJQ'; // public key, not secret
const DOM=id=>document.getElementById(id);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=t=>[t.branch,t.group,t.title].join(' / '); // preserve V3 database keys
const dateNow=()=>new Date().toISOString();
const DAYS=86400000;
const SHORT_NAMES=['LLM Fundamentals','Prompt Engineering','RAG & Retrieval','LangGraph','Agents & MCP','Azure Foundry','Voice Assistant','GenAI Evaluation','Responsible AI','Databricks & Spark','ADF Pipelines','Python & SQL','LLMOps','Anomaly RCA','File Processing','System Design','Interview Stories'];
const PALETTES=[
 ['#d9c1ff','#8476f5','#242466','#9871ff'],['#92edff','#318eba','#132e63','#3faafa'],['#f0cba9','#ac608d','#51235c','#f7a2a5'],
 ['#c7ffda','#65b988','#134e55','#62e5bb'],['#fee2a1','#c7844c','#493a66','#e7aa62'],['#f3a6c9','#a74e89','#412052','#e681bb'],
 ['#b9dfff','#5d8ec1','#1c376e','#7fc8f7'],['#c9c0ff','#695bbb','#24215a','#9a94fc'],['#f8bb90','#b96958','#652f53','#e18a6e'],
 ['#ffe8a7','#c89650','#513d3b','#eeb96f'],['#baf5ef','#48b5af','#194f7b','#77dce0'],['#dcaaff','#8560ac','#312267','#aa7ce9'],
 ['#c5d3f6','#667ec8','#31326f','#adc1f6'],['#fbc2bd','#bd7677','#623045','#d88d94'],['#c1f2c1','#659d86','#224b53','#8bd9c4'],
 ['#eec3fa','#a15cbd','#402863','#d48ef0'],['#b3f6ff','#648add','#21346c','#7fbfff']
];
const state={subjects:[],topics:[],lessons:{},current:null,chapter:0,view:'galaxy',progress:{},attempts:[],documents:[],user:null,client:null,isGuest:true,query:'',attemptQuestion:'',level:1,answerDraft:'',feedback:null,guideOpen:false,studyMode:'practice',targetRole:'GenAI Engineer',session:null,sessionReport:null,jobFocus:'',coachResume:'',coachJob:'',coachPlan:null,coachInsights:null,planInfo:null,planLifecycle:null,planCatalog:[],platformAccounts:null,platformOffset:0,platformAudit:null,platformDataError:'',platformSummary:null,platformPending:[],platformAuthorized:false,platformError:'',approvalInfo:null,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,voice:null,voiceEvents:[],voiceStartedAt:null,voiceElapsedMs:null,recording:false,voicePending:false,starFrame:0,stars:[],galaxyFrame:0,lastFrame:0};
const total=()=>state.topics.length;
const getP=t=>state.progress[key(t)]||{status:0,confidence:0,note:'',last_reviewed_at:null,next_review_at:null};
const chapterTopics=c=>state.topics.filter(t=>t.branchIndex===c);
function notify(s){const e=DOM('toast');e.textContent=s;e.classList.remove('is-hidden');clearTimeout(notify._tid);notify._tid=setTimeout(()=>e.classList.add('is-hidden'),4500)}
function getStats(){const all=state.topics.map(getP);return {total:all.length,mastered:all.filter(p=>p.status===2).length,studying:all.filter(p=>p.status===1).length,due:all.filter(p=>p.next_review_at && Date.parse(p.next_review_at)<=Date.now()).length,expanded:Object.keys(state.lessons).length}}
function saveGuest(){if(!state.isGuest)return;try{localStorage.setItem('genai_tutor_preview_progress',JSON.stringify(state.progress));localStorage.setItem('genai_tutor_preview_attempts',JSON.stringify(state.attempts.slice(-250)))}catch(e){console.warn('Guest storage unavailable',e)}}
function loadGuest(){try{state.progress=JSON.parse(localStorage.getItem('genai_tutor_preview_progress')||'{}');state.attempts=JSON.parse(localStorage.getItem('genai_tutor_preview_attempts')||'[]')}catch(_){state.progress={};state.attempts=[]}}
async function saveProgress(t){if(state.isGuest){saveGuest();return true}if(!state.client||!state.user)return false;const p=getP(t);const row={user_id:state.user.id,topic_key:key(t),status:p.status,confidence:p.confidence,note:p.note||'',last_reviewed_at:p.last_reviewed_at||null,next_review_at:p.next_review_at||null,updated_at:dateNow()};const {error}=await state.client.from('genai_study_progress').upsert(row,{onConflict:'user_id,topic_key'});if(error){notify('Cloud progress failed: '+error.message);return false}return true}
async function storeAttempt(t,output){const row={topic_key:key(t),question_key:'v4-open-'+output.level,level:output.level,correct:output.passed,response:output.response.slice(0,2000),feedback:output.feedback.slice(0,2000),created_at:dateNow()};state.attempts.unshift(row);if(state.isGuest){saveGuest();return}const {error}=await state.client.from('genai_study_attempts').insert({...row,user_id:state.user.id});if(error)notify('Attempt sync failed: '+error.message)}
function setView(name){if(!['galaxy','dashboard','library','practice','review','vault','lesson','plans','platform'].includes(name))return;if(!state.isGuest&&state.approvalInfo?.approval_required===true&&state.approvalInfo?.status!=='APPROVED'&&!state.platformAuthorized&&!['plans','platform'].includes(name))name='plans';stopVoice();state.view=name;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));DOM('page-label').textContent=({galaxy:'EXPLORE THE UNIVERSE',dashboard:'MISSION PROGRESS',library:'KNOWLEDGE CONSTELLATIONS',lesson:'DEEP DIVE · LEARNING',practice:'SPEAK AND REFINE',review:'SPACED REPETITION',vault:'PRIVATE KNOWLEDGE VAULT',plans:'SUBSCRIPTIONS & ACCOUNT',platform:'PLATFORM ADMIN'})[name];render();window.scrollTo?.({top:0,behavior:state.motion?'smooth':'instant'});DOM('root')?.focus({preventScroll:true})}
function chooseTopic(t){state.current=t;state.level=1;state.answerDraft='';state.feedback=null;state.guideOpen=false;state.attemptQuestion=t.question||`Explain ${t.title} with an example.`;setView('lesson')}
function updateNav(){const admin=DOM('platform-nav');if(admin)admin.hidden=!state.platformAuthorized;const s=getStats();DOM('sidebar-mastered').textContent=s.mastered;DOM('sync-label').textContent=state.isGuest?'Guest · device-only progress':'Supabase · private cloud sync';DOM('signin-btn').textContent=state.isGuest?'Sign in':((state.user.email||'Account').split('@')[0]+' ↗')}
function block(text,detail=''){return `<div class="panel"><span class="eyebrow">${escapeHtml(detail)}</span><h2>${escapeHtml(text)}</h2></div>`}
function intro(tag,title,description){return `<section class="section-head"><div><div class="overline">${escapeHtml(tag)}</div><h1>${title}</h1><p>${escapeHtml(description)}</p></div></section>`}
function planetVars(i,size){const [bright,mid,deep,glow]=PALETTES[i%PALETTES.length];return `--bright:${bright};--mid:${mid};--deep:${deep};--glow:${glow}88;--size:${size}px`}
function planetMarkup(i,size){return `<span class="planet ${[3,7,12].includes(i)?'has-ring':''}" style="${planetVars(i,size)}" aria-hidden="true"></span>`}
function scene(){const s=getStats();const ch=state.subjects[state.chapter];const arr=chapterTopics(state.chapter),mastered=arr.filter(t=>getP(t).status===2).length;const groups=ch.groups.map(g=>`<details class="chapter-group"><summary>${escapeHtml(g.title)} <span class="muted">(${g.items.length})</span></summary>${g.items.map(it=>{const t=arr.find(x=>x.title===it.title&&x.group===g.title);return t?`<button data-topic="${encodeURIComponent(key(t))}" aria-label="Open ${escapeHtml(it.title)}">${getP(t).status===2?'✓ ':''}${escapeHtml(it.title)}</button>`:''}).join('')}</details>`).join('');
 return intro('17 KNOWLEDGE WORLDS · 9 STUDY PHASES','Your own <span class="gradient-text">GenAI universe.</span>','Explore interactive planets, master architecture and practice interview answers out loud. Each chapter opens a guided topic constellation.')+`<div class="statline" style="margin-bottom:17px"><div class="stat-chip"><b>${s.total}</b> concepts</div><div class="stat-chip"><b>${s.expanded}</b> expanded lessons</div><div class="stat-chip"><b>${s.due}</b> reviews due</div></div><div class="galaxy-layout"><div class="universe" id="universe" aria-label="17 selectable chapter planets"><div class="nebula"></div><div class="orbit one"></div><div class="orbit two"></div><div class="orbit three"></div><div class="galaxy-core"></div><span class="core-label">GENAI CORE</span>${state.subjects.map((c,i)=>{const count=chapterTopics(i).length;return `<button type="button" class="planet-node ${i===state.chapter?'selected':''}" data-chapter="${i}" aria-label="Explore ${escapeHtml(c.title)} with ${count} topics" aria-pressed="${i===state.chapter}"><small class="planet-number">${String(i+1).padStart(2,'0')}</small>${planetMarkup(i, i%5===0?70:i%4===0?64:55)}<span class="planet-name">${escapeHtml(SHORT_NAMES[i]||c.title)}</span></button>`}).join('')}<span class="galaxy-legend">SELECT A PLANET TO UNLOCK ITS TOPICS · MOTION CAN BE DISABLED</span></div><aside class="galaxy-aside" id="chapter-panel"><span class="aside-label">SELECTED KNOWLEDGE WORLD · ${String(state.chapter+1).padStart(2,'0')}</span><div class="planet-preview">${planetMarkup(state.chapter,96)}</div><h2>${escapeHtml(ch.title)}</h2><p>${escapeHtml(ch.summary)}</p><div class="aside-stats"><div><b>${arr.length}</b><small>Topics</small></div><div><b>${mastered}</b><small>Mastered</small></div></div><div class="mini-track"><b style="width:${arr.length?100*mastered/arr.length:0}%"></b></div><button class="btn accent" id="open-next">Study recommended topic →</button><p class="footnote" style="margin-top:14px">Open a subject group to explore specific topics.</p>${groups}</aside></div>`;
}
// Private user-owned attempts only. This is an activity summary, not a competence grade.
function activityInsights(){
 const valid=state.attempts.filter(a=>a&&a.created_at&&!Number.isNaN(Date.parse(a.created_at)));
 const dates=[...new Set(valid.map(a=>new Date(a.created_at).toISOString().slice(0,10)))].sort().reverse();
 let streak=0;const cursor=new Date();cursor.setUTCHours(0,0,0,0);
 if(!dates.includes(cursor.toISOString().slice(0,10)))cursor.setUTCDate(cursor.getUTCDate()-1);
 while(dates.includes(cursor.toISOString().slice(0,10))){streak++;cursor.setUTCDate(cursor.getUTCDate()-1)}
 const weak=state.topics.filter(t=>getP(t).status===1)
  .sort((a,b)=>(getP(a).confidence||0)-(getP(b).confidence||0)).slice(0,5);
 return `<div class="panel" style="margin-top:16px"><span class="eyebrow">PRACTICE INSIGHTS · NOT A VERIFIED SKILL SCORE</span><h2>${valid.length} recorded attempts · ${streak}-day activity streak</h2><p class="footnote">Streak uses recorded UTC practice dates, may differ around midnight. Review priority is based on saved confidence and revision dates, not model-verified ability.</p><h3>Suggested revision</h3>${weak.length?weak.map(t=>`<button class="topic-row" data-topic="${encodeURIComponent(key(t))}">${escapeHtml(t.title)} · confidence ${getP(t).confidence||0}/5</button>`).join(''):'<p class="footnote">Practice a topic to build a revision list.</p>'}</div>`;
}
function answerStructureChecklist(text){
 const signals=window.GalaxyConversationCoach?.deliverySignals(text);
 if(!signals)return '';
 const a=signals.signals;
 const status=(v)=>v?'Present in wording':'Consider adding';
 return '<details><summary>Answer structure checklist · free (not factual grading)</summary>'+
  '<p>Technical explanation: '+status(a.explanation)+' · Concrete example: '+status(a.example)+
  ' · Sufficient detail: '+status(a.sufficientDetail)+'</p>'+
  '<p class="footnote">These indicators are based on visible wording, not semantic correctness. Verify the lesson reference and sources.</p></details>';
}
// Galaxy-only entitlement display. The database quota RPC, not these cards, is authoritative.
const PLAN_FEATURES=[
 ['246 study topics',true,true,true],
 ['Local guided practice',true,true,true],
 ['Private learning progress',true,true,true],
 ['Model evaluations / user / UTC day','5','10','20'],
 ['Five-question practice sessions',true,true,true],
 ['Priority review scheduling',true,true,true],
 ['Advanced interviewer scenarios','Planned','Planned','Planned'],
 ['AI contextual interviewer','Quota-based','Quota-based','Quota-based']
];
function plansMarkup(){
 const code=state.planInfo?.plan_code||'FREE';
 const limit=state.planInfo?.daily_eval_limit||5;
 const cap=state.planInfo?.allowed===false?'Access restricted':`${limit} model evaluations per UTC day`;
 const tiers=['FREE','PLUS','PRO'];
 return intro('ACCOUNT & CAPABILITIES','Your <span class="gradient-text">Galaxy plan.</span>','A transparent feature matrix. No payments or self-service upgrades are enabled; daily AI usage is enforced by the secure backend.')+
 `<div class="panel"><h2>${state.isGuest?'Guest preview':escapeHtml(state.user?.email||'Account')}</h2><p>Current entitlement: <strong>${escapeHtml(code)}</strong> · ${escapeHtml(cap)}</p><p>Galaxy onboarding: <strong>${escapeHtml(state.approvalInfo?.status||'Not checked')}</strong>${state.approvalInfo?.approval_required?' · Admin approval enforced':' · Review gate not yet enforced'}</p><p class="footnote">${state.isGuest?'Sign in to load your account entitlement.':'This is your server-owned subscription status, never a browser-controlled plan.'}</p><button class="btn accent" id="plan-refresh">Refresh plan</button>${state.isGuest?'<button class="btn ghost" id="plan-signin">Sign in</button>':''}</div>`+renewalNoticeMarkup()+
 `<div class="grid-two" style="margin-top:16px">${tiers.map((tier,i)=>`<section class="panel"><span class="eyebrow">${tier}</span><h2>${tier==='FREE'?'Free study':tier==='PLUS'?'Expanded practice':'Highest daily allowance'}</h2><p>${[5,10,20][i]} AI evaluations per day, subject to existing global quota</p><p class="footnote">${tier===code?'Your current plan':tier==='FREE'?'No payment needed':'No purchase or upgrade available yet'}</p></section>`).join('')}</div>`+
 `<div class="panel" style="margin-top:16px;overflow-x:auto"><h2>Capability comparison</h2><table style="width:100%;text-align:left"><thead><tr><th>Feature</th><th>FREE</th><th>PLUS</th><th>PRO</th></tr></thead><tbody>${PLAN_FEATURES.map(row=>`<tr>${row.map(cell=>`<td style="padding:10px;border-bottom:1px solid rgba(150,170,210,.18)">${cell===true?'✓':escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="footnote">Planned features are not currently included in any tier. Entitlements cannot be granted from browser JavaScript.</p></div>`;
}
async function refreshPlan(){
 if(state.isGuest||typeof state.client?.rpc!=='function'){state.planInfo=null;state.planLifecycle=null;render();return}
 const currentUser=state.user?.id;
 const [result,lifecycle]=await Promise.all([
  state.client.rpc('genai_study_my_subscription'),
  state.client.rpc('galaxy_my_plan_lifecycle')
 ]);
 if(state.isGuest||state.user?.id!==currentUser)return;
 if(result.error){state.planInfo=null;notify('Plan unavailable: '+result.error.message)}
 else state.planInfo=result.data;
 state.planLifecycle=lifecycle.error?null:lifecycle.data;
 render();
}
function renewalNoticeMarkup(){
 if(state.isGuest)return '';
 const notice=window.GalaxySaaSOperations?.renewal(state.planLifecycle);
 if(!notice)return '';
 return `<section class="panel" role="status" style="margin-top:12px"><strong>${escapeHtml(notice.title)}</strong><p>${escapeHtml(notice.message)}</p><p class="footnote">In-app reminder only. No automatic billing or email is sent.</p><button class="btn ghost" id="renewal-refresh" type="button">Check subscription</button></section>`;
}
// SaaS owner dashboard: server RPC always independently authorizes the active user.
function platformMarkup(){
 if(state.isGuest)return intro('PLATFORM CONTROL','Administrator sign-in required.','Use your existing Galaxy account.')+'<div class="panel"><button class="btn accent" id="platform-signin">Sign in</button></div>';
 if(!state.platformAuthorized)return intro('PLATFORM CONTROL','Restricted administration.','Only verified Galaxy platform operators can access customer data.')+
 `<div class="panel"><p>${escapeHtml(state.platformError||'No administrator authorization verified.')}</p><button id="platform-refresh" class="btn">Verify admin access</button></div>`;
 const sum=state.platformSummary,items=window.GalaxySaaSOperations?.warnings(sum,!sum)||[];
 const metricKeys=[['accounts','Enrolled learners'],['pending','Pending approvals'],['approved','Approved'],['active_subscriptions','Active paid plans'],['expiring_in_7_days','Expiring in 7 days'],['suspended','Suspended'],['learning_users','Learners with progress'],['practice_attempts_7d','Practice attempts (7d)'],['ai_evaluations_today','AI evaluations today']];
 const safeValue=value=>typeof value==='number'&&Number.isFinite(value)?value:'Unavailable';
 const info=state.platformAccounts;
 const rows=Array.isArray(info?.accounts)?info.accounts:null;
 const accountTable=rows===null?'<p>Account directory unavailable. Refresh or check service authorization.</p>':rows.length===0?'<p>No Galaxy accounts in this page.</p>':
  `<div style="overflow-x:auto"><table style="width:100%;text-align:left"><thead><tr><th>Learner</th><th>Approval</th><th>Plan</th><th>Expiry</th><th>Usage today</th><th>Manage</th></tr></thead><tbody>${rows.map(u=>{
   const remaining=window.GalaxySaaSOperations?.daysUntil(u.expires_at);
   const expiry=u.expires_at?(remaining===null?'Unverified':remaining<=0?'Expired':remaining+' days'):'Not set';
   return `<tr><td style="padding:9px"><strong>${escapeHtml(u.email||'Unknown')}</strong><div class="footnote">${escapeHtml(u.user_id)}</div></td><td>${escapeHtml(u.approval)}</td><td>${escapeHtml(u.plan_code)} · ${escapeHtml(u.subscription_status)}</td><td>${escapeHtml(expiry)}</td><td>${safeValue(u.evaluations_today)}</td><td><button class="btn ghost" data-manage-user="${escapeHtml(u.user_id)}" data-manage-email="${escapeHtml(u.email||'')}">Manage</button></td></tr>`;
  }).join('')}</tbody></table></div>`;
 return intro('GALAXY SAAS OWNER','Platform control.','One login. Galaxy-only learner directory, approval decisions, subscription lifecycle and warnings. No billing processor is active.')+
 `<div class="cards">${metricKeys.map(([key,label])=>`<div class="panel metric"><span class="eyebrow">${escapeHtml(label)}</span><strong>${safeValue(sum?.[key])}</strong></div>`).join('')}</div>`+
 `<section class="panel" style="margin-top:16px"><h2>Operations & warnings</h2>${items.map(w=>`<p><strong>${escapeHtml(w.level.toUpperCase())} — ${escapeHtml(w.title)}</strong> · ${escapeHtml(w.message)}</p>`).join('')}${state.platformDataError?`<p class="footnote">${escapeHtml(state.platformDataError)}</p>`:''}<p class="footnote">Revenue, Azure costs, payment settlement and service-health alerts are unavailable until trusted data sources are connected.</p><button class="btn" id="platform-refresh">Refresh live counts</button></section>`+
 `<section class="panel" style="margin-top:16px"><h2>Signup approval requests</h2><p class="footnote">Galaxy signups appear through the normal email/password flow. An in-app queue is not a delivered email or an enforced access gate. ${state.approvalInfo?.approval_required?'Approval enforcement is active.':'Approval enforcement has not been activated.'}</p>${state.platformPending.length?state.platformPending.map(x=>`<div class="panel" style="margin-top:12px"><strong>${escapeHtml(x.email||'Account')}</strong><p class="footnote">${escapeHtml(x.user_id)}</p><div class="practice-actions"><button class="btn accent" data-platform-approve="${escapeHtml(x.user_id)}">Approve</button><button class="btn ghost" data-platform-reject="${escapeHtml(x.user_id)}">Reject</button></div></div>`).join(''):'<p>No pending requests returned.</p>'}</section>`+
 `<section class="panel" style="margin-top:16px"><h2>Learner account directory</h2><p class="footnote">Only Galaxy-enrolled learner identities; unrelated accounts in shared Supabase Auth are excluded.</p>${accountTable}<div class="practice-actions"><button class="btn ghost" id="platform-prev" ${!info||state.platformOffset===0?'disabled':''}>Previous</button><span>${info?state.platformOffset+1:0} – ${info?Math.min(state.platformOffset+25,info.total||0):0} of ${info?.total??'Unknown'}</span><button class="btn ghost" id="platform-next" ${!info||state.platformOffset+25>=info.total?'disabled':''}>Next</button></div></section>`+
 `<section class="panel" style="margin-top:16px"><h2>Subscription management</h2><p class="footnote">Only APPROVED Galaxy accounts can be assigned a paid plan. All changes are checked and audited by the server. No automatic charges or renewal occur.</p><form id="platform-plan-form">
 <label>Learner account UUID<input id="platform-target" type="text" required placeholder="Select Manage in account directory"/></label>
 <label>Plan<select id="platform-plan"><option>FREE</option><option>PLUS</option><option>PRO</option></select></label>
 <label>Status<select id="platform-status"><option>ACTIVE</option><option>PAST_DUE</option><option>SUSPENDED</option><option>CANCELLED</option><option>EXPIRED</option></select></label>
 <label>Valid for days (manual renewal)<input id="platform-days" type="number" min="1" max="365" value="30" required/></label>
 <label>Reason<input id="platform-reason" type="text" minlength="10" maxlength="300" required placeholder="Reason for audited entitlement update"/></label><button class="btn accent" type="submit">Save subscription decision</button></form></section>`+
 `<section class="panel" style="margin-top:16px"><h2>Recent administrator decisions</h2>${state.platformAudit===null?'<p>Audit unavailable.</p>':state.platformAudit.length?state.platformAudit.map(e=>`<p class="footnote"><strong>${escapeHtml(e.action)}</strong> · ${escapeHtml(e.created_at||'')} · ${escapeHtml(e.target_id||'')} · ${escapeHtml(e.reason||'')}</p>`).join(''):'<p>No changes recorded yet.</p>'}</section>`;
}
async function requestGalaxyAccess(){
 if(state.isGuest||typeof state.client?.rpc!=='function')return;
 const userId=state.user?.id;
 const response=await state.client.rpc('galaxy_request_access');
 if(state.isGuest||state.user?.id!==userId)return;
 if(response.error){state.approvalInfo=null;return}
 const approval=await state.client.rpc('galaxy_account_approval');
 if(state.isGuest||state.user?.id!==userId)return;
 state.approvalInfo=approval.error?response.data:approval.data;
 render();
}
async function platformRefresh(){
 if(state.isGuest||typeof state.client?.rpc!=='function')return;
 const identity=state.user?.id;
 const result=await state.client.rpc('galaxy_platform_summary');
 if(state.user?.id!==identity)return;
 if(result.error){
  state.platformAuthorized=false;state.platformSummary=null;state.platformPending=[];
  state.platformAccounts=null;state.platformAudit=null;state.platformError='Administrator access unavailable or not granted.';
  render();return;
 }
 state.platformAuthorized=true;state.platformSummary=result.data;state.platformError='';
 const [pending,accounts,audit]=await Promise.all([
  state.client.rpc('galaxy_platform_pending',{p_limit:30}),
  state.client.rpc('galaxy_platform_accounts',{p_limit:25,p_offset:state.platformOffset}),
  state.client.rpc('galaxy_platform_audit',{p_limit:12})
 ]);
 if(state.user?.id!==identity)return;
 state.platformPending=pending.error?[]:Array.isArray(pending.data)?pending.data:[];
 state.platformAccounts=accounts.error?null:accounts.data;
 state.platformAudit=audit.error?null:Array.isArray(audit.data)?audit.data:null;
 state.platformDataError=[pending.error&&'Approval inbox unavailable',accounts.error&&'Account directory unavailable',audit.error&&'Audit unavailable'].filter(Boolean).join(' · ');
 render();
}
async function platformDecide(userId,approved){
 if(!state.platformAuthorized||!state.client)return;
 const reason=window.prompt(approved?'Reason for approving this account (10–300 characters)':'Reason for rejecting this account (10–300 characters)');
 if(!reason||reason.trim().length<10||reason.trim().length>300)return;
 const outcome=await state.client.rpc('galaxy_platform_review',{p_user_id:userId,p_approve:approved,p_reason:reason.trim()});
 notify(outcome.error?'Decision failed: '+outcome.error.message:'Account decision saved');
 await platformRefresh();
}
async function platformAssign(event){
 event.preventDefault();if(!state.platformAuthorized||!state.client)return;
 const userId=DOM('platform-target').value.trim(),code=DOM('platform-plan').value;
 const reason=DOM('platform-reason').value.trim(),days=Number(DOM('platform-days').value);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) || reason.length<10 || days<1 || days>365){notify('Invalid user, reason or duration');return}
 if(!window.confirm('Apply '+code+' / '+DOM('platform-status').value+' for '+days+' days to '+userId+'?'))return;
 const status=DOM('platform-status').value;
 if(code==='FREE'&&status!=='ACTIVE'){notify('FREE plan can only have ACTIVE status.');return}
 const out=await state.client.rpc('galaxy_platform_manage_subscription',{p_user_id:userId,p_plan:code,p_status:status,p_reason:reason,p_days:days});
 notify(out.error?'Plan assignment failed: '+out.error.message:'Plan assignment accepted by server');
 await platformRefresh();
}
function milestonePanel(){
 const m=window.GalaxyMilestones?.summarize({progress:state.progress,attempts:state.attempts});
 if(!m)return '';
 return '<section class="panel" style="margin-top:16px"><span class="eyebrow">LEARNING MILESTONES · ACTIVITY, NOT CERTIFIED SKILL</span><h2>'+
 m.earned.length+' milestones reached</h2><p>'+m.earned.map(x=>escapeHtml(x.label)).join(' · ')+
 '</p><p class="footnote">Next: '+m.next.map(x=>escapeHtml(x.label)).join(' · ')+
 '</p><p class="footnote">'+escapeHtml(m.notice)+'</p></section>';
}
function dashboard(){const s=getStats(),recent=state.attempts.slice(0,6),next=pickNext();return intro('COMMAND CENTER','Progress across the <span class="gradient-text">galaxy.</span>','Your revision path, practice history, and progress are visible here.')+`<div class="cards"><div class="panel metric"><span class="eyebrow">MASTERY</span><strong>${s.mastered}/${s.total}</strong><small>Topics mastered</small></div><div class="panel metric"><span class="eyebrow">REVISION</span><strong>${s.due}</strong><small>Reviews due today</small></div><div class="panel metric"><span class="eyebrow">EXPANDED CONTENT</span><strong>${s.expanded}</strong><small>Lessons with all 8 sections (editorial unverified)</small></div></div><div class="grid-two" style="margin-top:16px"><div class="panel"><span class="eyebrow">YOUR NEXT TARGET</span><h2>${escapeHtml(next?.title||'Choose a topic')}</h2><p>${escapeHtml(next?.summary||'')}</p><button class="btn accent" id="next-lesson">Start interview lesson →</button></div><div class="panel"><span class="eyebrow">RECENT ANSWERS</span>${recent.length?recent.map(a=>`<p class="footnote">${escapeHtml(a.topic_key.split(' / ').at(-1))} · ${a.correct===true?'Model-reviewed strong':a.correct===null?'Provisional · unverified':'Retry scheduled'} · ${escapeHtml(new Date(a.created_at).toLocaleDateString())}</p>`).join(''):'<p>No practice attempts yet. Open any topic and give a spoken or typed answer.</p>'}</div></div>`+activityInsights()+milestonePanel()}
function library(){const q=state.query.trim().toLowerCase();let matches=0;const chapters=state.subjects.map((c,ci)=>{const groups=c.groups.map(g=>{const rows=g.items.map(it=>state.topics.find(t=>t.branchIndex===ci&&t.group===g.title&&t.title===it.title)).filter(t=>t && (!q||[t.title,t.branch,t.group,t.summary].join(' ').toLowerCase().includes(q)));matches+=rows.length;return rows.length?`<div class="group-title">${escapeHtml(g.title)} · ${rows.length} topics</div><div class="pills">${rows.map(t=>`<button class="pill ${state.lessons[t.title]?'expanded':'incomplete'} ${getP(t).status===2?'mastered':''}" data-topic="${encodeURIComponent(key(t))}">${escapeHtml(t.title)}</button>`).join('')}</div>`:''}).join('');return groups?`<details class="panel library-card" ${q?'open':''}><summary>${String(ci+1).padStart(2,'0')} · ${escapeHtml(c.title)}</summary><div class="chapter-info">${escapeHtml(c.summary)}</div>${groups}</details>`:''}).join('');return intro('CURRICULUM INDEX','Learn from <span class="gradient-text">every chapter.</span>','Original 230 V3 topics preserved. Verified conversation/resume gaps added. Content still undergoing eight-part quality review.')+`<p><input type="search" id="topic-filter" class="topic-search" value="${escapeHtml(state.query)}" placeholder="Search RAG, KV cache, Azure Speech, evaluation…" aria-label="Filter topics"></p><p class="footnote" id="found-count">${matches} matching topics · Expanded lessons are highlighted, overviews are explicitly marked</p>${chapters||'<p>No topics match your search.</p>'}`}
function pickNext(){const due=state.topics.filter(t=>getP(t).next_review_at&&Date.parse(getP(t).next_review_at)<=Date.now());return due[0]||state.topics.find(t=>getP(t).status<2)||state.topics[0]}
const overview=t=>({simple:t.summary,technical:'A detailed verified technical treatment has not yet been authored for this topic.',example:'Example pending editorial review.',project:'Relevant resume/project example pending verification.',answer:'A 30–60 second model answer is pending editorial review.',workflow:[],mistakes:[],followups:[t.question||`Explain ${t.title} with an example.`],keywords:[],depth_status:'overview_only'});
function lessonMarkup(){const t=state.current||pickNext();state.current=t;const l=state.lessons[t.title]||overview(t),complete=!!state.lessons[t.title];const p=getP(t);const sections=[['Simple explanation',l.simple],['Technical explanation',l.technical],['Real-world example',l.example],['From your projects / resume',l.project],['30–60 second interview answer',l.answer],['Architecture / workflow',l.workflow],['Common mistakes',l.mistakes],['Follow-up questions',l.followups]];return `<div class="breadcrumb-text">${escapeHtml(t.phase)} › ${escapeHtml(t.branch)} › ${escapeHtml(t.group)}</div><div class="lesson-layout"><div class="lesson-column">${intro('DEEP DIVE · 8-PART LESSON',escapeHtml(t.title),t.question||'Master this topic and then speak your interview answer.')}<span class="lesson-badge ${complete?'expanded':''}">${complete?'Expanded · human editorial verification pending':'Overview only · detailed content incomplete'}</span>${sections.map(([heading,value],i)=>`<section class="content-block ${i===4?'answer':''}"><h3><span class="section-number">${String(i+1).padStart(2,'0')}</span>${escapeHtml(heading)}</h3>${Array.isArray(value)?value.length?`<${i===5?'ol':'ul'}>${value.map(a=>`<li>${escapeHtml(a)}</li>`).join('')}</${i===5?'ol':'ul'}>`:'<p>Pending editorial authoring and verification.</p>':`<p>${escapeHtml(value)}</p>`}</section>`).join('')}<div class="practice-actions"><button class="btn accent" id="practice-this">Practice this answer →</button><button class="btn ghost" id="lesson-teach">Teach me</button><button class="btn ghost" id="lesson-next">Next topic →</button><button class="btn ghost" data-view="galaxy">Back to galaxy</button></div></div><aside><div class="panel"><span class="eyebrow">MISSION PROGRESS</span><h2>${p.status===2?'Mastered':p.status===1?'In progress':'Not started'}</h2><div class="side-metric">Confidence <b>${p.confidence||0}/5</b></div><p class="footnote">${p.next_review_at?'Next review '+new Date(p.next_review_at).toLocaleDateString():'Review is scheduled after practice.'}</p><button class="btn accent" id="practice-this-side">Answer interview question</button></div><div class="panel" style="margin-top:14px"><span class="eyebrow">YOUR NOTES</span><textarea class="side-note" id="topic-note" maxlength="5000" placeholder="Write what you need to remember…">${escapeHtml(p.note||'')}</textarea><button id="save-note" class="btn">Save note</button></div></aside></div>`}
function startPractice(){if(!state.current)state.current=pickNext();state.answerDraft='';state.feedback=null;state.guideOpen=false;state.level=1;state.attemptQuestion=state.current.question||`Explain ${state.current.title} with an example.`;setView('practice')}
function questionFor(t,level){const l=state.lessons[t.title];if(level===2&&l?.followups?.length)return l.followups[0];if(level===3&&l?.followups?.length>1)return l.followups[1];return t.question||`Explain ${t.title} with an example.`}
// The deployed runtime-config.js contains only an approved public API URL.
// Do not send an AI request without an authenticated session and a deliberate click.
function modelAvailability(){
 const endpoint=window.GALAXY_EVALUATOR_URL;
 if(!endpoint)return {ready:false,message:'AI evaluation is not configured on this deployment. Local checking only; no model was called.'};
 if(typeof endpoint!=='string'||!endpoint.startsWith('https://'))return {ready:false,message:'The AI endpoint configuration is invalid. Only the free local check is available.'};
 if(!state.user||state.isGuest)return {ready:false,message:'Guest mode uses a free keyword check, not an LLM. Sign in to request model-based feedback.'};
 if(!state.client)return {ready:false,message:'Account sign-in is not ready. Only local checking is available; no model was called.'};
 return {ready:true,message:'Signed in: AI evaluation uses one existing quota-controlled model call per answer. In mock mode, up to four previous model-reviewed replies are also sent for continuity. Free local checks send nothing.'};
}
function modelFailureMessage(status){
 if(status===401||status===403)return 'AI review was not authorized. Sign in again; no valid model review was returned.';
 if(status===429)return 'Daily AI evaluation limit reached. The local check below is not a factual grade.';
 if(status===503||status===502||status===504)return 'AI service or quota check is temporarily unavailable. This is a local check only.';
 if(status===400)return 'AI service rejected the submitted answer. The local check below is not a factual grade.';
 return 'AI review failed (HTTP '+status+'). The result below is a local check, not an LLM grade.';
}

/* Free deterministic learning guidance; skipping must never mark mastery. */
function isUncertainAnswer(response){
 const str=String(response||'').trim();
 if(str.split(/\s+/).length>24)return false;
 return /\b(?:i\s+)?(?:do\s*not|don't|dont)\s+know\b|\b(?:i(?:'m| am)?\s+)?not\s+sure\b|\bno\s+idea\b|\bi\s+have\s+no\s+idea\b/i.test(str);
}
function topicAfter(current){
 const topics=state.topics;
 if(topics.length<2)return current||topics[0]||null;
 const idx=Math.max(0,topics.findIndex(t=>key(t)===key(current)));
 for(let step=1;step<topics.length;step++){
  const candidate=topics[(idx+step)%topics.length];
  if(getP(candidate).status!==2)return candidate;
 }
 return topics[(idx+1)%topics.length];
}
function showGuidedExplanation(){
 if(!state.current)return;
 stopVoice();state.guideOpen=true;state.feedback=null;state.answerDraft='';
 render();
}
function beginGuidedPractice(){
 if(!state.current)return;
 stopVoice();state.guideOpen=false;state.feedback=null;state.level=1;state.answerDraft='';
 state.attemptQuestion='In your own words, what is '+state.current.title+', and why might someone use it? Explain simply.';
 render();
}
function beginPracticeTopic(t){
 if(!t)return;
 stopVoice();state.voiceEvents=[];state.voiceElapsedMs=null;state.current=t;state.level=1;state.feedback=null;state.guideOpen=false;
 state.answerDraft='';state.attemptQuestion=questionFor(t,1);
 render();
}
async function advanceTopic(){
 const current=state.current;
 if(!current)return;
 const next=state.session?nextRoleTopic(current):topicAfter(current);
 if(!next||key(next)===key(current)){notify('There is no different topic in this study plan.');return}
 const previous=getP(current);
 if(previous.status===0){
  state.progress[key(current)]={...previous,status:1,confidence:previous.confidence||0,
   next_review_at:new Date(Date.now()+DAYS).toISOString()};
  await saveProgress(current);
 }
 if(trackMockQuestion({skipped:!state.feedback}))return;
 beginPracticeTopic(next);
}

// Practice modes are client-side coaching, not independent factual grading.
const PRACTICE_MODES=['learn','practice','mock'];
const TARGET_ROLES=['GenAI Engineer','Azure AI Engineer','Data Engineer','AI Tech Lead'];
const ROLE_TERMS={
 'GenAI Engineer':['rag','agent','prompt','embedding','llm','langgraph','evaluation'],
 'Azure AI Engineer':['azure','foundry','speech','openai','function','security','rag'],
 'Data Engineer':['databricks','spark','delta','synapse','adf','pipeline','sql'],
 'AI Tech Lead':['architecture','system','agent','monitor','security','governance','evaluation']
};
function topicRoleMatch(t){
 const info=(t.title+' '+t.branch+' '+t.group).toLowerCase();
 const extra=state.jobFocus.toLowerCase().match(/[a-z]{5,}/g)||[];
 const terms=[...ROLE_TERMS[state.targetRole],...extra.slice(0,12)];
 return terms.reduce((n,term)=>n+(info.includes(term)?1:0),0);
}
function nextRoleTopic(current){
 const tried=new Set(state.session?.topics||[]);
 const candidates=state.topics.filter(t=>key(t)!==key(current)&&getP(t).status!==2&&!tried.has(t.title));
 candidates.sort((a,b)=>topicRoleMatch(b)-topicRoleMatch(a));
 return candidates[0]||topicAfter(current);
}
function galaxyCoachPanel(){
 const reports=window.GalaxySessionReports,plan=state.coachPlan,stats=state.coachInsights;
 return `<section class="panel" style="margin-top:16px"><span class="eyebrow">PERSONAL INTERVIEW COACH · LOCAL / NO TOKEN COST</span><h2>Role preparation & insights</h2><p class="footnote">Paste only information you choose. Job and resume text remain in this browser session; no raw text is saved or sent to a model.</p>
 <label>Job description (optional)<textarea id="coach-jd" maxlength="12000" placeholder="Paste the relevant job responsibilities">${escapeHtml(state.coachJob)}</textarea></label>
 <label>Resume skills and experience (optional)<textarea id="coach-cv" maxlength="12000" placeholder="Paste skills or experience highlights">${escapeHtml(state.coachResume)}</textarea></label>
 <div class="practice-actions"><button id="coach-build" class="btn accent" type="button">Create free study plan</button><button id="coach-report" class="btn ghost" type="button">Build learning report</button><button id="coach-export" class="btn ghost" type="button" ${stats?'':'disabled'}>Copy report as CSV</button></div>
 ${plan?`<h3>Local learning plan · ${plan.days} days</h3>
 <p class="footnote">${plan.skillGaps?.length?'Possible JD skills not evidenced in CV wording: '+plan.skillGaps.map(x=>escapeHtml(x.skill)).join(', '):'No unmatched supported skill terms identified. This does not prove qualification.'}</p>
 <p class="footnote">${plan.mentionedSkills?.length?'Skills mentioned in both JD and CV: '+plan.mentionedSkills.map(x=>escapeHtml(x.skill)).join(', '):'No overlap identified from supported skill terms.'}</p>${plan.schedule.slice(0,14).map(x=>`<p class="footnote">Day ${x.day}: ${escapeHtml(x.topic)} — ${escapeHtml(x.reason)}</p>`).join('')}`:''}
 ${stats?`<h3>Practice activity report</h3><p>${stats.attemptCount} recorded attempts · ${stats.modelReviewed} model-reported reviews · ${stats.localOnly} local checks</p><p class="footnote">${escapeHtml(stats.accuracyStatus)}</p>`:''}
 <p class="footnote">JD/CV matching happens only on your device. Mentions are not proof of ability or a certified skill assessment.</p></section>`;
}
function buildCoachPlan(){
 const api=window.GalaxyPrivateStudyPlan;if(!api){notify('Coaching module unavailable; reload the site');return}
 state.coachJob=DOM('coach-jd').value.slice(0,12000);state.coachResume=DOM('coach-cv').value.slice(0,12000);
 state.coachPlan=api.buildPlan({topics:state.topics,role:state.targetRole,jobText:state.coachJob,resumeText:state.coachResume,days:14,progress:state.progress});render();
}
function buildCoachReport(){
 const api=window.GalaxySessionReports;if(!api){notify('Report module unavailable');return}
 state.coachInsights=api.summarize({attempts:state.attempts,progress:state.progress,session:state.sessionReport});render();
}
function startMockSession(){
 state.studyMode='mock';state.session={done:0,limit:5,topics:[],rounds:[],asked:[],history:[],startedAt:Date.now()};
 state.sessionReport=null;beginPracticeTopic(nextRoleTopic(state.current||pickNext()));render();
}
function finishMockSession(){
 if(!state.session)return;
 const rounds=state.session.rounds||[];
 state.sessionReport={...state.session,endedAt:Date.now(),answered:rounds.filter(r=>!r.skipped).length,
 skipped:rounds.filter(r=>r.skipped).length,modelReviewed:rounds.filter(r=>r.modelReviewed).length};
 state.session=null;state.studyMode='practice';render();
}
function trackMockQuestion({skipped=false}={}){
 if(!state.session)return false;
 const session=state.session,feedback=state.feedback,topic=state.current;
 session.done+=1;
 if(topic)session.topics.push(topic.title);
 // Session report stores minimal metrics, never a second copy of the answer.
 session.rounds.push({topic:topic?.title||'Topic',skipped:Boolean(skipped),
 modelReviewed:!skipped&&feedback?.serverReviewed===true,
 modelEstimatedAccuracy:!skipped&&feedback?.serverReviewed===true?feedback.accuracy:null,
 missingCount:!skipped?Math.min(20,feedback?.missing?.length||0):null});
 if(session.done>=session.limit){finishMockSession();return true}
 return false;
}
function practiceMarkup(){const t=state.current||pickNext(),f=state.feedback,l=state.lessons[t.title]||overview(t);state.current=t;const availability=modelAvailability();const topicOptions=state.topics.filter(x=>!!state.lessons[x.title]);return intro('INTERVIEW SIMULATOR','Practice <span class="gradient-text">real technical interviews.</span>','Choose Learn, Guided Practice or Mock Interview. Free local concept checks are not factual grades; optional authenticated AI evaluations use existing quotas.')+`<div class="panel" style="margin-bottom:16px"><div class="practice-actions" role="group" aria-label="Learning mode"><button type="button" class="btn ${state.studyMode==='learn'?'accent':'ghost'}" data-study-mode="learn">Learn first</button><button type="button" class="btn ${state.studyMode==='practice'?'accent':'ghost'}" data-study-mode="practice">Guided practice</button><button type="button" class="btn ${state.studyMode==='mock'?'accent':'ghost'}" data-study-mode="mock">Mock interview</button></div><div class="practice-actions"><label for="target-role">Target role</label><select id="target-role" aria-label="Target role">${TARGET_ROLES.map(role=>`<option ${state.targetRole===role?'selected':''}>${escapeHtml(role)}</option>`).join('')}</select><label for="job-focus">Job focus (optional)</label><input type="text" id="job-focus" maxlength="160" placeholder="e.g. RAG, Azure, LangGraph" value="${escapeHtml(state.jobFocus)}" autocomplete="off" /><button type="button" class="btn ghost" id="apply-job-focus">Apply</button>${state.session?'<button type="button" class="btn ghost" id="finish-mock">Finish mock</button>':'<button type="button" class="btn ghost" id="start-mock">Start 5-question mock</button>'}</div><p class="footnote">${state.session?`Question ${Math.min(state.session.done+1,state.session.limit)} of ${state.session.limit} · ${escapeHtml(state.targetRole)} · feedback after every question`:state.studyMode==='learn'?'Learn the concept before answering. No AI tokens required.':state.studyMode==='mock'?'Start a timed-style five-question practice session. Timing is not enforced.':'Use hints or skip without being trapped in retries.'}</p>${state.sessionReport?`<section class="score-panel" role="status"><h3>Mock interview complete</h3><p>${state.sessionReport.done} questions completed · ${escapeHtml(state.targetRole)} · ${Math.max(1,Math.ceil((state.sessionReport.endedAt-state.sessionReport.startedAt)/60000))} minutes elapsed</p><p>${state.sessionReport.answered||0} answered · ${state.sessionReport.skipped||0} skipped · ${state.sessionReport.modelReviewed||0} model-reviewed</p><p class="footnote">Model scores are unverified estimates. Local checks and skipped questions never prove mastery.</p>${(state.sessionReport.rounds||[]).map((round,i)=>'<p class="footnote">'+(i+1)+'. '+escapeHtml(round.topic)+' · '+(round.skipped?'Skipped':round.modelReviewed?'Model-reviewed · '+round.modelEstimatedAccuracy+'% estimate':'Local only · not graded')+'</p>').join('')}<button class="btn ghost" id="close-mock-report" type="button">Dismiss report</button></section>`:''}</div>${galaxyCoachPanel()}<div class="grid-two"><div class="panel"><span class="eyebrow">${state.session?`MOCK QUESTION ${Math.min(state.session.done+1,state.session.limit)} / ${state.session.limit}`:'OPEN-ENDED ROUND'} · LEVEL ${state.level}</span><h3>Topic: ${escapeHtml(t.title)}</h3><div class="practice-question">${escapeHtml(state.attemptQuestion||questionFor(t,state.level))}</div><div class="practice-actions" aria-label="Question navigation"><button type="button" class="btn accent" id="top-teach">Teach me</button><button type="button" class="btn ghost" id="top-skip">Skip / Next topic →</button><button type="button" class="btn ghost" id="top-hint">Show hint</button></div><p class="footnote">You can move forward at any time. Skipping schedules a review, not a mastery score.</p>${state.guideOpen?`<section class="panel" id="adaptive-guide" role="region" aria-label="Guided explanation"><span class="eyebrow">LEARN FIRST · NO MODEL CALL</span><h3>Start with the basics</h3><p><b>Simple explanation:</b> ${escapeHtml(l.simple)}</p><p><b>Example:</b> ${escapeHtml(l.example||'Try relating this idea to a familiar situation.')}</p><details><summary>View full reference answer</summary><p>${escapeHtml(l.answer)}</p></details><button class="btn accent" id="adaptive-guided-try" type="button">Try a simple guided question →</button></section>`:''}<p class="footnote" id="evaluation-mode" role="status">${escapeHtml(availability.message)}</p>${!availability.ready&&window.GALAXY_EVALUATOR_URL?`<button class="btn ghost" id="practice-signin" type="button">Sign in for AI evaluation →</button>`:''}<form class="practice-form" id="answer-form" style="margin-top:17px"><label for="spoken-answer">Your answer — editable transcript</label><textarea id="spoken-answer" maxlength="2000" placeholder="Tell the interviewer what it is, how it works, and when you used it…">${escapeHtml(state.answerDraft)}</textarea><div class="practice-actions"><button class="mic-button ${state.recording?'recording':''}" id="mic-control" type="button" aria-pressed="${state.recording}">${state.recording?'■ Stop listening':'🎙 Start microphone'}</button><span class="footnote" id="mic-hint">${state.recording?'Listening… pause to finish.':'Browser recognition may process audio remotely; check its privacy policy. Use a secure origin and microphone permission.'}</span></div><div class="practice-actions"><button class="btn accent" id="evaluate-btn" type="submit">${availability.ready?'Evaluate with AI (uses model tokens) →':'Check concepts locally (free) →'}</button>${availability.ready?'<button class="btn ghost" id="evaluate-local" type="button">Local check (free)</button>':''}<button class="btn ghost" id="practice-retry" type="button">Try again</button><button class="btn ghost" id="adaptive-teach" type="button">I don’t know · Teach me</button><button class="btn ghost" id="adaptive-skip" type="button">Skip / Next topic →</button></div></form>${f?`<div class="score-panel"><span class="eyebrow">${f.serverReviewed?'SERVER MODEL REVIEW · VERIFY AGAINST SOURCE':'LOCAL CONCEPT CHECK · NOT A FACTUAL GRADE'}</span><p><strong>${f.serverReviewed?f.score+'% model estimate':'Practice hint'}</strong> ${f.serverReviewed?'(not independently verified)':'(not a technical accuracy score)'} · <span class="${f.passed?'good':'weak'}">${f.serverReviewed?(f.passed?'Model-reviewed strong attempt':'Model-reviewed retry recommended'):(f.challengeReady?'Concepts mentioned · accuracy unverified':'Targeted retry · accuracy unverified')}</span></p>${f.localReason?`<p role="status"><b>Why this is a local check:</b> ${escapeHtml(f.localReason)}</p>`:''}<p>${escapeHtml(f.message)}</p>${answerStructureChecklist(state.answerDraft)}${f.missing.length?`<p><b>Consider covering:</b> ${f.missing.map(x=>`<span class="tag">${escapeHtml(x)}</span>`).join('')}</p>`:''}<p><b>Suggested interview answer:</b> ${escapeHtml(f.improved_answer||l.answer)}</p><p class="footnote">${f.challengeReady?'Adaptive step: try a harder follow-up; concept coverage alone cannot certify mastery.':'Adaptive step: revisit the simple explanation and retry.'}</p><button class="btn accent" id="adaptive-next">${state.session?'Continue interview →':f.challengeReady?(state.level>=3?'Finish Level 3 · Next topic →':'Try harder follow-up →'):'Retry targeted question →'}</button><button class="btn ghost" id="adaptive-next-topic" type="button">Next topic →</button><button class="btn ghost" id="adaptive-explain" type="button">View explanation</button></div>`:''}</div><aside class="panel"><span class="eyebrow">CHOOSE A FOCUS TOPIC</span><p class="footnote">Expanded lessons currently provide concept-specific scoring terms. Other topics only have summary-based practice.</p><select id="focus-topic" style="width:100%">${topicOptions.map(x=>`<option value="${encodeURIComponent(key(x))}" ${key(x)===key(t)?'selected':''}>${escapeHtml(x.title)}</option>`).join('')}</select><div class="content-block"><h3>Simple explanation</h3><p>${escapeHtml(l.simple)}</p></div><div class="content-block"><h3>What a good answer includes</h3><p>Clear definition, technical mechanism, relevant example, and trade-off. A local score cannot reliably detect invented facts or negation.</p></div></aside></div>`}
// Deterministic transparent proxy, NOT semantic judgment. Never mark unreviewed content factually correct.
function evaluateAnswer(t,response){const l=state.lessons[t.title];const terms=(l?.keywords?.length?l.keywords:(t.summary.match(/[A-Za-z]{5,}/g)||[]).slice(0,5)).map(x=>x.toLowerCase());const normalized=response.toLowerCase();const present=terms.filter(w=>normalized.includes(w));const missing=terms.filter(w=>!normalized.includes(w));const wordCount=response.trim().split(/\s+/).filter(Boolean).length;const coverage=terms.length?present.length/terms.length:0;const clarity=Math.min(1,wordCount/50);const score=Math.round(coverage*75+clarity*25);const challengeReady=score>=73&&wordCount>=24&&Boolean(l);return {score,passed:false,challengeReady,serverReviewed:false,missing,coverage,wordCount,message:!l?'Overview-only lesson: a substantive lesson and technical reviewer are needed.':challengeReady?'Most target concepts appear. This does not prove they were used correctly; check the reference explanation.':`Found ${present.length}/${terms.length} target concepts in ${wordCount} words. Explain the missing concepts, then try again.`}}
function revision(){const due=state.topics.filter(t=>getP(t).next_review_at&&Date.parse(getP(t).next_review_at)<=Date.now());const studying=state.topics.filter(t=>getP(t).status===1&&!due.includes(t)).slice(0,45);return intro('REPETITION ORBIT','Return stronger <span class="gradient-text">every day.</span>','Your open-answer attempts influence next revision dates and follow-up difficulty.')+`<div class="panel"><h2>Due now · ${due.length}</h2>${due.length?due.map(t=>`<button class="topic-row" data-topic="${encodeURIComponent(key(t))}">${escapeHtml(t.title)} › <small>${escapeHtml(t.branch)}</small></button>`).join(''):'<p>Nothing due now.</p>'}<h2 style="margin-top:20px">Currently learning · ${studying.length}</h2>${studying.length?studying.map(t=>`<button class="topic-row" data-topic="${encodeURIComponent(key(t))}">${escapeHtml(t.title)}</button>`).join(''):'<p>Start an open-answer practice round.</p>'}</div>`}
function vault(){if(state.isGuest)return intro('KNOWLEDGE VAULT','A private home for <span class="gradient-text">your experience.</span>','Upload resumes, projects, notes and question lists to your own encrypted private-storage bucket.')+`<div class="panel"><h2>Sign in to use private document storage</h2><p class="auth-only">Guest mode deliberately never stores sensitive documents in public frontend storage.</p><button class="btn accent" id="vault-auth">Sign in →</button></div>`;return intro('KNOWLEDGE VAULT','Your private <span class="gradient-text">source library.</span>','Documents are stored in Supabase private storage under your user ID. TXT/Markdown are extracted locally; PDF/DOCX need the optional authenticated extraction service. Scanned PDFs and malware scanning are not supported yet.')+`<div class="grid-two"><div class="panel"><span class="eyebrow">IMPORT DOCUMENT</span><form class="practice-form" id="vault-form"><label>Category<select id="doc-category"><option value="resume">Resume</option><option value="project">Projects</option><option value="topic">Topic notes</option><option value="questions">Interview questions</option></select></label><label>File (PDF, DOCX, TXT, MD, up to 8 MB)<input type="file" id="doc-file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required></label><button type="submit" class="btn accent" id="vault-upload">Upload privately →</button></form><p class="footnote">No files leave your browser until you explicitly upload. Never upload documents you are not authorized to store.</p></div><div class="panel"><span class="eyebrow">CONTENT EXTRACTION</span><h2>Generation readiness</h2><p>Text and Markdown documents can produce source-based draft questions. PDF and DOCX files are safely stored, but extraction/AI lesson generation remains blocked until a server worker with validation is deployed.</p></div></div><section class="panel" style="margin-top:16px"><h2>Your private documents · ${state.documents.length}</h2><div class="vault-grid">${state.documents.length?state.documents.map(d=>`<div class="doc-item"><strong>${escapeHtml(d.title)}</strong><small>${escapeHtml(d.category)} · ${escapeHtml(d.filename||'Text note')} · ${new Date(d.created_at).toLocaleDateString()}</small><p class="footnote">${d.body?.trim()?'Text extracted · draft questions available':'Stored · extraction pending'}</p><div class="inline-row"><button type="button" class="btn small" data-doc-questions="${escapeHtml(d.id)}" ${!d.body?.trim()?'disabled':''}>Draft questions</button>${!d.body?.trim()?`<button type="button" class="btn small" data-doc-extract="${escapeHtml(d.id)}">Retry extraction</button>`:''}<button type="button" class="btn small danger" data-doc-delete="${escapeHtml(d.id)}">Delete</button></div></div>`).join(''):'<p>No documents uploaded.</p>'}</div><div id="vault-questions" aria-live="polite"></div></section>`}
function bind(){document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.bound==='1')return;b.dataset.bound='1';b.addEventListener('click',e=>{e.preventDefault();setView(b.dataset.view)})});document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{const t=state.topics.find(x=>key(x)===decodeURIComponent(b.dataset.topic));if(t)chooseTopic(t)}));const filtered=DOM('topic-filter');if(filtered)filtered.addEventListener('input',()=>{state.query=filtered.value;const p=filtered.selectionStart;render();DOM('topic-filter')?.focus();DOM('topic-filter')?.setSelectionRange(p,p)});
 document.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>{state.chapter=Number(b.dataset.chapter);render()}));if(DOM('open-next'))DOM('open-next').onclick=()=>{const arr=chapterTopics(state.chapter);chooseTopic(arr.find(t=>getP(t).status<2)||arr[0])};if(DOM('pending-refresh'))DOM('pending-refresh').onclick=requestGalaxyAccess;
 if(DOM('pending-signout'))DOM('pending-signout').onclick=()=>DOM('signin-btn')?.click();
 if(DOM('platform-refresh'))DOM('platform-refresh').onclick=platformRefresh;
 if(DOM('platform-prev'))DOM('platform-prev').onclick=()=>{state.platformOffset=Math.max(0,state.platformOffset-25);void platformRefresh()};
 if(DOM('platform-next'))DOM('platform-next').onclick=()=>{state.platformOffset+=25;void platformRefresh()};
 document.querySelectorAll('[data-manage-user]').forEach(el=>el.onclick=()=>{
  const input=DOM('platform-target');if(!input)return;
  input.value=el.dataset.manageUser;
  const row=state.platformAccounts?.accounts?.find(x=>x.user_id===el.dataset.manageUser);
  if(row){DOM('platform-plan').value=row.plan_code;DOM('platform-status').value=['ACTIVE','PAST_DUE','SUSPENDED','CANCELLED','EXPIRED'].includes(row.subscription_status)?row.subscription_status:'ACTIVE'}
  input.focus();
 });
 if(DOM('platform-signin'))DOM('platform-signin').onclick=()=>authOpen();
 if(DOM('platform-plan-form'))DOM('platform-plan-form').onsubmit=platformAssign;
 document.querySelectorAll('[data-platform-approve]').forEach(el=>el.onclick=()=>platformDecide(el.dataset.platformApprove,true));
 document.querySelectorAll('[data-platform-reject]').forEach(el=>el.onclick=()=>platformDecide(el.dataset.platformReject,false));
 if(DOM('coach-build'))DOM('coach-build').onclick=buildCoachPlan;if(DOM('coach-report'))DOM('coach-report').onclick=buildCoachReport;if(DOM('coach-export'))DOM('coach-export').onclick=()=>{if(state.coachInsights&&window.GalaxySessionReports)navigator.clipboard?.writeText(window.GalaxySessionReports.toCsv(state.coachInsights)).then(()=>notify('CSV copied')).catch(()=>notify('Clipboard unavailable'))};if(DOM('plan-refresh'))DOM('plan-refresh').onclick=refreshPlan;
 if(DOM('renewal-refresh'))DOM('renewal-refresh').onclick=refreshPlan;if(DOM('plan-signin'))DOM('plan-signin').onclick=()=>authOpen();if(DOM('next-lesson'))DOM('next-lesson').onclick=()=>chooseTopic(pickNext());if(DOM('practice-this'))DOM('practice-this').onclick=startPractice;if(DOM('practice-this-side'))DOM('practice-this-side').onclick=startPractice;if(DOM('save-note'))DOM('save-note').onclick=async()=>{const p=getP(state.current);p.note=DOM('topic-note').value.slice(0,5000);state.progress[key(state.current)]=p;const saved=await saveProgress(state.current);notify(saved?'Note saved':'Note not saved')};
 if(DOM('answer-form')){DOM('answer-form').onsubmit=submitAnswer;if(DOM('top-teach'))DOM('top-teach').onclick=showGuidedExplanation;if(DOM('top-skip'))DOM('top-skip').onclick=advanceTopic;if(DOM('top-hint'))DOM('top-hint').onclick=()=>{state.guideOpen=true;render()};if(DOM('adaptive-teach'))DOM('adaptive-teach').onclick=showGuidedExplanation;if(DOM('adaptive-guided-try'))DOM('adaptive-guided-try').onclick=beginGuidedPractice;if(DOM('adaptive-skip'))DOM('adaptive-skip').onclick=advanceTopic;if(DOM('adaptive-next-topic'))DOM('adaptive-next-topic').onclick=advanceTopic;if(DOM('adaptive-explain'))DOM('adaptive-explain').onclick=showGuidedExplanation;if(DOM('evaluate-local'))DOM('evaluate-local').onclick=()=>submitAnswer({preventDefault(){}},true);if(DOM('practice-signin'))DOM('practice-signin').onclick=()=>authOpen();DOM('mic-control').onclick=toggleVoice;DOM('spoken-answer').oninput=e=>state.answerDraft=e.target.value;DOM('practice-retry').onclick=()=>{stopVoice();state.feedback=null;state.guideOpen=false;state.answerDraft='';render()};DOM('focus-topic').onchange=e=>{const t=state.topics.find(x=>key(x)===decodeURIComponent(e.target.value));if(t){stopVoice();state.current=t;state.level=1;state.attemptQuestion=questionFor(t,1);state.feedback=null;state.guideOpen=false;state.answerDraft='';render()}};if(DOM('adaptive-next'))DOM('adaptive-next').onclick=nextAdaptive}
 document.querySelectorAll('[data-study-mode]').forEach(b=>b.onclick=()=>{const mode=b.dataset.studyMode;if(!PRACTICE_MODES.includes(mode))return;if(mode==='mock'){startMockSession();return}state.studyMode=mode;state.session=null;state.sessionReport=null;state.guideOpen=mode==='learn';render()});
 if(DOM('target-role'))DOM('target-role').onchange=e=>{if(TARGET_ROLES.includes(e.target.value)){state.targetRole=e.target.value;render()}};
 if(DOM('apply-job-focus'))DOM('apply-job-focus').onclick=()=>{state.jobFocus=DOM('job-focus').value.slice(0,160);notify('Topic matching updated for this session');render()};
 if(DOM('start-mock'))DOM('start-mock').onclick=startMockSession;
 if(DOM('finish-mock'))DOM('finish-mock').onclick=finishMockSession;
 if(DOM('close-mock-report'))DOM('close-mock-report').onclick=()=>{state.sessionReport=null;render()};
 if(DOM('lesson-next'))DOM('lesson-next').onclick=()=>chooseTopic(topicAfter(state.current));
 if(DOM('lesson-teach'))DOM('lesson-teach').onclick=()=>{state.studyMode='learn';startPractice();state.guideOpen=true;render()};
 if(DOM('vault-auth'))DOM('vault-auth').onclick=()=>DOM('auth-modal').classList.remove('is-hidden');if(DOM('vault-form'))DOM('vault-form').onsubmit=uploadDoc;document.querySelectorAll('[data-doc-questions]').forEach(b=>b.onclick=()=>draftDocumentQuestions(b.dataset.docQuestions));document.querySelectorAll('[data-doc-delete]').forEach(b=>b.onclick=()=>deleteDoc(b.dataset.docDelete));document.querySelectorAll('[data-doc-extract]').forEach(b=>b.onclick=()=>retryExtractDoc(b.dataset.docExtract));}
function approvalPendingMarkup(){
 return intro('ACCOUNT REVIEW','Your Galaxy account is awaiting approval.','Email verification and application approval are separate steps.')+
 '<section class="panel"><h2>Review requested</h2><p>Access to private synced learning features is held until a Galaxy administrator approves your account.</p><button class="btn accent" id="pending-refresh">Check approval status</button><button class="btn ghost" id="pending-signout">Sign out</button><p class="footnote">You can still explore the free guest preview after signing out. No subscription purchase is required.</p></section>';
}
function render(){updateNav();const pending=!state.isGuest&&state.approvalInfo?.approval_required===true&&state.approvalInfo?.status!=='APPROVED'&&!state.platformAuthorized&&state.view!=='plans';DOM('root').innerHTML=pending?approvalPendingMarkup():({galaxy:scene,dashboard,library,lesson:lessonMarkup,practice:practiceMarkup,review:revision,vault,plans:plansMarkup,platform:platformMarkup})[state.view]();bind();if(state.view==='galaxy'&&!pending)positionPlanets(performance.now())}
function positionPlanets(now){const el=DOM('universe');if(!el)return;if(matchMedia('(max-width: 660px)').matches)return;const w=el.clientWidth,h=el.clientHeight;const small=w<520;const nodes=el.querySelectorAll('[data-chapter]');for(let i=0;i<nodes.length;i++){const ring=i<5?0:i<11?1:2;const n=ring===0?5:6;const index=i-(ring===0?0:ring===1?5:11);const angle=2*Math.PI*index/n+[-1.35,-.8,-1.75][ring];const rX=(small?[.26,.36,.45]:[.23,.34,.44])[ring]*w;const rY=[.20,.33,.44][ring]*h;const movement=state.motion ? now*([.000016,-.000012,.000009][ring]):0;const a=angle+movement;const wobble=state.motion?Math.sin(now*.00045+i*1.8)*2:0;nodes[i].style.transform=`translate(calc(-50% + ${Math.cos(a)*rX}px),calc(-50% + ${Math.sin(a)*rY+wobble}px))`}}
function cycle(now){if(state.motion&&state.view==='galaxy'&&!document.hidden&&now-state.lastFrame>58){positionPlanets(now);paintStars(now);state.lastFrame=now}state.galaxyFrame=requestAnimationFrame(cycle)}
function drawStars(){const canvas=DOM('stars');const dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';let seed=424212;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};state.stars=Array.from({length:Math.min(650,Math.round(w*h/2500))},()=>({x:random()*w,y:random()*h,r:.35+random()*1.25,alpha:.16+random()*.5,phase:random()*6.283,speed:.00035+random()*.0013}));paintStars(0)}
function paintStars(now){const canvas=DOM('stars');const ctx=canvas?.getContext('2d');if(!ctx)return;const dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);for(const star of state.stars){const shimmer=state.motion?(.65+.35*Math.sin(now*star.speed+star.phase)):1;ctx.fillStyle=`rgba(190,211,255,${(star.alpha*shimmer).toFixed(3)})`;ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fill()}}
let voiceGeneration=0; // Reject results/startup from obsolete microphone sessions.
function stopVoice(){
 voiceGeneration++;
 if(state.voiceStartedAt!==null)state.voiceElapsedMs=Math.max(0,Date.now()-state.voiceStartedAt);
 state.voiceStartedAt=null;
 const old=state.voice;state.voice=null;state.recording=false;state.voicePending=false;
 try{const outcome=old?.stop?.();if(outcome?.catch)outcome.catch(()=>{})}catch(_){}
}
async function toggleVoice(){
 if(state.recording||state.voicePending){stopVoice();renderVoiceState();return}
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 const generation=++voiceGeneration;
 state.voiceEvents=[];state.voiceElapsedMs=null;state.voiceStartedAt=Date.now();
 if(!Speech){
  const url=window.GALAXY_SPEECH_BROKER_URL;
  if(url&&state.client&&state.user){
   state.voicePending=true;renderVoiceState();
   try{
    const {startAzureTranscription}=await import('./speech/azure-speech-adapter.js');
    if(generation!==voiceGeneration)return;
    const initial=DOM('spoken-answer')?.value.trim()||'';
    let transcript=initial;
    const handle=await startAzureTranscription({
     brokerUrl:url,supabase:state.client,
     onTranscript:line=>{
      if(generation!==voiceGeneration||state.view!=='practice')return;
      transcript=[transcript,line].filter(Boolean).join(' ').slice(0,2000);
      const box=DOM('spoken-answer');if(box)box.value=transcript;
      state.answerDraft=transcript;
     },
     onError:message=>{
      if(generation!==voiceGeneration)return;
      notify('Azure Speech: '+message);stopVoice();renderVoiceState();
     }
    });
    if(generation!==voiceGeneration){await handle.stop();return}
    state.voice=handle;state.recording=true;
   }catch(err){
    if(generation===voiceGeneration)notify('Azure Speech unavailable: '+err.message);
   }finally{
    if(generation===voiceGeneration){state.voicePending=false;renderVoiceState()}
   }
   return;
  }
  notify('Speech recognition unavailable. Type an answer or configure the secure Azure Speech broker.');
  return;
 }
 const recognition=new Speech();
 recognition.lang='en-IN';recognition.continuous=true;recognition.interimResults=true;recognition.maxAlternatives=1;
 const initial=DOM('spoken-answer')?.value.trim()||'';
 state.voice=recognition;state.recording=true;
 recognition.onspeechstart=()=>{if(generation===voiceGeneration)state.voiceEvents.push({type:'speechstart',time:Date.now()})};
 recognition.onspeechend=()=>{if(generation===voiceGeneration)state.voiceEvents.push({type:'speechend',time:Date.now()})};
 recognition.onresult=event=>{
  if(generation!==voiceGeneration||state.view!=='practice')return;
  const finals=[],partials=[];
  for(let i=0;i<event.results.length;i++){
   const segment=event.results[i][0]?.transcript||'';
   (event.results[i].isFinal?finals:partials).push(segment);
  }
  const box=DOM('spoken-answer');
  if(box){box.value=[initial,finals.join(' '),partials.join(' ')].filter(Boolean).join(' ').slice(0,2000);state.answerDraft=box.value}
 };
 recognition.onerror=event=>{
  if(generation!==voiceGeneration)return;
  notify('Speech input: '+event.error+'. You can type or retry.');
  stopVoice();renderVoiceState(); // Never erase an editable transcript on permission/error.
 };
 recognition.onend=()=>{
  if(generation!==voiceGeneration)return;
  if(state.voiceStartedAt!==null)state.voiceElapsedMs=Math.max(0,Date.now()-state.voiceStartedAt);
  state.voiceStartedAt=null;state.voice=null;state.recording=false;renderVoiceState();
 };
 try{recognition.start();renderVoiceState()}
 catch(err){stopVoice();renderVoiceState();notify('Microphone could not start: '+err.message)}
}
function renderVoiceState(){
 const button=DOM('mic-control');if(!button)return;
 const active=state.recording||state.voicePending;
 button.classList.toggle('recording',active);
 button.textContent=state.voicePending?'■ Cancel microphone start':state.recording?'■ Stop listening':'🎙 Start microphone';
 button.setAttribute('aria-pressed',String(active));
}
async function submitAnswer(e,localOnly=false){
 e.preventDefault();
 const field=DOM('spoken-answer'),answer=field.value.trim();
 if(isUncertainAnswer(answer)){showGuidedExplanation();return}
 if(answer.length<15){notify('Please speak or type at least one complete sentence.');return}
 stopVoice();state.answerDraft=answer;
 const t=state.current,availability=modelAvailability();
 let score=evaluateAnswer(t,answer);
 if(localOnly)score.localReason='You chose the free local check. No AI model request was made.';
 else if(!availability.ready)score.localReason=availability.message;
 else{
  const button=DOM('evaluate-btn');
  if(button){button.disabled=true;button.textContent='Reviewing with AI…'}
  try{
   const {data:{session}}=await state.client.auth.getSession();
   if(!session?.access_token)throw Error('NO_SESSION');
   const req=await fetch(window.GALAXY_EVALUATOR_URL,{
    method:'POST',
    headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
    body:JSON.stringify({topic_key:key(t),question:state.attemptQuestion,response:answer,rubric_version:'v4-m2',
     history:(state.session?.history||[]).slice(-4)})
   });
   if(!req.ok)throw Error('HTTP_'+req.status);
   const result=await req.json();
   if(result.review_status!=='model_reviewed'||!Number.isFinite(result.accuracy)||!Number.isFinite(result.clarity)||!Array.isArray(result.missing_concepts)||typeof result.has_factual_errors!=='boolean')throw Error('INVALID_RESPONSE');
   const accuracy=Math.max(0,Math.min(100,result.accuracy)),clarity=Math.max(0,Math.min(100,result.clarity));
   score={...score,score:accuracy,accuracy,clarity,
    missing:result.missing_concepts.slice(0,8).map(String),
    serverReviewed:true,
    passed:accuracy>=85&&clarity>=65&&result.missing_concepts.length===0&&result.has_factual_errors===false,
    challengeReady:accuracy>=75&&result.has_factual_errors===false,
    message:result.feedback||'Compare the answer against the reference manually.',
    improved_answer:result.improved_answer,followup:result.followup};
  }catch(err){
   const error=String(err?.message||'');
   if(error==='NO_SESSION')score.localReason='Session expired. Sign in again; no authenticated AI review was returned.';
   else if(error==='INVALID_RESPONSE')score.localReason='AI returned an invalid response. Only the local keyword result is shown.';
   else if(/^HTTP_\d{3}$/.test(error))score.localReason=modelFailureMessage(Number(error.slice(5)));
   else score.localReason='AI request could not be completed (network or browser access). This is only a local keyword result.';
  }
 }
 // Only previously AI-reviewed turns become conversational context, and only after
 // a deliberate model request. Free/local answers are never sent later as history.
 if(state.session&&score.serverReviewed===true){
  const past=Array.isArray(state.session.history)?state.session.history:[];
  past.push({question:String(state.attemptQuestion||'').slice(0,300),
   response:answer.slice(0,650)});
  state.session.history=past.slice(-4);
 }
 state.feedback=score;
 const p=getP(t);
 const oldHistory=state.attempts.filter(a=>a.topic_key===key(t)&&a.correct===true).length;
 const decision=window.GalaxyEvidencePolicy?.nextReview({evidence:score,history:oldHistory});
 p.status=decision?decision.masteryCredit?2:1:score.passed&&oldHistory>=1?2:1;
 p.confidence=score.serverReviewed?Math.max(1,Math.min(5,Math.round(score.accuracy/20))):Math.max(1,Math.min(3,Math.round(score.score/35)));
 p.last_reviewed_at=dateNow();
 p.next_review_at=new Date(Date.now()+(decision?decision.days:(p.status===2?[1,3,7,14,30][Math.min(oldHistory,4)]:1))*DAYS).toISOString();
 state.progress[key(t)]=p;
 const row={level:state.level,passed:score.serverReviewed?score.passed:null,
  response:answer,feedback:`${score.serverReviewed?'model rubric':'provisional concept proxy'} ${score.score}% — missing ${score.missing.join(', ')}`};
 await Promise.allSettled([saveProgress(t),storeAttempt(t,row)]);
 render();
}
function adaptiveQuestion(t,feedback,nextLevel){
 if(feedback.challengeReady)return feedback.followup||questionFor(t,nextLevel);
 const specific=(feedback.missing||[]).slice(0,3).filter(Boolean);
 const gap=specific.length?`In your previous answer, these reference concepts were not clearly mentioned: ${specific.join(', ')}. `:'Your earlier answer needs a clearer explanation. ';
 return `${gap}Explain ${t.title} in your own words, correctly connect these concepts, and give one practical example. The keyword check cannot confirm technical accuracy.`;
}
function nextAdaptive(){
 if(!state.feedback)return;
 stopVoice();
 const feedback=state.feedback;
 if(state.session){
  const coach=window.GalaxyConversationCoach,lesson=state.lessons[state.current?.title]||{};
  const next=coach?.nextTurn({topic:state.current,lesson,answer:state.answerDraft,
    feedback,currentQuestion:state.attemptQuestion,used:state.session.asked||[],
    round:state.session.done+1});
  if(trackMockQuestion())return; // question five finishes instead of looping indefinitely
  if(next?.kind==='followup'&&next.nextQuestion){
   state.session.asked.push(state.attemptQuestion);
   state.attemptQuestion=next.nextQuestion;
   if(feedback.serverReviewed&&feedback.challengeReady)state.level=Math.min(3,state.level+1);
   state.feedback=null;state.answerDraft='';state.guideOpen=false;
   render();return;
  }
  beginPracticeTopic(nextRoleTopic(state.current));return;
 }
 const harder=feedback.challengeReady;
 if(harder&&state.level>=3){void advanceTopic();return}
 state.level=harder?Math.min(3,state.level+1):1;
 state.attemptQuestion=adaptiveQuestion(state.current,feedback,state.level);
 state.answerDraft='';state.feedback=null;state.guideOpen=false;render();
}
async function uploadDoc(e){e.preventDefault();if(!state.client||!state.user){notify('Sign in first to upload');return}const file=DOM('doc-file').files[0],category=DOM('doc-category').value;if(!file)return;const ext=file.name.split('.').pop().toLowerCase();if(!['pdf','docx','txt','md'].includes(ext)||file.size>8*1024*1024){notify('Choose PDF, DOCX, TXT or MD under 8 MB.');return}const button=DOM('vault-upload');button.disabled=true;button.textContent='Uploading securely…';const uuid=crypto.randomUUID(),cleanName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100),path=`${state.user.id}/${uuid}-${cleanName}`,bucket='genai-study-docs';try{const {error:upErr}=await state.client.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(upErr)throw upErr;let body='';if(ext==='txt'||ext==='md')body=(await file.text()).slice(0,60000);const row={id:uuid,user_id:state.user.id,title:file.name.slice(0,160),category,body,filename:file.name.slice(0,255),file_path:path,mime:file.type||'application/octet-stream'};const {error}=await state.client.from('genai_study_documents').insert(row);if(error){await state.client.storage.from(bucket).remove([path]);throw error}let extracted=!!body;let extraNote='';const extractor=window.GALAXY_VAULT_EXTRACT_URL;if(!extracted&&extractor){try{if(!extractor.startsWith('https://'))throw Error('Extractor must use HTTPS');const {data:{session}}=await state.client.auth.getSession();if(!session?.access_token)throw Error('Session missing');const res=await fetch(extractor,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({document_id:uuid})});if(!res.ok)throw Error('Extraction HTTP '+res.status);const outcome=await res.json();if(outcome.status!=='text_extracted')throw Error('Extraction failed');extracted=true}catch(err){extraNote=' · server extraction pending: '+err.message}}await loadDocuments();render();notify('Private upload saved'+(extracted?' with searchable text':' · extraction pending')+extraNote)}catch(err){notify('Upload failed: '+(err.message||err))}finally{button.disabled=false}}
async function retryExtractDoc(id){
 if(!state.user||!state.client)return notify('Sign in to extract a private document');
 const doc=state.documents.find(d=>d.id===id);
 if(!doc||doc.body?.trim())return notify('This document already has extracted text');
 const endpoint=window.GALAXY_VAULT_EXTRACT_URL;
 if(!endpoint||!endpoint.startsWith('https://'))return notify('Private extractor is not deployed; document remains safely stored');
 const button=document.querySelector('[data-doc-extract]');
 if(button){button.disabled=true;button.textContent='Extracting…'}
 try{
  const {data:{session}}=await state.client.auth.getSession();
  if(!session?.access_token)throw Error('Sign in again');
  const result=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({document_id:doc.id})});
  if(!result.ok)throw Error('Extraction HTTP '+result.status);
  const payload=await result.json();
  if(payload.status!=='text_extracted'||payload.document_id!==doc.id)throw Error('Unexpected extractor response');
  await loadDocuments();render();notify('Document text extracted; draft questions are ready');
 }catch(err){notify('Document remains private; extraction failed: '+(err.message||'unknown'));if(button){button.disabled=false;button.textContent='Retry extraction'}}
}
async function loadDocuments(){
 if(!state.client||!state.user||state.isGuest)return;
 const userId=state.user.id,epoch=authEpoch;
 const {data,error}=await state.client.from('genai_study_documents')
  .select('id,user_id,title,category,body,filename,file_path,mime,created_at')
  .eq('user_id',userId).order('created_at',{ascending:false}).limit(200);
 if(epoch!==authEpoch||state.user?.id!==userId||state.isGuest)return;
 if(error){notify('Document list unavailable: '+error.message);return}
 if((data||[]).some(d=>d.user_id!==userId||(d.file_path&&!d.file_path.startsWith(userId+'/')))){
  state.documents=[];notify('Rejected unexpected document ownership');return;
 }
 state.documents=data||[];
}
async function deleteDoc(id){
 const userId=state.user?.id,epoch=authEpoch;
 const d=state.documents.find(d=>d.id===id&&d.user_id===userId);
 if(!userId||state.isGuest||!d||!window.confirm(`Permanently delete ${d.title}?`))return;
 if(d.file_path&&!d.file_path.startsWith(userId+'/'))return notify('Rejected unexpected document path');
 const {error}=await state.client.from('genai_study_documents').delete().eq('id',id).eq('user_id',userId);
 if(epoch!==authEpoch||state.user?.id!==userId)return;
 if(error){notify('Delete failed: '+error.message);return}
 if(d.file_path){const {error:fileError}=await state.client.storage.from('genai-study-docs').remove([d.file_path]);if(fileError)notify('Metadata deleted, but file removal failed: '+fileError.message)}
 await loadDocuments();if(epoch===authEpoch)render();
}
function draftDocumentQuestions(id){const doc=state.documents.find(d=>d.id===id);if(!doc?.body)return;const lines=doc.body.split(/[\n.!?]+/).map(x=>x.trim()).filter(x=>x.length>35).slice(0,8);DOM('vault-questions').innerHTML=`<div class="content-block"><h3>Source-based draft questions · ${escapeHtml(doc.title)}</h3><p class="footnote">These prompts are mechanically derived from your uploaded text, not model-verified lessons.</p><ol>${lines.map(l=>`<li>Explain the following from your document and give an example: “${escapeHtml(l.slice(0,160))}”</li>`).join('')}</ol></div>`}
let authMode='signin'; // signin | signup | forgot | recovery
function setAuthMode(mode){
 if(!['signin','signup','forgot','recovery'].includes(mode))return;
 authMode=mode;
 DOM('auth-title').textContent=({signin:'Welcome back, explorer.',signup:'Create your explorer account',forgot:'Reset your password',recovery:'Choose a new password'})[mode];
 DOM('auth-submit').textContent=({signin:'Sign in',signup:'Create account',forgot:'Send reset link',recovery:'Update password'})[mode];
 DOM('auth-switch').textContent=mode==='signin'?'Create an account':'Back to sign in';
 DOM('auth-forgot').classList.toggle('is-hidden',mode!=='signin');
 DOM('auth-email').closest('label').classList.toggle('is-hidden',mode==='recovery');
 DOM('auth-password').closest('label').classList.toggle('is-hidden',mode==='forgot');
 DOM('auth-email').required=mode!=='recovery';
 DOM('auth-password').required=mode!=='forgot';
 DOM('auth-password').minLength=mode==='recovery'?8:6;
 DOM('auth-password').autocomplete=['signup','recovery'].includes(mode)?'new-password':'current-password';
 DOM('auth-password').value='';
 DOM('auth-message').textContent='';
}
function authOpen(mode='signin'){
 setAuthMode(mode);DOM('auth-modal').classList.remove('is-hidden');
 (mode==='recovery'?DOM('auth-password'):DOM('auth-email')).focus();
}
function authClose(){DOM('auth-modal').classList.add('is-hidden');setAuthMode('signin')}
let authEpoch=0; // Invalidates any in-flight reads when identity changes.
function setEntryVisible(visible){
 const gate=DOM('entry-gate');if(!gate||typeof gate.classList?.toggle!=='function')return;
 gate.classList.toggle('is-hidden',!visible);
 if(!visible)gate.setAttribute?.('aria-hidden','true');
 else gate.removeAttribute?.('aria-hidden');
}
function clearPrivateCoachState(){
 state.coachResume='';state.coachJob='';state.coachPlan=null;state.coachInsights=null;state.jobFocus='';
 state.session=null;state.sessionReport=null;state.answerDraft='';state.feedback=null;
 state.voiceEvents=[];state.voiceStartedAt=null;state.voiceElapsedMs=null;
}
function resetAuthToGuest(){
 stopVoice();authEpoch++;clearPrivateCoachState();
 state.user=null;state.isGuest=true;state.documents=[];state.planInfo=null;state.planLifecycle=null;state.platformAccounts=null;state.platformAudit=null;state.platformAuthorized=false;state.platformSummary=null;state.platformPending=[];state.platformAccounts=null;state.platformAudit=null;state.planLifecycle=null;state.approvalInfo=null;
 loadGuest();render();setEntryVisible(true);
}
async function signedIn(user){
 if(!user?.id||!state.client)return;
 if(state.user?.id===user.id&&!state.isGuest)return;
 const userId=user.id,epoch=++authEpoch;
 const current=()=>authEpoch===epoch;
 // Never display an earlier account's private records during a user switch.
 if(state.user?.id&&state.user.id!==userId){
  clearPrivateCoachState();state.user=null;state.isGuest=true;state.documents=[];loadGuest();render();
 }
 try{
  const {data,error}=await state.client.from('genai_study_progress')
   .select('user_id,topic_key,status,confidence,note,last_reviewed_at,next_review_at')
   .eq('user_id',userId).limit(5000);
  if(!current())return;
  if(error)throw Error('Progress query failed: '+error.message);
  const hist=await state.client.from('genai_study_attempts')
   .select('user_id,topic_key,question_key,level,correct,response,feedback,created_at')
   .eq('user_id',userId).order('created_at',{ascending:false}).limit(500);
  if(!current())return;
  if(hist.error)throw Error('Attempt query failed: '+hist.error.message);
  const docs=await state.client.from('genai_study_documents')
   .select('id,user_id,title,category,body,filename,file_path,mime,created_at')
   .eq('user_id',userId).order('created_at',{ascending:false}).limit(200);
  if(!current())return;
  if(docs.error)throw Error('Document query failed: '+docs.error.message);
  if([...(data||[]),...(hist.data||[]),...(docs.data||[])].some(row=>row.user_id!==userId)
   ||(docs.data||[]).some(d=>d.file_path&&!d.file_path.startsWith(userId+'/')))
   throw Error('Unexpected data ownership');
  state.progress=Object.fromEntries((data||[]).map(p=>[p.topic_key,p]));
  state.attempts=hist.data||[];state.documents=docs.data||[];
  state.user=user;state.isGuest=false;
  state.platformAuthorized=false;state.platformSummary=null;state.platformPending=[];state.approvalInfo=null;
  setEntryVisible(false);
  if(authMode!=='recovery')authClose();render();notify('Signed in · private study data loaded');
  void refreshPlan();
  void platformRefresh();
  void requestGalaxyAccess();
 }catch(err){if(current())notify('Private sync unavailable: '+(err.message||'unknown error'))}
}
async function initAuth(){
 try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/+esm');
  state.client=createClient(SB_URL,SB_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  state.client.auth.onAuthStateChange((event,session)=>{
   if(event==='SIGNED_OUT'){resetAuthToGuest();return}
   if(event==='PASSWORD_RECOVERY'&&session?.user){setTimeout(()=>authOpen('recovery'),0);return}
   if((event==='INITIAL_SESSION'||event==='SIGNED_IN')&&session?.user){
    const epoch=authEpoch;
    setTimeout(()=>{if(epoch===authEpoch)void signedIn(session.user)},0);
   }
  });
  const epoch=authEpoch;
  const {data}=await state.client.auth.getUser();
  if(data?.user&&authEpoch===epoch)await signedIn(data.user);
 }catch(e){console.warn('Supabase client unavailable; guest-only study mode',e)}
}
async function authSubmit(e){
 e.preventDefault();
 if(!state.client){DOM('auth-message').textContent='Supabase SDK unavailable. Open this app through HTTPS with network access.';return}
 const mode=authMode,email=DOM('auth-email').value.trim(),password=DOM('auth-password').value;
 const button=DOM('auth-submit');if(button.disabled)return;button.disabled=true;DOM('auth-message').textContent='';
 try{
  if(mode==='forgot'){
   const redirectTo=new URL(location.pathname,location.origin).href; // never forward query/fragment
   const {error}=await state.client.auth.resetPasswordForEmail(email,{redirectTo});
   if(error)throw error;
   DOM('auth-message').textContent='If an account exists for that address, check your inbox for a password reset link.';
  }else if(mode==='recovery'){
   if(password.length<8)throw Error('Use a new password of at least 8 characters.');
   const session=await state.client.auth.getSession();
   if(session.error||!session.data?.session?.access_token)throw Error('Reset session missing or expired. Request a new reset link.');
   const outcome=await state.client.auth.updateUser({password});
   if(outcome.error)throw outcome.error;
   const identity=await state.client.auth.getUser();
   if(identity.error||!identity.data?.user)throw Error('Password changed; please sign in again.');
   await signedIn(identity.data.user);
   authClose();notify('Password updated. Account session is active.');
  }else{
   const result=mode==='signup'?await state.client.auth.signUp({email,password}):await state.client.auth.signInWithPassword({email,password});
   if(result.error)throw result.error;
   if(result.data?.session?.user)await signedIn(result.data.user);
   else DOM('auth-message').textContent='Check your email to confirm your account.';
  }
 }catch(err){DOM('auth-message').textContent=err.message||'Authentication failed'}
 finally{button.disabled=false;DOM('auth-password').value=''}
}
async function start(){try{const [cr,lr]=await Promise.all([fetch('data/curriculum.json'),fetch('data/lessons.json')]);if(!cr.ok||!lr.ok)throw Error('Could not load study data');state.subjects=await cr.json();state.lessons=await lr.json();state.subjects.forEach((ch,ci)=>ch.groups.forEach(group=>group.items.forEach(t=>state.topics.push({...t,branch:ch.title,group:group.title,phase:ch.phase,branchIndex:ci}))));if(state.subjects.length!==17||state.topics.length<230)throw Error('V3 curriculum integrity check failed');loadGuest();state.current=pickNext();DOM('motion-toggle').checked=state.motion;DOM('motion-toggle').onchange=e=>{state.motion=e.target.checked;paintStars(performance.now());positionPlanets(performance.now())};DOM('signin-btn').onclick=async()=>{if(state.isGuest)authOpen();else if(window.confirm('Sign out of your study account?')){const {error}=await state.client.auth.signOut();if(error)notify(error.message)}};DOM('auth-form').onsubmit=authSubmit;DOM('auth-switch').onclick=()=>setAuthMode(authMode==='signin'?'signup':'signin');DOM('auth-forgot').onclick=()=>authOpen('forgot');DOM('close-modal').onclick=authClose;DOM('auth-modal').onclick=e=>{if(e.target===DOM('auth-modal'))authClose()};
 if(DOM('entry-login'))DOM('entry-login').onclick=()=>authOpen('signin');
 if(DOM('entry-signup'))DOM('entry-signup').onclick=()=>authOpen('signup');
 if(DOM('entry-guest'))DOM('entry-guest').onclick=()=>setEntryVisible(false);
 addEventListener('resize',()=>{drawStars();positionPlanets(performance.now())});drawStars();setView('galaxy');state.galaxyFrame=requestAnimationFrame(cycle);initAuth()}catch(err){DOM('root').innerHTML=`<section class="panel"><h2>Unable to initialize study data</h2><p>${escapeHtml(err.message)}</p><p>Serve this folder over HTTP: <code>python -m http.server 8000</code>. Do not open index.html via file://.</p></section>`;console.error(err)}}
window.GenAIGalaxyTest={evaluateAnswer,adaptiveQuestion,questionFor,key,getStats,positionPlanets,isUncertainAnswer,topicAfter};
start();
