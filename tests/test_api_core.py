import io,sys,uuid,zipfile,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'api'))
from core import InputError,extract_text,bearer_token,document_id,topic_key,validate_review,verify_gateway,owner_document_filters,owned_storage_path,MAX_BYTES

class ApiCoreTests(unittest.TestCase):
 def test_auth_header_required(self):
  self.assertEqual(bearer_token('Bearer abc.xyz-12'),'abc.xyz-12')
  for x in ('',None,'Basic foo','Bearer hi\nInjected: header'):
   with self.subTest(x=x),self.assertRaises(InputError):bearer_token(x)
 def test_gateway_fail_closed(self):
  secret='s'*48
  verify_gateway(secret,secret)
  for supplied in (None,'',secret[:-1],'r'*48):
   with self.subTest(supplied=supplied),self.assertRaisesRegex(InputError,'gateway'):
    verify_gateway(supplied,secret)
  with self.assertRaises(RuntimeError):verify_gateway(secret,'')
  with self.assertRaises(RuntimeError):verify_gateway(secret,'too-short')
 def test_document_id(self):
  u=str(uuid.uuid4());self.assertEqual(document_id(u),u)
  with self.assertRaises(InputError):document_id('../../other-user')
 def test_owner_scoped_document_queries(self):
  user=str(uuid.uuid4());doc=str(uuid.uuid4())
  filters=owner_document_filters(user,doc)
  self.assertEqual(filters,{'id':'eq.'+doc,'user_id':'eq.'+user})
  with self.assertRaises(InputError):owner_document_filters('not-a-user',doc)
  with self.assertRaises(InputError):owner_document_filters(user,'../../other-file')
 def test_storage_path_rejects_foreign_and_unsafe_object_keys(self):
  uid=str(uuid.uuid4());other=str(uuid.uuid4())
  self.assertEqual(owned_storage_path(uid,uid+'/safe-note.md'),uid+'/safe-note.md')
  for unsafe in (other+'/safe.md',uid+'/',uid+'//a.txt',uid+'/../secret',uid+'/./a',uid+'/a\\\\b',uid+'/a\\ninvalid.txt',uid+'/a'+('x'*600)):
   with self.subTest(path=repr(unsafe)),self.assertRaises(InputError):owned_storage_path(uid,unsafe)
  with self.assertRaises(InputError):owned_storage_path('not-a-uuid',uid+'/a.txt')
 def test_vault_route_uses_server_side_path_guards(self):
  source=(R/'api/function_app.py').read_text()
  route=source.split('def vault_extract(',1)[1].split("@app.route(route='speech/token'",1)[0]
  self.assertIn('owned_storage_path(user_id,row.get(',route)
  self.assertIn('owner_document_filters(user_id,doc_id)',route)

 def test_vault_route_is_fail_closed_for_quotas(self):
  # Source guard; hosted rate-limit/gateway enforcement needs staging tests.
  source=(R/'api/function_app.py').read_text()
  route=source.split("def vault_extract(",1)[1].split("@app.route(route='speech/token'",1)[0]
  self.assertIn("GALAXY_VAULT_GATEWAY_RATE_LIMIT",route)
  self.assertIn("owner_document_filters(user_id,doc_id)",route)
  self.assertIn("urlencode(filters)",route)
 def test_topic_allowlist(self):
  key='RAG / Document ingestion / Chunking'
  self.assertEqual(topic_key(key,{key}),key)
  with self.assertRaises(InputError):topic_key('forged-user-value',{key})
 def test_text_and_size(self):
  self.assertEqual(extract_text(b'\xef\xbb\xbfHello world\n','notes.md'),'Hello world')
  with self.assertRaises(InputError):extract_text(b'abc\x00def','notes.txt')
  with self.assertRaises(InputError):extract_text(b'x'*(MAX_BYTES+1),'notes.txt')
  with self.assertRaises(InputError):extract_text(b'hello','doc.pdf')
 def test_docx_parsing_and_zip_bomb_protection(self):
  data=io.BytesIO()
  with zipfile.ZipFile(data,'w') as z:
   z.writestr('[Content_Types].xml','<Types/>')
   z.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Our pipeline runs hourly</w:t></w:r></w:p></w:body></w:document>')
  self.assertIn('pipeline',extract_text(data.getvalue(),'example.docx'))
  data=io.BytesIO()
  with zipfile.ZipFile(data,'w',compression=zipfile.ZIP_DEFLATED) as z:
   z.writestr('[Content_Types].xml','<Types/>')
   z.writestr('word/document.xml', 'x'*(21*1024*1024))
  with self.assertRaisesRegex(InputError,'too large'):extract_text(data.getvalue(),'bomb.docx')
 def test_pdf_scanned_or_invalid_not_claimed_as_text(self):
  from pypdf import PdfWriter
  buf=io.BytesIO();writer=PdfWriter();writer.add_blank_page(width=612,height=792);writer.write(buf)
  with self.assertRaisesRegex(InputError,'No selectable text'):extract_text(buf.getvalue(),'scan.pdf')
 def test_model_review_validation(self):
  r={'accuracy':85,'clarity':91,'missing_concepts':[],'has_factual_errors':False,'feedback':'Good separation of topics','improved_answer':'The technical explanation is accurate','followup':'What about stale vectors?'}
  self.assertEqual(validate_review(r)['review_status'],'model_reviewed')
  with self.assertRaises(InputError):validate_review({**r,'accuracy':'100'})
  with self.assertRaises(InputError):validate_review({**r,'has_factual_errors':'false'})
  with self.assertRaises(InputError):validate_review({**r,'missing_concepts':['x']*20})
 def test_server_rubric_matches_curriculum(self):
  import json
  rubrics=json.loads((R/'api/rubrics.json').read_text())
  self.assertGreaterEqual(len(rubrics),158)
  catalog=json.loads((R/'data/curriculum.json').read_text())
  lesson_titles=json.loads((R/'data/lessons.json').read_text())
  expected={' / '.join((c['title'],g['title'],item['title'])) for c in catalog for g in c['groups'] for item in g['items'] if item['title'] in lesson_titles}
  self.assertEqual(set(rubrics), expected)

if __name__=='__main__':unittest.main()
