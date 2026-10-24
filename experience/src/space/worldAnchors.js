// Hand-composed, non-spiral constellation. World indexes remain curriculum indexes.
// A staggered atlas makes adjacent worlds visually distinct instead of crowding
// a golden-angle spiral; this is presentation only (no progress/key changes).
export const ATLAS_ANCHORS=Object.freeze([
  [2.15, 1.65,-2.6,.31], [3.55, 1.65,-2.9,.37], [4.95, 1.65,-2.8,.32], [6.35, 1.65,-3.0,.37],
  [1.90,  .62,-2.8,.30], [3.18,  .62,-2.9,.35], [4.48,  .62,-2.8,.40], [5.78,  .62,-3.0,.32], [7.08,  .62,-3.1,.30],
  [2.25, -.42,-2.8,.33], [3.65, -.42,-2.8,.34], [5.05, -.42,-3.0,.39], [6.45, -.42,-2.9,.34],
  [1.90,-1.50,-2.9,.34], [3.30,-1.50,-2.8,.39], [4.70,-1.50,-3.0,.33], [6.10,-1.50,-3.0,.34],
]);
export function atlasLayout(count=17){
 const safe=Math.max(0,Math.min(17,Math.trunc(Number(count)||0)));
 return ATLAS_ANCHORS.slice(0,safe).map(([x,y,z,scale],index)=>({index,x,y,z,scale}));
}
