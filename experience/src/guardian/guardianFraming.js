// Keep the walking Skull Master and its observatory on a shared responsive
// stage scale. Desktop receives more visual presence; compact/tall-phone
// staging remains unchanged to protect 17 world labels and the mobile CTA.
export function guardianStageScale(compact=false,short=false){
 // Real screenshot QA: improve actor leg/face readability at 360/390px
 // without re-framing the 17-world galaxy, fixed camera, or lesson dock.
 return compact?(short?.75:.85):1.38;
}
export function guardianFloorY(compact=false,short=false){
 return compact?(short?-.95:-1.58):-2.25;
}
