#!/usr/bin/env python3
"""Fetch a PINNED public-domain realistic skull GLB for the Skull Master rig.
Verified Khronos ScatteringSkull asset — CC0-1.0. Fail closed on byte changes.
Do not hotlink or dynamically download in production; bundle before Vite build.
"""
from pathlib import Path
import hashlib
import json
import struct
import urllib.request

REPO_SHA = "8f492390ddc7a2ae221a1369ef560589cf8c70fb"
GIT_BLOB_SHA = "9e1927babc5791067ccf2004bda7e59a40cac753"
EXPECTED_BYTES = 8959044
SOURCE = (
 "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/"
 f"{REPO_SHA}/Models/ScatteringSkull/glTF-Binary/ScatteringSkull.glb"
)
DEST = Path(__file__).resolve().parents[1] / "public/models/cc0/ScatteringSkull.glb"

def inspect(raw):
    if len(raw) != EXPECTED_BYTES:
        raise ValueError(f"ScatteringSkull expected {EXPECTED_BYTES} bytes, got {len(raw)}")
    actual = hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\x00"+raw).hexdigest()
    if actual != GIT_BLOB_SHA:
        raise ValueError(f"External CC0 model SHA mismatch: {actual}")
    if raw[:4] != b"glTF" or struct.unpack_from("<II", raw, 4)[0] != 2:
        raise ValueError("Not a valid GLB 2.0")
    if struct.unpack_from("<I",raw,8)[0] != len(raw):
        raise ValueError("Incorrect GLB container length")
    chunk_length, chunk_type=struct.unpack_from("<II",raw,12)
    if chunk_type != 0x4E4F534A:
        raise ValueError("First chunk is not JSON")
    scene=json.loads(raw[20:20+chunk_length])
    if not scene.get("meshes") or not scene.get("nodes"):
        raise ValueError("Missing real model geometry")
    # No installed plugins or scripts execute from this passive 3D binary.
    print("Verified CC0 Skull", json.dumps({
        "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest(),
        "meshes": len(scene["meshes"]), "nodes": len(scene["nodes"]),
        "accessors": len(scene.get("accessors", [])),
        "animations": len(scene.get("animations", [])),
        "extensionsRequired": scene.get("extensionsRequired",[]),
    }))
    return scene

if __name__=="__main__":
    if DEST.exists():
        raw=DEST.read_bytes()
    else:
        req=urllib.request.Request(SOURCE,headers={"User-Agent":"GenAI-Galaxy-CC0-Skull-Asset-Verifier/1.0"})
        with urllib.request.urlopen(req,timeout=60) as response:
            raw=response.read(EXPECTED_BYTES+1)
    inspect(raw)
    if not DEST.exists():
        DEST.parent.mkdir(parents=True,exist_ok=True)
        DEST.write_bytes(raw)
        print("Bundled",DEST)
