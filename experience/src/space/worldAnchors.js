// Hand-composed, non-spiral constellation. World indexes remain curriculum indexes.
// An organic, non-spiral atlas separates worlds without rigid rows or crowding
// a golden-angle spiral; this is presentation only (no progress/key changes).
export const ATLAS_ANCHORS=Object.freeze([
  [2.02, 1.55,-2.6,.34], [3.47, 1.93,-2.9,.37], [4.91, 1.47,-2.8,.30], [6.45, 1.82,-3.0,.40],
  [1.88,  .55,-2.8,.30], [3.29,  .75,-2.9,.32], [4.59,  .52,-2.8,.43], [5.84,  .91,-3.0,.30], [7.14,  .44,-3.1,.31],
  [2.21, -.63,-2.8,.34], [3.79, -.28,-2.8,.36], [5.02, -.48,-3.0,.40], [6.56, -.58,-2.9,.35],
  [1.83,-1.49,-2.9,.35], [3.25,-1.43,-2.8,.37], [4.61,-1.71,-3.0,.36], [6.05,-1.52,-3.0,.35],
]);
export function atlasLayout(count=17){
 const safe=Math.max(0,Math.min(17,Math.trunc(Number(count)||0)));
 return ATLAS_ANCHORS.slice(0,safe).map(([x,y,z,scale],index)=>({index,x,y,z,scale}));
}
