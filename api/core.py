"""Pure, testable safety/validation helpers for GenAI Galaxy Azure Functions.

No credentials or storage access here. Treat uploaded documents and model output as untrusted.
"""
from __future__ import annotations
from io import BytesIO
import json
import re
import uuid
from zipfile import ZipFile, BadZipFile
from xml.etree import ElementTree

MAX_BYTES = 8 * 1024 * 1024
MAX_TEXT = 60_000
MAX_PAGES = 75
MAX_UNCOMPRESSED_ZIP = 20 * 1024 * 1024
TOPIC_KEY_LIMIT = 300

class InputError(ValueError):
    pass


def bearer_token(value: str | None) -> str:
    if not value or not re.fullmatch(r'Bearer\s+[A-Za-z0-9._~+/-]+', value):
        raise InputError('Bearer authentication required')
    return value.split(maxsplit=1)[1]


def _raise_invalid_uuid():
    raise InputError('Invalid document ID')

def document_id(value: object) -> str:
    try:
        return str(uuid.UUID(str(value))) if uuid.UUID(str(value)).version == 4 else _raise_invalid_uuid()
    except (ValueError, TypeError, AttributeError):
        raise InputError('Invalid document ID') from None


def topic_key(value: object, valid_keys: set[str]) -> str:
    if not isinstance(value, str) or not 1 <= len(value) <= TOPIC_KEY_LIMIT or value not in valid_keys:
        raise InputError('Topic not in reviewed curriculum')
    return value


def extract_text(data: bytes, filename: str) -> str:
    if not isinstance(data, bytes) or len(data) > MAX_BYTES or not data:
        raise InputError('Document is empty or larger than 8 MiB')
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext not in {'pdf','docx','txt','md'}:
        raise InputError('Unsupported document type')
    if ext == 'pdf':
        if not data.startswith(b'%PDF-'):
            raise InputError('PDF signature does not match filename')
        try:
            from pypdf import PdfReader
            pdf = PdfReader(BytesIO(data), strict=True)
            if pdf.is_encrypted:
                raise InputError('Encrypted PDF requires manual review')
            if len(pdf.pages) > MAX_PAGES:
                raise InputError('PDF exceeds 75-page parsing limit')
            pieces=[]
            for page in pdf.pages:
                pieces.append((page.extract_text() or '').strip())
                if sum(len(p) for p in pieces) >= MAX_TEXT:
                    break
            text='\n\n'.join(p for p in pieces if p)
        except InputError:
            raise
        except Exception:
            raise InputError('PDF could not be safely parsed') from None
    elif ext == 'docx':
        if not data.startswith(b'PK\x03\x04'):
            raise InputError('DOCX ZIP signature does not match filename')
        try:
            with ZipFile(BytesIO(data)) as archive:
                files=archive.infolist()
                if len(files)>300 or sum(item.file_size for item in files)>MAX_UNCOMPRESSED_ZIP:
                    raise InputError('DOCX expanded content is too large')
                if any(item.flag_bits & 1 for item in files):
                    raise InputError('Encrypted DOCX is not supported')
                names={item.filename for item in files}
                if '[Content_Types].xml' not in names or 'word/document.xml' not in names:
                    raise InputError('Invalid DOCX document structure')
                if any('vbaProject.bin' in name for name in names):
                    raise InputError('Macro-enabled documents are not supported')
                root=ElementTree.fromstring(archive.read('word/document.xml'))
                ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                text='\n'.join(''.join(n.text or '' for n in para.findall('.//w:t', ns))
                               for para in root.findall('.//w:p',ns))
        except InputError:
            raise
        except (BadZipFile,KeyError,ElementTree.ParseError,RuntimeError,ValueError):
            raise InputError('DOCX could not be safely parsed') from None
    else:
        if b'\x00' in data:
            raise InputError('Text contains unexpected binary content')
        try:
            text=data.decode('utf-8-sig', errors='strict')
        except UnicodeError:
            raise InputError('Text document must use UTF-8 encoding') from None
    result=text.strip()[:MAX_TEXT]
    if not result:
        raise InputError('No selectable text found; scanned files need separate OCR')
    return result


def validate_review(response: dict) -> dict:
    """Accept a bounded, explicit schema; never trust a generative model to grade itself."""
    if not isinstance(response, dict):
        raise InputError('Invalid review result')
    try:
        accuracy=response['accuracy']
        clarity=response['clarity']
        missing=response['missing_concepts']
        factual=response['has_factual_errors']
        feedback=response['feedback']
        improved=response['improved_answer']
        followup=response['followup']
        if any(isinstance(n,bool) or not isinstance(n,(int,float)) or not 0<=n<=100 for n in (accuracy,clarity)):
            raise ValueError()
        if not isinstance(factual,bool) or not isinstance(missing,list) or len(missing)>8:
            raise ValueError()
        if any(not isinstance(x,str) or len(x)>180 for x in missing):
            raise ValueError()
        if any(not isinstance(x,str) or not x.strip() or len(x)>2500 for x in (feedback,improved,followup)):
            raise ValueError()
    except (KeyError,TypeError,ValueError):
        raise InputError('Incomplete model evaluation output') from None
    return {'review_status':'model_reviewed', 'accuracy':round(accuracy), 'clarity':round(clarity),
            'missing_concepts':missing, 'has_factual_errors':factual,
            'feedback':feedback[:1400],'improved_answer':improved[:2000], 'followup':followup[:400],
            'rubric_version':'v4-m2'}
