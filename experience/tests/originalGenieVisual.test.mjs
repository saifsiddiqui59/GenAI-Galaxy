import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = relative=>readFileSync(new URL(relative,import.meta.url),'utf8');
test('restore exact original Genie art vocabulary, local SVG asset and correct copy',()=>{
 const svg=read('../public/models/original-genie.svg');
 assert.match(svg,/<svg[^>]+viewBox="0 0 480 430"/);
 for(const feature of ['genie-character','genie-trail','genie-left-arm','genie-right-arm','genie-sparkles','genie-robe'])
  assert(svg.includes(feature),'original art feature missing: '+feature);
 assert.match(svg,/Original Genie illustration, reused from commit 0ca9cc8/);
 assert.equal((svg.match(/<g\b/g)||[]).length,(svg.match(/<\/g>/g)||[]).length,'Original nested SVG groups must balance');
 assert(!svg.includes('http://')||svg.includes('http://www.w3.org/2000/svg'));
 const copy=read('../src/journey/GuardianJourney.jsx');
 assert(copy.includes('Your Genie glides'));
 assert(!copy.includes('Skull Master'));
});
test('show accessible, immediate loading until actual 3D collection machinery is ready',()=>{
 const html=read('../index.html'),app=read('../src/App.jsx');
 assert(html.indexOf('id="galaxy-boot"')<html.indexOf('id="root"'));
 assert(html.includes('Preparing your Genie'));
 assert(app.includes("if(!modelReady&&available3D)return undefined"));
 assert(app.includes("galaxy-original-genie"));
 assert(app.includes("models/original-genie.svg"));
 assert(app.includes("genieRef.current.style.left"));
});
test('old skeleton geometry is invisible, not a second ghost covering the original Genie',()=>{
 const jsx=read('../src/guardian/KayKitGuardian.jsx');
 assert(jsx.includes('<primitive object={source} visible={false}/>'));
 assert(jsx.includes('rigPoseRef.current={hand,hip,bag,mouth,staging,grip'));
});
