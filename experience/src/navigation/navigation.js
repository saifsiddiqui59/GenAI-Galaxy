/* One authoritative, origin-safe learning-world route resolver.
 * The 3D preview can live at /previews/.../ while the learning app stays at /index.html.
 * Never put Auth tokens, progress or full lesson objects into URLs.
 */
export const WORLD_COUNT=17;
export function validWorld(index){
 return Number.isInteger(index)&&index>=0&&index<WORLD_COUNT;
}
export function lessonHref(index,origin){
 if(!validWorld(index))throw Error('Invalid 3D learning-world selection');
 const base=new URL(origin);
 if(!['https:','http:'].includes(base.protocol))throw Error('Invalid lesson host protocol');
 const target=new URL('/index.html',base.origin);
 target.searchParams.set('galaxyWorld',String(index));
 return target.href;
}
export function powerBudget(){
 const noMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
 const saveData=globalThis.navigator?.connection?.saveData===true;
 const memory=globalThis.navigator?.deviceMemory;
 const lowMemory=typeof memory==='number'&&memory<4;
 return {noMotion,saveData,lowMemory,lowPower:noMotion||saveData||lowMemory};
}
