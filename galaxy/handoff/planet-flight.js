/* Optional Genie -> Galaxy planet handoff for static HTML/CSS/JS.
 * No external runtime dependencies or paid services.
 * Caller captures the gift planet rect BEFORE dismissing the Genie.
 */
(function (root) {
  'use strict';
  const DEFAULT_DURATION = 690;
  const capDuration = n => Number.isFinite(n) ? Math.min(950, Math.max(120, n)) : DEFAULT_DURATION;
  const validRect = r => !!r && ['left','top','width','height'].every(k => Number.isFinite(r[k])) && r.width > 0 && r.height > 0;
  const rectOf = x => x?.getBoundingClientRect ? x.getBoundingClientRect() : null;
  const noMotion = () => !!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function frames(from, to) {
    const fx = from.left+from.width/2, fy=from.top+from.height/2;
    const tx=to.left+to.width/2, ty=to.top+to.height/2;
    const dx=tx-fx,dy=ty-fy;
    const size=Math.min(110,Math.max(22,from.width));
    const scaleEnd=Math.min(1.9,Math.max(.25,to.width/size));
    const translate=(x,y,scale) => 'translate(-50%,-50%) translate3d('+x+'px,'+y+'px,0) scale('+scale+')';
    return [
      {transform:translate(0,0,1),opacity:1,offset:0},
      {transform:translate(dx*.55,dy*.22-44,1.13),opacity:1,offset:.55},
      {transform:translate(dx,dy,scaleEnd),opacity:.08,offset:1}
    ];
  }
  async function run(options={}) {
    let called=false;
    function navigate() {
      if(called) return;
      called=true;
      if(typeof options.onNavigate==='function') options.onNavigate();
    }
    let orb=null, animation=null, aborted=false;
    const signal=options.signal;
    const from=options.sourceRect||rectOf(options.source);
    const to=options.targetRect||rectOf(options.target);
    const disabled=options.motion===false||noMotion();
    try {
      if(signal?.aborted) return {animated:false,reason:'aborted'};
      if(disabled) return {animated:false,reason:'reduced-motion'};
      if(!validRect(from)||!validRect(to)) return {animated:false,reason:'missing-anchor'};
      const doc=options.document||root.document;
      if(!doc?.createElement||!doc?.body?.appendChild) return {animated:false,reason:'no-document'};
      orb=doc.createElement('div');
      orb.className='galaxy-planet-flight';
      orb.setAttribute('aria-hidden','true');
      orb.style.left=String(from.left+from.width/2)+'px';
      orb.style.top=String(from.top+from.height/2)+'px';
      orb.style.width=String(Math.min(110,Math.max(22,from.width)))+'px';
      orb.style.height=orb.style.width;
      doc.body.appendChild(orb);
      if(typeof orb.animate!=='function') return {animated:false,reason:'no-web-animations'};
      animation=orb.animate(frames(from,to),{duration:capDuration(options.duration),easing:'cubic-bezier(.22,.75,.19,1)',fill:'both'});
      let abortHandler;
      const abortPromise=new Promise(resolve=>{
        abortHandler=()=>{aborted=true;animation.cancel();resolve();};
        signal?.addEventListener?.('abort',abortHandler,{once:true});
      });
      try {
        if(signal) await Promise.race([animation.finished.catch(()=>{}),abortPromise]);
        else await animation.finished.catch(()=>{});
      } finally {
        if(signal&&abortHandler)signal.removeEventListener?.('abort',abortHandler);
      }
      return {animated:!aborted,reason:aborted?'aborted':'completed'};
    } catch (_) {
      return {animated:false,reason:'animation-error'};
    } finally {
      try{animation?.cancel?.()}catch(_){}
      orb?.remove?.();
      // Lack of animation capability must never block learning navigation.
      navigate();
    }
  }
  root.GalaxyPlanetHandoff={run,frames,validRect};
})(typeof window==='object'?window:this);
