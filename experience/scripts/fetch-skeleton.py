#!/usr/bin/env python3
"""Fetch the REAL CC0 rigged Skeleton FBX from Quaternius' original 2018 pack.

Source: https://opengameart.org/content/lowpoly-animated-monsters
License: CC0; original zip is ~1.4MB. Fail-closed if skeleton is missing.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from io import BytesIO
from zipfile import ZipFile
import hashlib, json, re

URL="https://opengameart.org/sites/default/files/Animated%20Monster%20Pack%20by%20%40Quaternius.zip"
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/"public/models/skeleton"
MAX_BYTES=7_000_000

def main():
    req=Request(URL,headers={"User-Agent":"GenAI-Galaxy-P17-CC0-asset-fetch/1.0"})
    with urlopen(req,timeout=35) as response:
        data=response.read(MAX_BYTES+1)
    if len(data)>MAX_BYTES:raise RuntimeError("Unexpectedly large animation archive")
    with ZipFile(BytesIO(data)) as archive:
        names=[x for x in archive.namelist() if not x.endswith("/")]
        # Only skeleton files; no extraction of any unrelated monster assets.
        candidates=[x for x in names if re.search(r"skeleton",x,re.I)]
        fbx=[x for x in candidates if x.lower().endswith(".fbx")]
        if not fbx:raise RuntimeError("Skeleton FBX not present. Archive names: "+repr(names[:80]))
        # Prefer rigged/animated FBX over Obj, based on archive name.
        main_file=sorted(fbx,key=lambda x:(("animation" not in x.lower()) and ("rig" not in x.lower()),len(x)))[0]
        DEST.mkdir(parents=True,exist_ok=True)
        content=archive.read(main_file)
        if not content.startswith(b"Kaydara FBX Binary") and not content.lstrip().startswith(b"; FBX"):
            raise RuntimeError("Expected real FBX binary or ASCII format")
        (DEST/"Skeleton.fbx").write_bytes(content)
        # Textures referenced by relative paths can be included, no arbitrary paths.
        textures=[]
        for source in names:
            if source.lower().endswith((".png",".jpg",".jpeg",".tga")) and (
                "skeleton" in source.lower() or Path(source).parent==Path(main_file).parent
            ):
                b=archive.read(source)
                if len(b)>3_000_000:continue
                target=DEST/Path(source).name
                target.write_bytes(b)
                textures.append(target.name)
        manifest={"source":URL,"license":"CC0-1.0","archiveSha256":hashlib.sha256(data).hexdigest(),
                  "fbxArchivePath":main_file,"fbxSha256":hashlib.sha256(content).hexdigest(),
                  "fbxBytes":len(content),"textures":textures}
        (DEST/"provenance.json").write_text(json.dumps(manifest,indent=2))
        print("Real CC0 Skeleton FBX extracted:",main_file,"bytes:",len(content),"SHA256:",manifest["fbxSha256"])

if __name__=="__main__":main()
