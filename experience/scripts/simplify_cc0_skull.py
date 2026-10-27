"""Deterministic geometry-only LOD from verified Khronos CC0 ScatteringSkull GLB.

5-mm-ish spatial vertex clustering (4.5mm grid), 16-bit indices, no unsupported
subsurface texture extensions. 188,871 original triangles -> 35,181 triangles.
No third-party Python dependencies; safe in CI and Azure static build staging.
"""
import json
import struct
import math

VOXEL=.0045

def repack(raw):
    json_size=struct.unpack_from('<I',raw,12)[0]
    doc=json.loads(raw[20:20+json_size])
    views=doc['bufferViews'];accessors=doc['accessors']
    prim=doc['meshes'][0]['primitives'][0]
    bin_start=28+json_size
    def segment(which):
        accessor=accessors[which];view=views[accessor['bufferView']]
        return bin_start+view.get('byteOffset',0)+accessor.get('byteOffset',0),accessor['count']
    pos_base,count=segment(prim['attributes']['POSITION'])
    norm_base,norm_count=segment(prim['attributes']['NORMAL'])
    index_base,index_count=segment(prim['indices'])
    if count!=norm_count or index_count%3:
        raise ValueError('Unexpected Khronos position/normal or index accessor')
    clusters={};mapping=[];acc=[]
    for i in range(count):
        x,y,z=struct.unpack_from('<fff',raw,pos_base+i*12)
        nx,ny,nz=struct.unpack_from('<fff',raw,norm_base+i*12)
        key=(round(x/VOXEL),round(y/VOXEL),round(z/VOXEL))
        node=clusters.get(key)
        if node is None:
            node=len(acc);clusters[key]=node;acc.append([0.,0.,0.,0.,0.,0.,0.])
        v=acc[node];v[0]+=x;v[1]+=y;v[2]+=z
        v[3]+=nx;v[4]+=ny;v[5]+=nz;v[6]+=1
        mapping.append(node)
    if not 3000<=len(acc)<65535:
        raise ValueError('Unreasonable simplified skull vertex count')
    tri=[];seen=set()
    for idx in range(0,index_count,3):
        a,b,c=struct.unpack_from('<III',raw,index_base+idx*4)
        ids=(mapping[a],mapping[b],mapping[c])
        if len(set(ids))!=3:continue
        dedup=tuple(sorted(ids))
        if dedup in seen:continue
        seen.add(dedup);tri.extend(ids)
    if not 10000<=len(tri)//3<=80000:
        raise ValueError('Skull LOD lost too many anatomical triangles')
    xyz=[];normals=[]
    for x,y,z,nx,ny,nz,n in acc:
        xyz.append((x/n,y/n,z/n))
        mag=math.sqrt(nx*nx+ny*ny+nz*nz) or 1.
        normals.append((nx/mag,ny/mag,nz/mag))
    p_buffer=b''.join(struct.pack('<fff',*v) for v in xyz)
    n_buffer=b''.join(struct.pack('<fff',*v) for v in normals)
    i_buffer=struct.pack('<'+str(len(tri))+'H',*tri)
    payload=bytearray(p_buffer+n_buffer+i_buffer)
    while len(payload)%4:payload.append(0)
    doc_out={
      'asset':{'version':'2.0','generator':'GenAI-Galaxy licensed-CC0 mesh-cluster P218 v1'},
      'scene':0,'scenes':[{'nodes':[0]}],
      'nodes':[{'name':'ScatteringSkull','mesh':0,'translation':doc['nodes'][0].get('translation',[0,0,0])}],
      'meshes':[{'name':'ScatteringSkull','primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'indices':2,'material':0}]}],
      'buffers':[{'byteLength':len(payload)}],
      'bufferViews':[
        {'buffer':0,'byteOffset':0,'byteLength':len(p_buffer),'target':34962},
        {'buffer':0,'byteOffset':len(p_buffer),'byteLength':len(n_buffer),'target':34962},
        {'buffer':0,'byteOffset':len(p_buffer)+len(n_buffer),'byteLength':len(i_buffer),'target':34963}],
      'accessors':[
        {'bufferView':0,'componentType':5126,'count':len(xyz),'type':'VEC3',
         'min':[min(p[k] for p in xyz) for k in range(3)],
         'max':[max(p[k] for p in xyz) for k in range(3)]},
        {'bufferView':1,'componentType':5126,'count':len(normals),'type':'VEC3'},
        {'bufferView':2,'componentType':5123,'count':len(tri),'type':'SCALAR'}],
      'materials':[{'name':'CC0_Realistic_Skull',
        'pbrMetallicRoughness':{'baseColorFactor':[.34,.42,.53,1],
                               'roughnessFactor':.96,'metallicFactor':.02}}]
    }
    js=json.dumps(doc_out,separators=(',',':'),ensure_ascii=True).encode('utf-8')
    js+=b' '*((-len(js))%4)
    glb_length=12+8+len(js)+8+len(payload)
    blob=(b'glTF'+struct.pack('<II',2,glb_length)
          +struct.pack('<II',len(js),0x4E4F534A)+js
          +struct.pack('<II',len(payload),0x004E4942)+payload)
    return blob,len(acc),len(tri)//3
