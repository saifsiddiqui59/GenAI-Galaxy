// One shared simulation clock: body, walking footsteps, palm contact and prop release.
// Walk time is intentionally longer (4.5 s per approach) so the character
// takes readable steps instead of sliding across the 17-world galaxy.
export const COLLECT_START_MS=2200;
export const PER_WORLD_MS=9000;
export const OFFER_SETTLE_MS=1700;
export const CONTACT=.50;
export const RELEASE=.84;
export const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
export const smoother=t=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10)};
export function pickupAt(ms,order){
 const t=(ms-COLLECT_START_MS-order*PER_WORLD_MS)/PER_WORLD_MS;
 const stage=t<0?'waiting':t<CONTACT?'approach':t<.62?'lift':t<RELEASE?'deposit':t<1?'release':'stored';
 return {t,stage,attached:t>=CONTACT&&t<RELEASE,stored:t>=1};
}
export function entranceAt(ms,compact=false){
 // Keep the hat inside the narrow viewport by the mid-entrance frame.
 // The full desktop walk-in is intentionally unchanged.
 const end=compact?-.48:-2.05,start=end-(compact?.85:2.05);
 const travel=smoother(ms/1800);
 return {x:start+(end-start)*travel,yaw:.55*(1-smoother((ms-1350)/850)),
   walkWeight:1-smooth((ms-1550)/650)};
}
export function finiteCount(n){return Math.max(0,Math.min(17,Math.floor(Number(n)||0)))};
