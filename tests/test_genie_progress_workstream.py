"""Execute feat/galaxy-genie-progress-story offline Node regression in existing Galaxy CI."""
from pathlib import Path
import subprocess
import unittest
ROOT = Path(__file__).resolve().parents[1]

class GenieWorkstreamTests(unittest.TestCase):
    def test_node_module(self):
        result = subprocess.run(['node', str(ROOT / 'tests/progress-story/test_progress_story.cjs')], cwd=ROOT, capture_output=True, text=True, timeout=12)
        self.assertEqual(result.returncode, 0, result.stdout+'\n'+result.stderr)

if __name__ == '__main__':
    unittest.main()
