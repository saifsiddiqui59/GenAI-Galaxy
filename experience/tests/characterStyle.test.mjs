import test from 'node:test';
import assert from 'node:assert/strict';
import {STYLE_PROFILE,isCostumeRed,remapCostumePixel} from '../src/guardian/styleKayKit.js';
test('costume colors turn violet without painting skeleton bone or pale skin',()=>{
 assert.equal(STYLE_PROFILE,'midnight-violet-amber');
 assert(isCostumeRed(215,44,65));
 assert(!isCostumeRed(230,205,175));
 assert(!isCostumeRed(40,190,210));
 assert.deepEqual(remapCostumePixel(230,205,175),[230,205,175]);
 const [r,g,b]=remapCostumePixel(215,44,65);
 assert(b>r&&r>g);
});
