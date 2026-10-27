/* Fixed cinematic camera: entire galaxy stays visible through every grasp.
 * A zoom/chase used to crop the left-hand planets and make the collector's
 * vertical hover look like a downward floor pickup. The actor moves in world
 * space; the viewport does not chase it or cut the orbit off-screen.
 */
export function cameraTrackingAt(ms,position,activeIndex,completedCount,reducedMotion=false){
 return {x:0,y:.3,z:12.5};
}
