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
const state={subjects:[],topics:[],lessons:{},current:null,chapter:0,view:'galaxy',progress:{},attempts:[],documents:[],user:null,client:null,isGuest:true,query:'',attemptQuestion:'',level:1,answerDraft:'',feedback:null,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,voice:null,recording:false,voicePending:false,starFrame:0,stars:[],galaxyFrame:0,lastFrame:0};
const total=()=>state.topics.length;
const getP=t=>state.progress[key(t)]||{status:0,confidence:0,note:'',last_reviewed_at:null,next_review_at:null};
const chapterTopics=c=>state.topics.filter(t=>t.branchIndex===c);
function notify(s){const e=DOM('toast');e.textContent=s;e.classList.remove('is-hidden');clearTimeout(notify._tid);notify._tid=setTimeout(()=>e.classList.add('is-hidden'),4500)}
function getStats(){const all=state.topics.map(getP);return {total:all.length,mastered:all.filter(p=>p.status===2).length,studying:all.filter(p=>p.status===1).length,due:all.filter(p=>p.next_review_at && Date.parse(p.next_review_at)<=Date.now()).length,expanded:Object.keys(state.lessons).length}}
function saveGuest(){if(!state.isGuest)return;try{localStorage.setItem('genai_tutor_preview_progress',JSON.stringify(state.progress));localStorage.setItem('genai_tutor_preview_attempts',JSON.stringify(state.attempts.slice(-250)))}catch(e){console.warn('Guest storage unavailable',e)}}
function loadGuest(){try{state.progress=JSON.parse(localStorage.getItem('genai_tutor_preview_progress')||'{}');state.attempts=JSON.parse(localStorage.getItem('genai_tutor_preview_attempts')||'[]')}catch(_){state.progress={};state.attempts=[]}}
async function saveProgress(t){if(state.isGuest){saveGuest();return true}if(!state.client||!state.user)return false;const p=getP(t);const row={user_id:state.user.id,topic_key:key(t),status:p.status,confidence:p.confidence,note:p.note||'',last_reviewed_at:p.last_reviewed_at||null,next_review_at:p.next_review_at||null,updated_at:dateNow()};const {error}=await state.client.from('genai_study_progress').upsert(row,{onConflict:'user_id,topic_key'});if(error){notify('Cloud progress failed: '+error.message);return false}return true}
async function storeAttempt(t,output){const row={topic_key:key(t),question_key:'v4-open-'+output.level,level:output.level,correct:output.passed,response:output.response.slice(0,2000),feedback:output.feedback.slice(0,2000),created_at:dateNow()};state.attempts.unshift(row);if(state.isGuest){saveGuest();return}const {error}=await state.client.from('genai_study_attempts').insert({...row,user_id:state.user.id});if(error)notify('Attempt sync failed: '+error.message)}
function setView(name){if(!['galaxy','dashboard','library','practice','review','vault','lesson'].includes(name))return;stopVoice();state.view=name;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));DOM('page-label').textContent=({galaxy:'EXPLORE THE UNIVERSE',dashboard:'MISSION PROGRESS',library:'KNOWLEDGE CONSTELLATIONS',lesson:'DEEP DIVE · LEARNING',practice:'SPEAK AND REFINE',review:'SPACED REPETITION',vault:'PRIVATE KNOWLEDGE VAULT'})[name];render();window.scrollTo?.({top:0,behavior:state.motion?'smooth':'instant'});DOM('root')?.focus({preventScroll:true})}
function chooseTopic(t){state.current=t;state.level=1;state.answerDraft='';state.feedback=null;state.attemptQuestion=t.question||`Explain ${t.title} with an example.`;setView('lesson')}
function updateNav(){const s=getStats();DOM('sidebar-mastered').textContent=s.mastered;DOM('sync-label').textContent=state.isGuest?'Guest · device-only progress':'Supabase · private cloud sync';DOM('signin-btn').textContent=state.isGuest?'Sign in':((state.user.email||'Account').split('@')[0]+' ↗')}
function block(text,detail=''){return `<div class="panel"><span class="eyebrow">${escapeHtml(detail)}</span><h2>${escapeHtml(text)}</h2></div>`}
function intro(tag,title,description){return `<section class="section-head"><div><div class="overline">${escapeHtml(tag)}</div><h1>${title}</h1><p>${escapeHtml(description)}</p></div></section>`}
function planetVars(i,size){const [bright,mid,deep,glow]=PALETTES[i%PALETTES.length];return `--bright:${bright};--mid:${mid};--deep:${deep};--glow:${glow}88;--size:${size}px`}
function planetMarkup(i,size){return `<span class="planet ${[3,7,12].includes(i)?'has-ring':''}" style="${planetVars(i,size)}" aria-hidden="true"></span>`}
function scene(){const s=getStats();const ch=state.subjects[state.chapter];const arr=chapterTopics(state.chapter),mastered=arr.filter(t=>getP(t).status===2).length;const groups=ch.groups.map(g=>`<details class="chapter-group"><summary>${escapeHtml(g.title)} <span class="muted">(${g.items.length})</span></summary>${g.items.map(it=>{const t=arr.find(x=>x.title===it.title&&x.group===g.title);return t?`<button data-topic="${encodeURIComponent(key(t))}" aria-label="Open ${escapeHtml(it.title)}">${getP(t).status===2?'✓ ':''}${escapeHtml(it.title)}</button>`:''}).join('')}</details>`).join('');
 return intro('17 KNOWLEDGE WORLDS · 9 STUDY PHASES','Your own <span class="gradient-text">GenAI universe.</span>','Explore interactive planets, master architecture and practice interview answers out loud. Each chapter opens a guided topic constellation.')+`<div class="statline" style="margin-bottom:17px"><div class="stat-chip"><b>${s.total}</b> concepts</div><div class="stat-chip"><b>${s.expanded}</b> expanded lessons</div><div class="stat-chip"><b>${s.due}</b> reviews due</div></div><div class="galaxy-layout"><div class="universe" id="universe" aria-label="17 selectable chapter planets"><div class="nebula"></div><div class="orbit one"></div><div class="orbit two"></div><div class="orbit three"></div><div class="galaxy-core"></div><span class="core-label">GENAI CORE</span>${state.subjects.map((c,i)=>{const count=chapterTopics(i).length;return `<button type="button" class="planet-node ${i===state.chapter?'selected':''}" data-chapter="${i}" aria-label="Explore ${escapeHtml(c.title)} with ${count} topics" aria-pressed="${i===state.chapter}"><small class="planet-number">${String(i+1).padStart(2,'0')}</small>${planetMarkup(i, i%5===0?70:i%4===0?64:55)}<span class="planet-name">${escapeHtml(SHORT_NAMES[i]||c.title)}</span></button>`}).join('')}<span class="galaxy-legend">SELECT A PLANET TO UNLOCK ITS TOPICS · MOTION CAN BE DISABLED</span></div><aside class="galaxy-aside" id="chapter-panel"><span class="aside-label">SELECTED KNOWLEDGE WORLD · ${String(state.chapter+1).padStart(2,'0')}</span><div class="planet-preview">${planetMarkup(state.chapter,96)}</div><h2>${escapeHtml(ch.title)}</h2><p>${escapeHtml(ch.summary)}</p><div class="aside-stats"><div><b>${arr.length}</b><small>Topics</small></div><div><b>${mastered}</b><small>Mastered</small></div></div><div class="mini-track"><b style="width:${arr.length?100*mastered/arr.length:0}%"></b></div><button class="btn accent" id="open-next">Study recommended topic →</button><p class="footnote" style="margin-top:14px">Open a subject group to explore specific topics.</p>${groups}</aside></div>`;
}
function dashboard(){const s=getStats(),recent=state.attempts.slice(0,6),next=pickNext();return intro('COMMAND CENTER','Progress across the <span class="gradient-text">galaxy.</span>','Your revision path, practice history, and progress are visible here.')+`<div class="cards"><div class="panel metric"><span class="eyebrow">MASTERY</span><strong>${s.mastered}/${s.total}</strong><small>Topics mastered</small></div><div class="panel metric"><span class="eyebrow">REVISION</span><strong>${s.due}</strong><small>Reviews due today</small></div><div class="panel metric"><span class="eyebrow">EXPANDED CONTENT</span><strong>${s.expanded}</strong><small>Lessons with all 8 sections (editorial unverified)</small></div></div><div class="grid-two" style="margin-top:16px"><div class="panel"><span class="eyebrow">YOUR NEXT TARGET</span><h2>${escapeHtml(next?.title||'Choose a topic')}</h2><p>${escapeHtml(next?.summary||'')}</p><button class="btn accent" id="next-lesson">Start interview lesson →</button></div><div class="panel"><span class="eyebrow">RECENT ANSWERS</span>${recent.length?recent.map(a=>`<p class="footnote">${escapeHtml(a.topic_key.split(' / ').at(-1))} · ${a.correct===true?'Model-reviewed strong':a.correct===null?'Provisional · unverified':'Retry scheduled'} · ${escapeHtml(new Date(a.created_at).toLocaleDateString())}</p>`).join(''):'<p>No practice attempts yet. Open any topic and give a spoken or typed answer.</p>'}</div></div>`}
function library(){const q=state.query.trim().toLowerCase();let matches=0;const chapters=state.subjects.map((c,ci)=>{const groups=c.groups.map(g=>{const rows=g.items.map(it=>state.topics.find(t=>t.branchIndex===ci&&t.group===g.title&&t.title===it.title)).filter(t=>t && (!q||[t.title,t.branch,t.group,t.summary].join(' ').toLowerCase().includes(q)));matches+=rows.length;return rows.length?`<div class="group-title">${escapeHtml(g.title)} · ${rows.length} topics</div><div class="pills">${rows.map(t=>`<button class="pill ${state.lessons[t.title]?'expanded':'incomplete'} ${getP(t).status===2?'mastered':''}" data-topic="${encodeURIComponent(key(t))}">${escapeHtml(t.title)}</button>`).join('')}</div>`:''}).join('');return groups?`<details class="panel library-card" ${q?'open':''}><summary>${String(ci+1).padStart(2,'0')} · ${escapeHtml(c.title)}</summary><div class="chapter-info">${escapeHtml(c.summary)}</div>${groups}</details>`:''}).join('');return intro('CURRICULUM INDEX','Learn from <span class="gradient-text">every chapter.</span>','Original 230 V3 topics preserved. Verified conversation/resume gaps added. Content still undergoing eight-part quality review.')+`<p><input type="search" id="topic-filter" class="topic-search" value="${escapeHtml(state.query)}" placeholder="Search RAG, KV cache, Azure Speech, evaluation…" aria-label="Filter topics"></p><p class="footnote" id="found-count">${matches} matching topics · Expanded lessons are highlighted, overviews are explicitly marked</p>${chapters||'<p>No topics match your search.</p>'}`}
function pickNext(){const due=state.topics.filter(t=>getP(t).next_review_at&&Date.parse(getP(t).next_review_at)<=Date.now());return due[0]||state.topics.find(t=>getP(t).status<2)||state.topics[0]}
const overview=t=>({simple:t.summary,technical:'A detailed verified technical treatment has not yet been authored for this topic.',example:'Example pending editorial review.',project:'Relevant resume/project example pending verification.',answer:'A 30–60 second model answer is pending editorial review.',workflow:[],mistakes:[],followups:[t.question||`Explain ${t.title} with an example.`],keywords:[],depth_status:'overview_only'});
function lessonMarkup(){const t=state.current||pickNext();state.current=t;const l=state.lessons[t.title]||overview(t),complete=!!state.lessons[t.title];const p=getP(t);const sections=[['Simple explanation',l.simple],['Technical explanation',l.technical],['Real-world example',l.example],['From your projects / resume',l.project],['30–60 second interview answer',l.answer],['Architecture / workflow',l.workflow],['Common mistakes',l.mistakes],['Follow-up questions',l.followups]];return `<div class="breadcrumb-text">${escapeHtml(t.phase)} › ${escapeHtml(t.branch)} › ${escapeHtml(t.group)}</div><div class="lesson-layout"><div class="lesson-column">${intro('DEEP DIVE · 8-PART LESSON',escapeHtml(t.title),t.question||'Master this topic and then speak your interview answer.')}<span class="lesson-badge ${complete?'expanded':''}">${complete?'Expanded · human editorial verification pending':'Overview only · detailed content incomplete'}</span>${sections.map(([heading,value],i)=>`<section class="content-block ${i===4?'answer':''}"><h3><span class="section-number">${String(i+1).padStart(2,'0')}</span>${escapeHtml(heading)}</h3>${Array.isArray(value)?value.length?`<${i===5?'ol':'ul'}>${value.map(a=>`<li>${escapeHtml(a)}</li>`).join('')}</${i===5?'ol':'ul'}>`:'<p>Pending editorial authoring and verification.</p>':`<p>${escapeHtml(value)}</p>`}</section>`).join('')}<div class="practice-actions"><button class="btn accent" id="practice-this">Practice this answer →</button><button class="btn ghost" data-view="galaxy">Back to galaxy</button></div></div><aside><div class="panel"><span class="eyebrow">MISSION PROGRESS</span><h2>${p.status===2?'Mastered':p.status===1?'In progress':'Not started'}</h2><div class="side-metric">Confidence <b>${p.confidence||0}/5</b></div><p class="footnote">${p.next_review_at?'Next review '+new Date(p.next_review_at).toLocaleDateString():'Review is scheduled after practice.'}</p><button class="btn accent" id="practice-this-side">Answer interview question</button></div><div class="panel" style="margin-top:14px"><span class="eyebrow">YOUR NOTES</span><textarea class="side-note" id="topic-note" maxlength="5000" placeholder="Write what you need to remember…">${escapeHtml(p.note||'')}</textarea><button id="save-note" class="btn">Save note</button></div></aside></div>`}
function startPractice(){if(!state.current)state.current=pickNext();state.answerDraft='';state.feedback=null;state.level=1;state.attemptQuestion=state.current.question||`Explain ${state.current.title} with an example.`;setView('practice')}
function questionFor(t,level){const l=state.lessons[t.title];if(level===2&&l?.followups?.length)return l.followups[0];if(level===3&&l?.followups?.length>1)return l.followups[1];return t.question||`Explain ${t.title} with an example.`}
function practiceMarkup(){const t=state.current||pickNext(),f=state.feedback,l=state.lessons[t.title]||overview(t);state.current=t;const topicOptions=state.topics.filter(x=>!!state.lessons[x.title]);return intro('INTERVIEW SIMULATOR','Practice with <span class="gradient-text">your own voice.</span>','Speak or type an answer. Recognition is editable. The offline check only measures concept mentions; cloud model review requires a configured secure backend. Neither replaces expert verification.')+`<div class="grid-two"><div class="panel"><span class="eyebrow">OPEN-ENDED ROUND · LEVEL ${state.level}</span><h3>Topic: ${escapeHtml(t.title)}</h3><div class="practice-question">${escapeHtml(state.attemptQuestion||questionFor(t,state.level))}</div><form class="practice-form" id="answer-form" style="margin-top:17px"><label for="spoken-answer">Your answer — editable transcript</label><textarea id="spoken-answer" maxlength="2000" placeholder="Tell the interviewer what it is, how it works, and when you used it…">${escapeHtml(state.answerDraft)}</textarea><div class="practice-actions"><button class="mic-button ${state.recording?'recording':''}" id="mic-control" type="button" aria-pressed="${state.recording}">${state.recording?'■ Stop listening':'🎙 Start microphone'}</button><span class="footnote" id="mic-hint">${state.recording?'Listening… pause to finish.':'Browser recognition may process audio remotely; check its privacy policy. Use a secure origin and microphone permission.'}</span></div><div class="practice-actions"><button class="btn accent" id="evaluate-btn" type="submit">Evaluate my answer →</button><button class="btn ghost" id="practice-retry" type="button">Try again</button></div></form>${f?`<div class="score-panel"><span class="eyebrow">${f.serverReviewed?'SERVER MODEL REVIEW · VERIFY AGAINST SOURCE':'LOCAL CONCEPT CHECK · NOT A FACTUAL GRADE'}</span><p><strong>${f.score}%</strong> estimated concept coverage · <span class="${f.passed?'good':'weak'}">${f.serverReviewed?(f.passed?'Model-reviewed strong attempt':'Model-reviewed retry recommended'):(f.challengeReady?'Concepts mentioned · accuracy unverified':'Targeted retry · accuracy unverified')}</span></p><p>${escapeHtml(f.message)}</p>${f.missing.length?`<p><b>Consider covering:</b> ${f.missing.map(x=>`<span class="tag">${escapeHtml(x)}</span>`).join('')}</p>`:''}<p><b>Suggested interview answer:</b> ${escapeHtml(f.improved_answer||l.answer)}</p><p class="footnote">${f.challengeReady?'Adaptive step: try a harder follow-up; concept coverage alone cannot certify mastery.':'Adaptive step: revisit the simple explanation and retry.'}</p><button class="btn accent" id="adaptive-next">${f.challengeReady?'Try harder follow-up →':'Retry targeted question →'}</button></div>`:''}</div><aside class="panel"><span class="eyebrow">CHOOSE A FOCUS TOPIC</span><p class="footnote">Expanded lessons currently provide concept-specific scoring terms. Other topics only have summary-based practice.</p><select id="focus-topic" style="width:100%">${topicOptions.map(x=>`<option value="${encodeURIComponent(key(x))}" ${key(x)===key(t)?'selected':''}>${escapeHtml(x.title)}</option>`).join('')}</select><div class="content-block"><h3>Simple explanation</h3><p>${escapeHtml(l.simple)}</p></div><div class="content-block"><h3>What a good answer includes</h3><p>Clear definition, technical mechanism, relevant example, and trade-off. A local score cannot reliably detect invented facts or negation.</p></div></aside></div>`}
// Deterministic transparent proxy, NOT semantic judgment. Never mark unreviewed content factually correct.
function evaluateAnswer(t,response){const l=state.lessons[t.title];const terms=(l?.keywords?.length?l.keywords:(t.summary.match(/[A-Za-z]{5,}/g)||[]).slice(0,5)).map(x=>x.toLowerCase());const normalized=response.toLowerCase();const present=terms.filter(w=>normalized.includes(w));const missing=terms.filter(w=>!normalized.includes(w));const wordCount=response.trim().split(/\s+/).filter(Boolean).length;const coverage=terms.length?present.length/terms.length:0;const clarity=Math.min(1,wordCount/50);const score=Math.round(coverage*75+clarity*25);const challengeReady=score>=73&&wordCount>=24&&Boolean(l);return {score,passed:false,challengeReady,serverReviewed:false,missing,coverage,wordCount,message:!l?'Overview-only lesson: a substantive lesson and technical reviewer are needed.':challengeReady?'Most target concepts appear. This does not prove they were used correctly; check the reference explanation.':`Found ${present.length}/${terms.length} target concepts in ${wordCount} words. Explain the missing concepts, then try again.`}}
function revision(){const due=state.topics.filter(t=>getP(t).next_review_at&&Date.parse(getP(t).next_review_at)<=Date.now());const studying=state.topics.filter(t=>getP(t).status===1&&!due.includes(t)).slice(0,45);return intro('REPETITION ORBIT','Return stronger <span class="gradient-text">every day.</span>','Your open-answer attempts influence next revision dates and follow-up difficulty.')+`<div class="panel"><h2>Due now · ${due.length}</h2>${due.length?due.map(t=>`<button class="topic-row" data-topic="${encodeURIComponent(key(t))}">${escapeHtml(t.title)} › <small>${escapeHtml(t.branch)}</small></button>`).join(''):'<p>Nothing due now.</p>'}<h2 style="margin-top:20px">Currently learning · ${studying.length}</h2>${studying.length?studying.map(t=>`<button class="topic-row" data-topic="${encodeURIComponent(key(t))}">${escapeHtml(t.title)}</button>`).join(''):'<p>Start an open-answer practice round.</p>'}</div>`}
function vault(){if(state.isGuest)return intro('KNOWLEDGE VAULT','A private home for <span class="gradient-text">your experience.</span>','Upload resumes, projects, notes and question lists to your own encrypted private-storage bucket.')+`<div class="panel"><h2>Sign in to use private document storage</h2><p class="auth-only">Guest mode deliberately never stores sensitive documents in public frontend storage.</p><button class="btn accent" id="vault-auth">Sign in →</button></div>`;return intro('KNOWLEDGE VAULT','Your private <span class="gradient-text">source library.</span>','Documents are stored in Supabase private storage under your user ID. TXT/Markdown are extracted locally; PDF/DOCX need the optional authenticated extraction service. Scanned PDFs and malware scanning are not supported yet.')+`<div class="grid-two"><div class="panel"><span class="eyebrow">IMPORT DOCUMENT</span><form class="practice-form" id="vault-form"><label>Category<select id="doc-category"><option value="resume">Resume</option><option value="project">Projects</option><option value="topic">Topic notes</option><option value="questions">Interview questions</option></select></label><label>File (PDF, DOCX, TXT, MD, up to 8 MB)<input type="file" id="doc-file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required></label><button type="submit" class="btn accent" id="vault-upload">Upload privately →</button></form><p class="footnote">No files leave your browser until you explicitly upload. Never upload documents you are not authorized to store.</p></div><div class="panel"><span class="eyebrow">CONTENT EXTRACTION</span><h2>Generation readiness</h2><p>Text and Markdown documents can produce source-based draft questions. PDF and DOCX files are safely stored, but extraction/AI lesson generation remains blocked until a server worker with validation is deployed.</p></div></div><section class="panel" style="margin-top:16px"><h2>Your private documents · ${state.documents.length}</h2><div class="vault-grid">${state.documents.length?state.documents.map(d=>`<div class="doc-item"><strong>${escapeHtml(d.title)}</strong><small>${escapeHtml(d.category)} · ${escapeHtml(d.filename||'Text note')} · ${new Date(d.created_at).toLocaleDateString()}</small><p class="footnote">${d.body?.trim()?'Text extracted · draft questions available':'Stored · extraction pending'}</p><div class="inline-row"><button type="button" class="btn small" data-doc-questions="${escapeHtml(d.id)}" ${!d.body?.trim()?'disabled':''}>Draft questions</button>${!d.body?.trim()?`<button type="button" class="btn small" data-doc-extract="${escapeHtml(d.id)}">Retry extraction</button>`:''}<button type="button" class="btn small danger" data-doc-delete="${escapeHtml(d.id)}">Delete</button></div></div>`).join(''):'<p>No documents uploaded.</p>'}</div><div id="vault-questions" aria-live="polite"></div></section>`}
function bind(){document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.bound==='1')return;b.dataset.bound='1';b.addEventListener('click',e=>{e.preventDefault();setView(b.dataset.view)})});document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{const t=state.topics.find(x=>key(x)===decodeURIComponent(b.dataset.topic));if(t)chooseTopic(t)}));const filtered=DOM('topic-filter');if(filtered)filtered.addEventListener('input',()=>{state.query=filtered.value;const p=filtered.selectionStart;render();DOM('topic-filter')?.focus();DOM('topic-filter')?.setSelectionRange(p,p)});
 document.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>{state.chapter=Number(b.dataset.chapter);render()}));if(DOM('open-next'))DOM('open-next').onclick=()=>{const arr=chapterTopics(state.chapter);chooseTopic(arr.find(t=>getP(t).status<2)||arr[0])};if(DOM('next-lesson'))DOM('next-lesson').onclick=()=>chooseTopic(pickNext());if(DOM('practice-this'))DOM('practice-this').onclick=startPractice;if(DOM('practice-this-side'))DOM('practice-this-side').onclick=startPractice;if(DOM('save-note'))DOM('save-note').onclick=async()=>{const p=getP(state.current);p.note=DOM('topic-note').value.slice(0,5000);state.progress[key(state.current)]=p;const saved=await saveProgress(state.current);notify(saved?'Note saved':'Note not saved')};
 if(DOM('answer-form')){DOM('answer-form').onsubmit=submitAnswer;DOM('mic-control').onclick=toggleVoice;DOM('spoken-answer').oninput=e=>state.answerDraft=e.target.value;DOM('practice-retry').onclick=()=>{stopVoice();state.feedback=null;state.answerDraft='';render()};DOM('focus-topic').onchange=e=>{const t=state.topics.find(x=>key(x)===decodeURIComponent(e.target.value));if(t){stopVoice();state.current=t;state.level=1;state.attemptQuestion=questionFor(t,1);state.feedback=null;state.answerDraft='';render()}};if(DOM('adaptive-next'))DOM('adaptive-next').onclick=nextAdaptive}
 if(DOM('vault-auth'))DOM('vault-auth').onclick=()=>DOM('auth-modal').classList.remove('is-hidden');if(DOM('vault-form'))DOM('vault-form').onsubmit=uploadDoc;document.querySelectorAll('[data-doc-questions]').forEach(b=>b.onclick=()=>draftDocumentQuestions(b.dataset.docQuestions));document.querySelectorAll('[data-doc-delete]').forEach(b=>b.onclick=()=>deleteDoc(b.dataset.docDelete));document.querySelectorAll('[data-doc-extract]').forEach(b=>b.onclick=()=>retryExtractDoc(b.dataset.docExtract));}
