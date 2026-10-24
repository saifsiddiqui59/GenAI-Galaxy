from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class WarpSourceTests(unittest.TestCase):
 def test_transition_is_nonblocking_and_motion_aware(self):
  js=(ROOT/"experience/src/portal/WarpGate.jsx").read_text()
  css=(ROOT/"experience/src/portal/warp.css").read_text()
  for bit in ("WARP_MS=1050","completed.current=true","onComplete?.(request.index)","setTimeout(finish","Skip transition","reducedMotion"):
   self.assertIn(bit,js)
  self.assertIn("@media(prefers-reduced-motion:reduce)",css)
  self.assertIn("pointer-events:none",css)
  self.assertNotIn("dangerouslySetInnerHTML",js)
  self.assertNotIn('fetch(',js)
if __name__=='__main__':unittest.main()
