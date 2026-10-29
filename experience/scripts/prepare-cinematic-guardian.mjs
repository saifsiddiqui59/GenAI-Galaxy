/* Generate a completely static companion for the user's Motion: off control.
 * SVG is original, packaged locally, with zero network calls or extra runtime JS.
 * Kept as a build-derived file so the artist source has one canonical revision.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../public/models');
const animated=readFileSync(resolve(root,'cinematic-skull-genie.svg'),'utf8');
if(!animated.includes('guardian-glowing-eyes') || !animated.includes('viewBox="0 0 480 430"'))
 throw Error('Unrecognized cinematic companion master SVG');
const still=animated.replace(/<style>[\s\S]*?<\/style>/,'');
if(still===animated || still.includes('@keyframes') || still.includes('<script'))
 throw Error('Static companion failed animation/security preflight');
writeFileSync(resolve(root,'cinematic-skull-genie-still.svg'),still);
console.log('Prepared offline static Skull Master for reduced motion');
