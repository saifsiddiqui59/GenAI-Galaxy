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
import time
from pathlib import Path
from urllib.request import Request,urlopen

SOURCE="https://www.innerscene.com/api/library/human-skeleton-simplified-anatomical-study-a93f4d8f/download"
LICENSE_PAGE="https://www.innerscene.com/tools/library/3d-parts/human-skeleton-simplified-anatomical-study-a93f4d8f"
# Previously published exact approved bytes: V6.9 hosted SHA manifest records
# e52d1b... on this file. Read-only CDN recovery, never write to V6.9.
FALLBACK_SOURCE="https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-3d-v69/models/cc0/InnersceneAnatomicalSkeleton.glb"
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
        verify(raw)
    else:
        errors=[]
        for url in (SOURCE,FALLBACK_SOURCE):
            for attempt in range(3):
                try:
                    req=Request(url,headers={'User-Agent':'GenAI-Galaxy-V6-CC0-Anatomy/1.0'})
                    with urlopen(req,timeout=35) as response:
                        raw=response.read(EXPECTED_BYTES+1)
                    # SHA256, size, 322 meshes and original GLB topology
                    # must match before this cache/source is accepted.
                    verify(raw)
                except (OSError,ValueError) as exc:
                    errors.append(f"{type(exc).__name__}: {str(exc)[:110]}")
                    print(f"Approved anatomy fetch attempt {attempt+1} failed; retrying",flush=True)
                    time.sleep(1.2*(attempt+1))
                else:
                    print("Verified approved anatomy source:",
                          "published immutable copy" if url==FALLBACK_SOURCE else "origin")
                    break
            else:
                continue
            break
        else:
            raise RuntimeError("Approved anatomy unavailable / hash invalid; refusing to build. "+repr(errors[-3:]))
        DEST.parent.mkdir(parents=True,exist_ok=True)
        DEST.write_bytes(raw)
    verify(raw)
    print(f"Verified original CC0 skeleton: {EXPECTED_BYTES} B, 322 mesh nodes, {SHA256}")

if __name__=="__main__":
    main()
