/* GenAI Galaxy Genie Guide — original SVG character and native browser animation.
 * Inspiration (not copied assets): https://github.com/tweenjs/tween.js
 * and https://github.com/molauu/svg-character-animator
 * No remote scripts, paid assets, tracking, or privileged browser APIs.
 */
(function () {
  'use strict';
  var host = document.getElementById('genie-guide');
  if (!host) return;
  var skip = document.getElementById('genie-skip');
  var continueButton = document.getElementById('genie-continue');
  var heading = document.getElementById('genie-world-name');
  var countLabel = document.getElementById('genie-collected-count');
  var intro = document.getElementById('genie-message');
  var orbs = document.getElementById('genie-collected-orbs');
  var gift = document.getElementById('genie-gift-orb');
  var active = false;
  var previousFocus = null;
  var action = null;
  var accountKey = '';
  var seenThisPage = new Set(); // Fallback for opaque-origin/private-storage browsers.
  var palette = ['#b6a0ff','#82dce9','#f8bd84','#8ce7bd','#ee9cc3','#f5dc91'];
  var svgNS = 'http://www.w3.org/2000/svg';
  function localDay() {
    var d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  }
  // Do not persist email or raw Supabase ID in browser storage.
  function keyFor(id) {
    var h=2166136261;
    for (var i=0;i<id.length;i++) h=Math.imul(h^id.charCodeAt(i),16777619);
    return 'genai_galaxy_guide_v1_'+(h>>>0).toString(36);
  }
  function getSeen(key) {
    if (seenThisPage.has(key+'@'+localDay())) return true;
    try { return localStorage.getItem(key)===localDay(); } catch (_) { return false; }
  }
  function markSeen(key) {
    seenThisPage.add(key+'@'+localDay());
    try { localStorage.setItem(key,localDay()); } catch (_) {}
  }
  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function svg(tag,attrs) {
    var el=document.createElementNS(svgNS,tag);
    Object.keys(attrs).forEach(function(k){el.setAttribute(k,String(attrs[k]));});
    return el;
  }
  function renderCollected(worlds) {
    orbs.replaceChildren();
    // The sack only displays FULLY mastered chapters, never unfinished topics.
    worlds.slice(0,7).forEach(function(w,i) {
      var x=164+(i%4)*17;
      var y=292+Math.floor(i/4)*16;
      var gem=svg('circle',{cx:x,cy:y,r:7,fill:palette[w.index%palette.length],class:'genie-sack-world'});
      var title=svg('title',{});
      title.textContent=w.name;
      gem.appendChild(title);
      orbs.appendChild(gem);
    });
    countLabel.textContent=worlds.length+' of 17 worlds mastered';
  }
  function dismiss() {
    if (!active) return;
    active=false; action=null;
    host.classList.add('is-hidden');
    host.classList.remove('playing','no-motion');
    document.body.classList.remove('genie-open');
    host.setAttribute('aria-hidden','true');
    // Sign-in may have closed its modal before the guide appeared.
    // Never return keyboard focus to a hidden auth form.
    var previousIsVisible = previousFocus && previousFocus.isConnected &&
      !previousFocus.closest('.is-hidden');
    var focusTarget = previousIsVisible ? previousFocus : document.getElementById('signin-btn');
    if (focusTarget) focusTarget.focus();
    previousFocus=null;
  }
  function show(details) {
    if (!details || typeof details.userId!=='string' || !details.userId || !details.next) return false;
    if (active) return false;
    var key=keyFor(details.userId);
    if (getSeen(key)) return false;
    var worlds=Array.isArray(details.masteredWorlds)?details.masteredWorlds.filter(function(w){
      return w && Number.isInteger(w.index) && w.index>=0 && w.index<17 && typeof w.name==='string';
    }):[];
    renderCollected(worlds);
    heading.textContent=String(details.next.title||'Your next learning world').slice(0,150);
    intro.textContent=details.next.isReview?'Your next mission is a scheduled revision.':'Your next mission is ready. Take this world and explore.';
    gift.setAttribute('fill',palette[Math.max(0,Number(details.next.index)||0)%palette.length]);
    active=true;
    accountKey=key;
    action=typeof details.onContinue==='function'?details.onContinue:null;
    previousFocus=document.activeElement;
    host.classList.remove('is-hidden','playing','no-motion');
    host.classList.add(details.motion===false||reduced()?'no-motion':'playing');
    host.setAttribute('aria-hidden','false');
    document.body.classList.add('genie-open');
    markSeen(accountKey); // Don't replay on every refresh, even after Skip.
    // Cosmetic enhancement only: errors must not impact the study session.
    try { window.GalaxyGenieCosmicPolish?.mount({host:host,count:18}); }
    catch (e) { console.warn('Genie effects disabled',e); }
    skip.focus();
    return true;
  }
  skip.addEventListener('click',dismiss);
  continueButton.addEventListener('click',function(){
    var callback=action;
    // Snapshot the gift's bounding box before hiding its dialog.
    var sourceRect=gift.getBoundingClientRect?.()||null;
    dismiss();
    if (callback) callback({sourceRect:sourceRect});
  });
  host.addEventListener('keydown',function(e){
    if (!active) return;
    if (e.key==='Escape'){e.preventDefault();dismiss();return;}
    if (e.key==='Tab'){
      var first=skip,last=continueButton;
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  window.GalaxyGenieGuide={show:show,dismiss:dismiss};
  window.GalaxyGenieGuideTest={keyFor:keyFor,localDay:localDay,isActive:function(){return active;}};
})();
