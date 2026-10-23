"""Offline regression: features/conversation-coach.js."""
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
class FeatureTest(unittest.TestCase):
 def test_behavior(self):
  subprocess.run(['node','-e',"const a=require('./features/conversation-coach.js');const t={title:'Tokens',question:'What is tokenization?'};const l={simple:'Words become tokens',followups:['How does a tokenizer work?']};if(a.nextTurn({topic:t,lesson:l,round:1}).kind!=='teach')process.exit(1);if(a.nextTurn({topic:t,lesson:l,answer:'Tokens are divided in the model to process language.',used:['What is tokenization?'],round:2}).kind!=='followup')process.exit(2);if(a.nextTurn({topic:t,lesson:l,round:5}).kind!=='complete')process.exit(3)"],cwd=ROOT,check=True,timeout=8)
if __name__=='__main__': unittest.main()
