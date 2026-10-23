/* Hosted Genie visual demo only. No Auth or data writes; all planets shown here are synthetic. */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('demo')!=='genie') return;
var demoId='galaxy-genie-public-demo-2026';
function play(){
  if(!window.GalaxyGenieGuide || !document.querySelector('.planet-node')) return false;
  try{
    localStorage.removeItem(window.GalaxyGenieGuideTest.keyFor(demoId));
  }catch(_){}
  window.GalaxyGenieGuide.dismiss();
  window.GalaxyGenieGuide.show({
    userId:demoId,
    masteredWorlds:[
      {index:0,name:'LLM Fundamentals'},
      {index:1,name:'Prompt Engineering'},
      {index:5,name:'Azure Foundry'}
    ],
    next:{index:2,title:'RAG & Retrieval',isReview:false},
    motion:document.getElementById('motion-toggle')?.checked!==false,
    onContinue:function(options){
      var target=document.querySelector('[data-chapter="2"]');
      var navigate=function(){target?.click()};
      if(window.GalaxyPlanetHandoff){
        void window.GalaxyPlanetHandoff.run({
          sourceRect:options?.sourceRect,
          target:target,
          motion:document.getElementById('motion-toggle')?.checked!==false,
          onNavigate:navigate
        });
      }else navigate();
    }
  });
  return true;
}
function ready(){
  var button=document.createElement('button');
  button.textContent='Replay Genie demo';
  button.type='button';
  button.setAttribute('aria-label','Replay Genie animation using sample data');
  button.style.cssText='position:fixed;bottom:16px;right:16px;z-index:59;background:#433486;color:#fff;border:1px solid #a9a1ff;border-radius:14px;padding:13px 18px;box-shadow:0 8px 30px #0008;cursor:pointer;font-weight:bold';
  button.addEventListener('click',play);
  document.body.appendChild(button);
  var label=document.createElement('div');
  label.textContent='GENIE DEMO • synthetic planet progress • no sign-in required';
  label.style.cssText='position:fixed;bottom:68px;right:15px;z-index:59;max-width:290px;background:#09132ae6;color:#d6dffb;font:12px system-ui,sans-serif;padding:7px 10px;border:1px solid #869acf;border-radius:8px';
  document.body.appendChild(label);
  if(play()) return;
  var observer=new MutationObserver(function(){if(play())observer.disconnect()});
  observer.observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready,{once:true});
else ready();
})();