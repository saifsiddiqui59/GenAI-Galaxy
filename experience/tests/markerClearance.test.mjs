import test from 'node:test';
import assert from 'node:assert/strict';
import {overlapsGuardian} from '../src/space/markerClearance.js';
test('mobile moving atlas labels cannot overlay Skull Master face or hood',()=>{
 assert(overlapsGuardian(145,350,360,740,true));
 assert(overlapsGuardian(105,285,360,740,true));
 assert(!overlapsGuardian(275,350,360,740,true));
 assert(!overlapsGuardian(105,700,360,740,true));
});
test('desktop protects the wider guardian silhouette without hiding entire atlas',()=>{
 assert(overlapsGuardian(520,480,1440,900,false));
 assert(!overlapsGuardian(980,420,1440,900,false));
 assert(!overlapsGuardian(520,110,1440,900,false));
 assert(!overlapsGuardian(NaN,350,360,740,true));
});
