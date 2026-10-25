// Clip-independent cloth sway on the actual chest bone. Keep the shoulders
// anchored while the hem reacts to walking and settles at the final offer.
export function cloakSway(timeMs,rowFraction,columnFraction,moving=true){
 const t=Math.max(0,Number(timeMs)||0)*.001;
 const row=Math.min(1,Math.max(0,Number(rowFraction)||0));
 const col=Math.min(1,Math.max(0,Number(columnFraction)||0));
 const hem=row*row;
 const walk=moving?1:.32;
 return {
  x:hem*walk*.045*Math.sin(t*5.2+col*5.8),
  z:hem*walk*(.068*Math.sin(t*3.1+col*3.9)+.023*Math.sin(t*7.1-col*6.0))
 };
}
export function moveSkullMasterCloak(source,ms,walking=true){
 const cape=source.getObjectByName('SkullMasterCapeCloth');
 const base=cape?.userData?.restPositions,position=cape?.geometry?.attributes?.position;
 const columns=cape?.userData?.columns;
 if(!base||!position||!Number.isInteger(columns)||columns<2)return false;
 const rows=base.length/3/columns;
 for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){
  const k=(i*columns+j)*3;
  const offset=cloakSway(ms,i/(rows-1),j/(columns-1),walking);
  position.array[k]=base[k]+offset.x;
  position.array[k+1]=base[k+1];
  position.array[k+2]=base[k+2]+offset.z;
 }
 position.needsUpdate=true;
 cape.geometry.computeVertexNormals();
 return true;
}
