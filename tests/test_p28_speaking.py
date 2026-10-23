"""Offline regression: features/speaking-metrics.js."""
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
class FeatureTest(unittest.TestCase):
 def test_behavior(self):
  subprocess.run(['node','-e',"const a=require('./features/speaking-metrics.js');const r=a.fromTranscript('Um this this is basically useful',{elapsedMs:60000});if(r.estimatedWordsPerMinute!==6||r.fillerCount!==2||r.immediateRepetitions!==1||r.storesAudio!==false)process.exit(1);if(a.fromTranscript('hello').estimatedWordsPerMinute!==null)process.exit(2)"],cwd=ROOT,check=True,timeout=8)
if __name__=='__main__': unittest.main()