function render(){updateNav();DOM('root').innerHTML=({galaxy:scene,dashboard,library,lesson:lessonMarkup,practice:practiceMarkup,review:revision,vault})[state.view]();bind();if(state.view==='galaxy')positionPlanets(performance.now())}
function positionPlanets(now){const el=DOM('universe');if(!el)return;if(matchMedia('(max-width: 660px)').matches)return;const w=el.clientWidth,h=el.clientHeight;const small=w<520;const nodes=el.querySelectorAll('[data-chapter]');for(let i=0;i<nodes.length;i++){const ring=i<5?0:i<11?1:2;const n=ring===0?5:6;const index=i-(ring===0?0:ring===1?5:11);const angle=2*Math.PI*index/n+[-1.35,-.8,-1.75][ring];const rX=(small?[.26,.36,.45]:[.23,.34,.44])[ring]*w;const rY=[.20,.33,.44][ring]*h;const movement=state.motion ? now*([.000016,-.000012,.000009][ring]):0;const a=angle+movement;const wobble=state.motion?Math.sin(now*.00045+i*1.8)*2:0;nodes[i].style.transform=`translate(calc(-50% + ${Math.cos(a)*rX}px),calc(-50% + ${Math.sin(a)*rY+wobble}px))`}}
function cycle(now){if(state.motion&&state.view==='galaxy'&&!document.hidden&&now-state.lastFrame>58){positionPlanets(now);paintStars(now);state.lastFrame=now}state.galaxyFrame=requestAnimationFrame(cycle)}
function drawStars(){const canvas=DOM('stars');const dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';let seed=424212;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};state.stars=Array.from({length:Math.min(650,Math.round(w*h/2500))},()=>({x:random()*w,y:random()*h,r:.35+random()*1.25,alpha:.16+random()*.5,phase:random()*6.283,speed:.00035+random()*.0013}));paintStars(0)}
function paintStars(now){const canvas=DOM('stars');const ctx=canvas?.getContext('2d');if(!ctx)return;const dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);for(const star of state.stars){const shimmer=state.motion?(.65+.35*Math.sin(now*star.speed+star.phase)):1;ctx.fillStyle=`rgba(190,211,255,${(star.alpha*shimmer).toFixed(3)})`;ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fill()}}
let voiceGeneration=0; // Reject results/startup from obsolete microphone sessions.
function stopVoice(){
 voiceGeneration++;
 const old=state.voice;state.voice=null;state.recording=false;state.voicePending=false;
 try{const outcome=old?.stop?.();if(outcome?.catch)outcome.catch(()=>{})}catch(_){}
}
async function toggleVoice(){
 if(state.recording||state.voicePending){stopVoice();renderVoiceState();return}
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 const generation=++voiceGeneration;
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
  state.voice=null;state.recording=false;renderVoiceState();
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
async function submitAnswer(e){e.preventDefault();const answer=DOM('spoken-answer').value.trim();if(answer.length<15){notify('Please speak or type at least one complete sentence.');return}stopVoice();state.answerDraft=answer;const t=state.current;let score=evaluateAnswer(t,answer);const endpoint=window.GALAXY_EVALUATOR_URL;if(endpoint&&state.client&&state.user){const button=DOM('evaluate-btn');if(button){button.disabled=true;button.textContent='Checking against reference…'}try{if(!endpoint.startsWith('https://'))throw Error('Evaluator must use HTTPS');const {data:{session}}=await state.client.auth.getSession();if(!session?.access_token)throw Error('Sign in again to evaluate');const req=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({topic_key:key(t),question:state.attemptQuestion,response:answer,rubric_version:'v4-m2'})});if(!req.ok)throw Error('Evaluator unavailable ('+req.status+')');const result=await req.json();if(result.review_status!=='model_reviewed'||!Number.isFinite(result.accuracy)||!Number.isFinite(result.clarity)||!Array.isArray(result.missing_concepts))throw Error('Malformed evaluator response');const accuracy=Math.max(0,Math.min(100,result.accuracy)),clarity=Math.max(0,Math.min(100,result.clarity));score={...score,score:accuracy,accuracy,clarity,missing:result.missing_concepts.slice(0,8).map(String),serverReviewed:true,passed:accuracy>=85&&clarity>=65&&result.missing_concepts.length===0&&result.has_factual_errors===false,challengeReady:accuracy>=75&&result.has_factual_errors===false,message:result.feedback||'Compare the answer and check references manually.',improved_answer:result.improved_answer,followup:result.followup}}catch(err){notify('Model review unavailable; saved provisional practice only: '+err.message)}}state.feedback=score;const p=getP(t);const oldHistory=state.attempts.filter(a=>a.topic_key===key(t)&&a.correct===true).length;p.status=score.passed&&oldHistory>=1?2:1;p.confidence=score.serverReviewed?Math.max(1,Math.min(5,Math.round(score.accuracy/20))):Math.max(1,Math.min(3,Math.round(score.score/35)));p.last_reviewed_at=dateNow();p.next_review_at=new Date(Date.now()+(p.status===2?[1,3,7,14,30][Math.min(oldHistory,4)]:1)*DAYS).toISOString();state.progress[key(t)]=p;const row={level:state.level,passed:score.serverReviewed?score.passed:null,response:answer,feedback:`${score.serverReviewed?'model rubric':'provisional concept proxy'} ${score.score}% — missing ${score.missing.join(', ')}`};await Promise.allSettled([saveProgress(t),storeAttempt(t,row)]);render()}
function adaptiveQuestion(t,feedback,nextLevel){
 if(feedback.challengeReady)return feedback.followup||questionFor(t,nextLevel);
 const specific=(feedback.missing||[]).slice(0,3).filter(Boolean);
 const gap=specific.length?`In your previous answer, these reference concepts were not clearly mentioned: ${specific.join(', ')}. `:'Your earlier answer needs a clearer explanation. ';
 return `${gap}Explain ${t.title} in your own words, correctly connect these concepts, and give one practical example. The keyword check cannot confirm technical accuracy.`;
}
function nextAdaptive(){if(!state.feedback)return;stopVoice();const feedback=state.feedback,harder=feedback.challengeReady;state.level=harder?Math.min(3,state.level+1):1;state.attemptQuestion=adaptiveQuestion(state.current,feedback,state.level);state.answerDraft='';state.feedback=null;render()}
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
function resetAuthToGuest(){
 stopVoice();authEpoch++;
 state.user=null;state.isGuest=true;state.documents=[];
 loadGuest();render();
}
async function signedIn(user){
 if(!user?.id||!state.client)return;
 if(state.user?.id===user.id&&!state.isGuest)return;
 const userId=user.id,epoch=++authEpoch;
 const current=()=>authEpoch===epoch;
 // Never display an earlier account's private records during a user switch.
 if(state.user?.id&&state.user.id!==userId){
  state.user=null;state.isGuest=true;state.documents=[];loadGuest();render();
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
  if(authMode!=='recovery')authClose();render();notify('Signed in · private study data loaded');
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
async function start(){try{const [cr,lr]=await Promise.all([fetch('data/curriculum.json'),fetch('data/lessons.json')]);if(!cr.ok||!lr.ok)throw Error('Could not load study data');state.subjects=await cr.json();state.lessons=await lr.json();state.subjects.forEach((ch,ci)=>ch.groups.forEach(group=>group.items.forEach(t=>state.topics.push({...t,branch:ch.title,group:group.title,phase:ch.phase,branchIndex:ci}))));if(state.subjects.length!==17||state.topics.length<230)throw Error('V3 curriculum integrity check failed');loadGuest();state.current=pickNext();DOM('motion-toggle').checked=state.motion;DOM('motion-toggle').onchange=e=>{state.motion=e.target.checked;paintStars(performance.now());positionPlanets(performance.now())};DOM('signin-btn').onclick=async()=>{if(state.isGuest)authOpen();else if(window.confirm('Sign out of your study account?')){const {error}=await state.client.auth.signOut();if(error)notify(error.message)}};DOM('auth-form').onsubmit=authSubmit;DOM('auth-switch').onclick=()=>setAuthMode(authMode==='signin'?'signup':'signin');DOM('auth-forgot').onclick=()=>authOpen('forgot');DOM('close-modal').onclick=authClose;DOM('auth-modal').onclick=e=>{if(e.target===DOM('auth-modal'))authClose()};addEventListener('resize',()=>{drawStars();positionPlanets(performance.now())});drawStars();setView('galaxy');state.galaxyFrame=requestAnimationFrame(cycle);initAuth()}catch(err){DOM('root').innerHTML=`<section class="panel"><h2>Unable to initialize study data</h2><p>${escapeHtml(err.message)}</p><p>Serve this folder over HTTP: <code>python -m http.server 8000</code>. Do not open index.html via file://.</p></section>`;console.error(err)}}
window.GenAIGalaxyTest={evaluateAnswer,adaptiveQuestion,questionFor,key,getStats,positionPlanets};
start();
