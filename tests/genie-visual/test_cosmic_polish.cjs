'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../../genie/effects/cosmic-polish.js'),'utf8');
const styles=fs.readFileSync(path.join(__dirname,'../../genie/effects/cosmic-polish.css'),'utf8');
function element(){
 const children=[];
 return {
  children,isConnected:true,style:{values:{},setProperty(k,v){this.values[k]=v}},
  setAttribute(k,v){this[k]=v},appendChild(x){children.push(x)},
  remove(){this.isConnected=false}
 };
}
const host=element(),document={querySelector:()=>host,createElement:()=>element()};
const win={document};
vm.runInNewContext(code,{window:win,document,Math,Number}, {filename:'cosmic-polish.js'});
const api=win.GalaxyGenieCosmicPolish;
assert.equal(api.mount({host,count:500}),true);
assert.equal(host.children.length,1);
assert.equal(host.children[0].children.length,24,'particles are capped');
assert.equal(api.mount({host,count:5}),true,'mount remains idempotent');
assert.equal(host.children.length,1);
const first=JSON.stringify(api.locations(5));
assert.equal(first,JSON.stringify(api.locations(5)),'visuals are reproducible');
for(const p of host.children[0].children){
 const n=parseFloat(p.style.values['--gx']);
 assert.ok(n>=0&&n<=100);
}
api.unmount();
assert.equal(host.children[0].isConnected,false);
assert.match(styles,/prefers-reduced-motion/);
assert.match(styles,/pointer-events:none/);
assert.doesNotMatch(code,/fetch\s*\(|XMLHttpRequest|requestAnimationFrame/);
console.log('Genie cinematic decorative effects: bounded, deterministic, offline and accessible PASS');
