/* Keep HUD labels out of the guardian silhouette as planets orbit across camera space.
   This only hides decorative overlaid labels; worlds and WorldDock stay selectable. */
export function overlapsGuardian(x,y,width,height,compact){
 if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)return false;
 const u=x/width,v=y/height;
 // Dedicated character stage lies left of the atlas; protect face, hat/hood & hands.
 return compact?(u>=.08&&u<=.52&&v>=.32&&v<=.66):
                (u>=.23&&u<=.455&&v>=.34&&v<=.84);
}
