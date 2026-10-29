/* Foot placement is locked to DISTANCE along the true orbital route.
 * A 4.8s "Walking" playback independent of path distance caused skating;
 * the step cycle now completes every real 1.08 scene units travelled.
 */
export const STRIDE_DISTANCE=1.08;
const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
export function groundedStrideAt(distance=0,speed=0,reduced=false){
 const d=Number.isFinite(distance)?Math.max(0,distance):0;
 const v=Number.isFinite(speed)?Math.max(0,speed):0;
 const active=reduced?0:clamp(v/1.30);
 const phase=2*Math.PI*d/STRIDE_DISTANCE;
 const l=Math.sin(phase),r=-l;
 const leftLift=Math.max(0,l),rightLift=Math.max(0,r);
 const bob=active*(.036+.039*Math.cos(2*phase));
 return {
  phase,active,stepDistance:d,speed:v,stanceFoot:l<0?'left':'right',
  leftThigh:l*.39*active,rightThigh:r*.39*active,
  leftKnee:leftLift*.49*active,rightKnee:rightLift*.49*active,
  leftFoot:(-l*.17-leftLift*.18)*active,
  rightFoot:(-r*.17-rightLift*.18)*active,
  pelvis:Math.sin(phase)*.036*active,
  pelvisBob:bob,
  spine:-Math.sin(phase)*.030*active,
  chest:Math.sin(phase+.6)*.026*active,
  leftPlant:active*(1-leftLift),
  rightPlant:active*(1-rightLift)
 };
}
