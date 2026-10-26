#!/usr/bin/env python3
"""Bundle reviewed CC0 anatomy for V6 experimental render, optionally.
The default build stays offline and uses its original anatomical fallback.
No runtime hotlink or service charges. Build flag GALAXY_V6_ANATOMY=1
is only used by the isolated visual QA feature-branch CI / V6.2 release.
"""
import hashlib
import json
import os
import struct
from pathlib import Path
from urllib.request import Request,urlopen

SOURCE="https://www.innerscene.com/api/library/human-skeleton-simplified-anatomical-study-a93f4d8f/download"
LICENSE_PAGE="https://www.innerscene.com/tools/library/3d-parts/human-skeleton-simplified-anatomical-study-a93f4d8f"
SHA256="e52d1b23cf15b574885846a7da30354defc0a3a51b679ded6cbc7c0c1965d996"
EXPECTED_BYTES=1443132
DEST=Path(__file__).resolve().parents[1]/"public/models/cc0/InnersceneAnatomicalSkeleton.glb"

def verify(raw):
    if len(raw)!=EXPECTED_BYTES or hashlib.sha256(raw).hexdigest()!=SHA256:
        raise ValueError("Unapproved anatomical GLB bytes; fail closed")
    if raw[:4]!=b"glTF" or struct.unpack_from("<II",raw,4)[0]!=2 or struct.unpack_from("<I",raw,8)[0]!=len(raw):
        raise ValueError("Invalid GLB")
    length,tag=struct.unpack_from("<II",raw,12)
    if tag!=0x4e4f534a or length>300000:
        raise ValueError("Missing or oversized GLB JSON")
    obj=json.loads(raw[20:20+length])
    if len(obj.get('nodes',[]))!=322 or len(obj.get('meshes',[]))!=322 or obj.get('skins') or obj.get('animations'):
        raise ValueError("Anatomical topology no longer matches vetted research")
    return obj

def main():
    if os.environ.get("GALAXY_V6_ANATOMY")!="1":
        print("No V6 experimental anatomy requested; standard offline rig preserved")
        return
    if DEST.exists():
        raw=DEST.read_bytes()
    else:
        req=Request(SOURCE,headers={'User-Agent':'GenAI-Galaxy-V6-CC0-Anatomy/1.0'})
        with urlopen(req,timeout=35) as res:
            if res.headers.get("Content-Length") and int(res.headers['Content-Length'])>EXPECTED_BYTES:
                raise ValueError("Unexpected asset size")
            raw=res.read(EXPECTED_BYTES+1)
    verify(raw)
    DEST.parent.mkdir(parents=True,exist_ok=True)
    if not DEST.exists():DEST.write_bytes(raw)
    print(f"Verified original CC0 skeleton: {EXPECTED_BYTES} B, 322 mesh nodes, {SHA256}")

if __name__=="__main__":main()
