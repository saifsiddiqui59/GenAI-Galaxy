from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class FXTests(unittest.TestCase):
 def test_prop_uses_shared_clock_and_real_palm_until_release(self):
  s=(ROOT/'experience/src/effects/CollectionFX.jsx').read_text()
  for token in ('pickupAt(c.ms,order)','pick.attached&&pose.grip','copy(pose.grip)','copy(pose.mouth)',
                '!pick.stored','Satchel','onOpenSack?.()','reducedMotion'):
   self.assertIn(token,s)
  for token in ('fetch(', 'service_role', 'performance.now()', 'localStorage'):
   self.assertNotIn(token,s)
if __name__=='__main__':unittest.main()
