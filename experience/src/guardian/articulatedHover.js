/* Deterministic skeletal animation on the REAL KayKit rig: no floor-walk
 * clips, no leg-free spectral stump, and no character crouch at planet contact.
 * Small contralateral strides, knees and upper-body breathing remain visible.
 */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function articulatedHoverAt(ms,phase='arriving',reduced=false){
 const t=clamp(Number.isFinite(ms)?ms:0,0,150000);
 const active=reduced?0:(phase==='arriving'?1:phase==='collecting'?.68:phase==='offering'?.25:.35);
 const cycle=t*.0061, gait=Math.sin(cycle), breath=Math.sin(t*.0021);
 return {
  leftThigh:gait*.24*active,
  rightThigh:-gait*.24*active,
  leftKnee:Math.max(0,-gait)*.28*active,
  rightKnee:Math.max(0,gait)*.28*active,
  leftFoot:-gait*.12*active,
  rightFoot:gait*.12*active,
  pelvis:Math.sin(t*.0031)*.012*active,
  spine:breath*.035*active,
  chest:Math.sin(t*.0026+.6)*.022*active,
  // Arm IK and contact math use the unchanged world-space root position.
  // Small joint rotations never cause ground crouches or change orbit centres.
  active
 };
}
