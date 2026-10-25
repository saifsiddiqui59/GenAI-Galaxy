import test from 'node:test';
import assert from 'node:assert/strict';
import {FACE_PROFILE,attachSculptedSkull} from '../src/guardian/skullMasterFace.js';
test('cinematic face proportions remain narrower than toy skull, keep eyes centered',()=>{
 assert(FACE_PROFILE.headRadius>=.30&&FACE_PROFILE.headRadius<.40);
 assert(FACE_PROFILE.eyeSpacing>.12&&FACE_PROFILE.eyeSpacing<.22);
 assert(FACE_PROFILE.eyeSize<.05);
});
test('unsupported rig safely remains unchanged',()=>{
 assert.equal(typeof attachSculptedSkull({getObjectByName:()=>null},{}),'function');
});
