// Keep the cinematic clock tied to elapsed real time, not rendered-frame count.
// The older 65ms/frame cap made low-FPS phones/SwiftShader take 3-5x as long.
export function advanceTimelineMs(ms,deltaSeconds,ready=true,active=true,hold=false){
 const now=Number.isFinite(ms)?ms:0;
 if(!ready||!active||hold)return now;
 if(!Number.isFinite(deltaSeconds)||deltaSeconds<=0)return now;
 // Clamp only severe pauses (background tab/context loss), not ordinary slow
 // frames. This preserves 12s scene timing on GPUs at 3fps or 60fps.
 return now+Math.min(deltaSeconds,.75)*1000;
}
