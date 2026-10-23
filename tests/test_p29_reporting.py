"""Offline regression: features/session-reports.js."""
from pathlib import Path
import subprocess
import unittest
ROOT=Path(__file__).resolve().parents[1]
class FeatureTest(unittest.TestCase):
 def test_behavior(self):
  subprocess.run(['node','-e',"const a=require('./features/session-reports.js');const r=a.summarize({attempts:[{created_at:'2026-10-23T00:00:00Z',topic_key:'RAG',response:'secret'}],progress:{a:{status:1}}});if(r.attemptCount!==1||r.localOnly!==1||r.modelReviewed!==0)process.exit(1);if(a.toCsv(r).includes('secret'))process.exit(2)"],cwd=ROOT,check=True,timeout=8)
if __name__=='__main__': unittest.main()
