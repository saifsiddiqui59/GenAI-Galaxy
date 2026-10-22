import json, pathlib, re, unittest
R=pathlib.Path(__file__).resolve().parents[1]
class CurriculumTest(unittest.TestCase):
 def setUp(self):
  self.c=json.loads((R/'data/curriculum.json').read_text());self.l=json.loads((R/'data/lessons.json').read_text())
  self.rows=[(c['title'],g['title'],it['title'],it) for c in self.c for g in c['groups'] for it in g['items']]
 def test_preserves_17_planets(self): self.assertEqual(len(self.c),17)
 def test_preserves_original_v3_topics(self):
  self.assertEqual(len(self.rows),246)
  self.assertEqual(len([r for r in self.rows if not r[3].get('origin')]),230)
  self.assertEqual(len([r for r in self.rows if r[3].get('origin')]),16)
 def test_no_duplicate_keys(self): self.assertEqual(len(self.rows),len(set((a,b,c) for a,b,c,_ in self.rows)))
 def test_expanded_editorial_lessons(self):
  self.assertGreaterEqual(len(self.l),145)
  for title,value in self.l.items():
   with self.subTest(title=title):
    self.assertIn(title,[r[2] for r in self.rows]);self.assertTrue(all(value.get(k) for k in ('simple','technical','example','project','answer','workflow','mistakes','followups','keywords')))
    self.assertGreaterEqual(len(value['technical']),75)
    self.assertGreaterEqual(len(value['answer'].split()),35)
    self.assertGreaterEqual(len(value['workflow']),3)
    self.assertGreaterEqual(len(value['mistakes']),2)
    self.assertGreaterEqual(len(value['followups']),2)
 def test_topic_questions(self):
  for a,b,c,i in self.rows:
   with self.subTest(topic=c): self.assertTrue(i['summary'].strip() and i['question'].strip())
 def test_static_fingerprint(self):
  js=(R/'app.js').read_text();html=(R/'index.html').read_text()
  self.assertNotIn('service_role',js.lower());self.assertNotIn('data-choice',js);self.assertNotIn('Correct option',js)
  self.assertIn('prefers-reduced-motion',js);self.assertIn('id="mic-control"',js);self.assertIn('genai_study_progress',js)
  self.assertIn('Knowledge vault',html);self.assertIn('galaxy',html)
 def test_private_upload_limits(self):
  js=(R/'app.js').read_text();self.assertIn('genai-study-docs',js);self.assertIn('8*1024*1024',js)
if __name__=='__main__': unittest.main()
