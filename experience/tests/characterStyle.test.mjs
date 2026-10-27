import test from 'node:test';
import assert from 'node:assert/strict';
import {STYLE_PROFILE,isCostumeRed,isPaleBone,remapCostumePixel} from '../src/guardian/styleKayKit.js';
import {SKULLMASTER_PROFILE} from '../src/guardian/skullMasterMantle.js';
test('costume colors turn violet without painting skeleton bone or pale skin',()=>{
 assert.equal(STYLE_PROFILE,'skullmaster-midnight-violet');
 assert(isCostumeRed(215,44,65));
 assert(!isCostumeRed(230,205,175));
 assert(!isCostumeRed(40,190,210));
 assert(isPaleBone(230,205,175));
 const blue=remapCostumePixel(230,205,175);
 assert(blue[2]>blue[0]&&blue[0]<200);
 assert.deepEqual(remapCostumePixel(40,190,210),[40,190,210]);
 const [r,g,b]=remapCostumePixel(215,44,65);
 assert(b>r&&r>g);
});

test('Skull Master has smaller animated head and face-open hood with full dark cape',()=>{
 assert(SKULLMASTER_PROFILE.headScale>=.84 && SKULLMASTER_PROFILE.headScale<1);
 assert(SKULLMASTER_PROFILE.cloakLength>=1.1);
 assert(SKULLMASTER_PROFILE.hoodFrontGap>.6);
 assert.match(SKULLMASTER_PROFILE.outer,/^#[0-9a-f]{6}$/i);
});
