import test from 'node:test';
import assert from 'node:assert/strict';
import {kitMeshTint} from '../src/guardian/styleKayKit.js';
test('art direction darkens toy armor without tinting dedicated skull and eye glow',()=>{
 for(const name of ['Skeleton_Mage_ArmLeft','Skeleton_Mage_ArmRight','Skeleton_Mage_LegLeft','Skeleton_Mage_LegRight','Skeleton_Mage_Body'])
  assert(/^#[0-9a-f]{6}$/.test(kitMeshTint(name)));
 for(const name of ['Skeleton_Mage_Eyes','Skeleton_Mage_Skull','Skeleton_Mage_Jaw','SkullMasterCapeCloth'])
  assert.equal(kitMeshTint(name),null);
});
