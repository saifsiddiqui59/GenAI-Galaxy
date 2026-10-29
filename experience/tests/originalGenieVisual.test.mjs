import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('real walking original 3D Skull Master is visible, not an overlaid SVG sprite',()=>{
 const app=read('../src/App.jsx'),guardian=read('../src/guardian/KayKitGuardian.jsx');
 assert(app.includes('<SpectralFootpath'));
 assert(app.includes("<Guardian rigPoseRef"));
 assert(!app.includes('galaxy-cinematic-guardian'));
 assert(!app.includes('genieRef'));
 assert(guardian.includes('<primitive object={source}/>'));
 assert(!guardian.includes('visible={false}/>'));
 assert(guardian.includes('groundedStrideAt'));
 assert(guardian.includes('stanceFoot'));
 assert(guardian.includes('walkingDistance'));
});
test('reuse correct 3D skeleton bones with real ankles and connected feet',()=>{
 const body=read('../src/guardian/KayKitGuardian.jsx');
 const legs=read('../src/guardian/riggedSkeletalLegs.js');
 assert(body.includes('straightenSkeletonLegs'));
 assert(body.includes('lengthenSkeletonLegs'));
 assert(body.includes('rig.rightHand'));
 assert(legs.includes('SkullMasterSole_'));
 assert(legs.includes('SkullMasterToe_'));
 const path=read('../src/journey/orbitalApproach.js');
 assert(path.includes('walkingRouteDistance'));
 assert(path.includes('walkDistance'));
 assert(path.includes('speed'));
 assert(path.includes('orbitalTarget'));
});
test('retain loading screen, original Genie rollback asset and normal click-to-lesson navigation',()=>{
 const html=read('../index.html'),app=read('../src/App.jsx');
 assert(html.indexOf('galaxy-boot')<html.indexOf('id="root"'));
 assert(app.includes('if(!modelReady&&available3D)'));
 assert(app.includes('studyLink(index)'));
 const rollback=read('../public/models/original-genie.svg');
 assert(rollback.includes('genie-character'));
});
