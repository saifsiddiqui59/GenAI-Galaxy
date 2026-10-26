"""Read-only research of a candidate CC0 anatomical GLB, never app runtime.
Only downloads from an explicitly allowlisted source, time/size bounded. The
result is a CI artifact for deciding whether rig retargeting is feasible.
This is NOT yet a validated or adopted visual asset.
"""
from pathlib import Path
from urllib.request import Request,urlopen
import json,struct,hashlib

URL='https://www.innerscene.com/api/library/human-skeleton-simplified-anatomical-study-a93f4d8f/download'
SOURCE='https://www.innerscene.com/tools/library/3d-parts/human-skeleton-simplified-anatomical-study-a93f4d8f'
OUT=Path('artifacts/v6-cc0-anatomy-research')
MAX_BYTES=8_000_000

def inspect_glb(raw):
    if len(raw)<24 or raw[:4]!=b'glTF':
        raise ValueError('Not a valid GLB')
    _,version,length=struct.unpack_from('<4sII',raw,0)
    if version!=2 or length!=len(raw):
        raise ValueError('Bad glTF version / declared length')
    cursor=12
    manifest=None
    while cursor+8<=len(raw):
        chunk_size,kind=struct.unpack_from('<II',raw,cursor)
        cursor+=8
        if chunk_size>MAX_BYTES or cursor+chunk_size>len(raw):
            raise ValueError('Invalid GLB chunk')
        if kind==0x4e4f534a:
            manifest=json.loads(raw[cursor:cursor+chunk_size])
            break
        cursor+=chunk_size
    if not isinstance(manifest,dict):
        raise ValueError('Missing JSON glTF chunk')
    names=[n.get('name','') for n in manifest.get('nodes',[])]
    return {'nodes':len(names),'meshes':len(manifest.get('meshes',[])),
            'skins':len(manifest.get('skins',[])),
            'animations':len(manifest.get('animations',[])),
            'node_names':names[:400],
            'materials':[m.get('name','') for m in manifest.get('materials',[])]}

def main():
    req=Request(URL,headers={'User-Agent':'GenAI-Galaxy-DEV-CC0-Asset-Review/1.0'})
    with urlopen(req,timeout=22) as response:
        raw=response.read(MAX_BYTES+1)
    if not raw or len(raw)>MAX_BYTES:
        raise ValueError('Exceeded 8 MB read-only research cap')
    info=inspect_glb(raw)
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'human-skeleton.glb').write_bytes(raw)
    meta={'source_page':SOURCE,'original_download':URL,
          'license_claim':'CC0 1.0 per Innerscene asset page; validate provenance before bundling',
          'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'glb':info,
          'status':'research only; no animation/rigging/deployment approval'}
    (OUT/'manifest.json').write_text(json.dumps(meta,indent=2))
    print(json.dumps({k:v for k,v in meta.items() if k!='glb'}))
    print('Mesh/node sample:',info['node_names'][:75])
    print('GLB skins',info['skins'],'animations',info['animations'])
if __name__=='__main__':
    main()
