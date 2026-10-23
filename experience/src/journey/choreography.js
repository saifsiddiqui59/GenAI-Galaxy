// One shared simulation clock: body, original clip, palm contact and prop release.
export const COLLECT_START_MS=2200;
export const PER_WORLD_MS=2600;
export const OFFER_SETTLE_MS=650;
export const CONTACT=.30;
export const RELEASE=.84;
export const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
export const smoother=t=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10)};
export function pickupAt(ms,order){
 const t=(ms-COLLECT_START_MS-order*PER_WORLD_MS)/PER_WORLD_MS;
 const stage=t<0?'waiting':t<CONTACT?'reach':t<.49?'lift':t<.68?'carry':t<RELEASE?'deposit':t<1?'release':'stored';
 return {t,stage,attached:t>=CONTACT&&t<RELEASE,stored:t>=1};
}
export function entranceAt(ms,compact=false){
 const end=compact?-.48:-2.05,start=end-(compact?1.35:2.05);
 const travel=smoother(ms/1800);
 return {x:start+(end-start)*travel,yaw:Math.PI/2*(1-smoother((ms-1350)/850)),
   walkWeight:1-smooth((ms-1550)/650)};
}
export function finiteCount(n){return Math.max(0,Math.min(17,Math.floor(Number(n)||0)))};
