"""Offline regression: features/private-study-plan.js."""
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
class FeatureTest(unittest.TestCase):
 def test_behavior(self):
  subprocess.run(['node','-e',"const a=require('./features/private-study-plan.js');const r=a.buildPlan({role:'GenAI Engineer',jobText:'RAG embeddings vectors retrieval',resumeText:'Python Azure',topics:[{title:'SQL',branch:'Data',group:'SQL'},{title:'RAG embeddings',branch:'GenAI',group:'Retrieval'}],days:2});if(r.schedule[0].topic!=='RAG embeddings')process.exit(1);if(JSON.stringify(r).includes('Python Azure'))process.exit(2)"],cwd=ROOT,check=True,timeout=8)
if __name__=='__main__': unittest.main()
