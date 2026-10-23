#!/usr/bin/env python3
"""Download one upstream CC0 KayKit GLB from an immutable GitHub commit.
Fail closed on changes; never accept an HTML page or a git-lfs pointer.
"""
from pathlib import Path
import hashlib
import json
import struct
import urllib.request

COMMIT = "15b62b9bad122f72926c10fb14d622c73819fa54"
SOURCE = ("https://raw.githubusercontent.com/KayKit-Game-Assets/"
          f"KayKit-Character-Pack-Skeletons-1.0/{COMMIT}/"
          "addons/kaykit_character_pack_skeletons/Characters/gltf/Skeleton_Mage.glb")
GIT_BLOB_SHA = "5f85aea26b4f33b88080d6eb57d25d1ae5d84d14"
EXPECTED_BYTES = 4761048
DEST = Path(__file__).resolve().parents[1] / "public/models/kaykit/Skeleton_Mage.glb"

def verify(raw):
    if len(raw) != EXPECTED_BYTES:
        raise ValueError(f"KayKit model byte count mismatch: {len(raw)}")
    git_sha = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\\0" + raw).hexdigest()
    if git_sha != GIT_BLOB_SHA:
        raise ValueError("KayKit Git blob SHA mismatch — possible asset substitution")
    if raw[:4] != b"glTF" or struct.unpack_from("<I", raw, 4)[0] != 2:
        raise ValueError("Expected binary glTF 2")
    chunk_len, chunk_type = struct.unpack_from("<II", raw, 12)
    if chunk_type != 0x4E4F534A:
        raise ValueError("Missing glTF JSON chunk")
    manifest = json.loads(raw[20:20+chunk_len])
    animations = [a.get("name", "") for a in manifest.get("animations", [])]
    nodes = [n.get("name", "") for n in manifest.get("nodes", [])]
    if len(animations) < 2 or len(nodes) < 20:
        raise ValueError("KayKit model has too few animated nodes")
    print("KayKit Mage CC0 asset verified", len(raw),
          "SHA256", hashlib.sha256(raw).hexdigest())
    print("KAYKIT_ANIMATION_NAMES:", json.dumps(animations[:140]))
    print("KAYKIT_RIG_NODE_NAMES:", json.dumps(nodes[:140]))

if __name__ == "__main__":
    if DEST.exists():
        contents=DEST.read_bytes()
        verify(contents)
    else:
        req=urllib.request.Request(SOURCE,headers={"User-Agent":"GenAI-Galaxy-CC0-Asset-Verifier/1.0"})
        with urllib.request.urlopen(req,timeout=40) as response:
            contents=response.read(EXPECTED_BYTES+1)
        verify(contents)
        DEST.parent.mkdir(parents=True,exist_ok=True)
        DEST.write_bytes(contents)
