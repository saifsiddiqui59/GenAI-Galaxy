"""Real Chromium acceptance for compiled P15 3D preview, with no live Auth/Azure calls."""
import asyncio, functools, http.server, threading, math
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/"experience"/"dist"

async def inspect(browser,origin,viewport,reduced=False):
 page=await browser.new_page(viewport=viewport,locale="en-IN",reduced_motion="reduce" if reduced else "no-preference")
 errors=[];remote=[]
 page.on("pageerror",lambda error: errors.append(str(error)))
 page.on("request",lambda req: remote.append(req.url) if urlparse(req.url).netloc not in (urlparse(origin).netloc,"") else None)
 response=await page.goto(origin+"/index.html?demo=1",wait_until="networkidle",timeout=45000)
 assert response and response.status==200
 await page.locator(".guardian-sack").wait_for(timeout=20000)
 assert "SAMPLE MASTERED WORLDS" in await page.locator(".galaxy-mode-tag").inner_text()
 assert "3 mastered" in await page.locator(".guardian-sack").inner_text()
 # All seventeen canonical chapter buttons are keyboard-accessible even without WebGL.
 await page.get_by_role("button",name="Explore all 17 worlds").click()
 assert await page.locator(".galaxy-dock li").count()==17
 await page.get_by_role("button",name="Close world navigator").click()
 await page.locator(".guardian-sack").click()
 assert await page.locator("#guardian-sack-panel li").count()==3
 await page.get_by_role("button",name="Close satchel").click()
 # Verify the staged model is served locally rather than requested via runtime CDN.
 model=await page.request.get(origin+"/models/kaykit/Skeleton_Mage.glb")
 assert model.status==200 and len(await model.body())==4761048, "Expected verified CC0 KayKit Skeleton Mage GLB"
 await page.wait_for_function("""() => window.__galaxySkeletonDiagnostics?.meshes > 0 && window.__galaxySkeletonDiagnostics?.bones > 0""",timeout=15000)
 print("KAYKIT guardian diagnostics:",await page.evaluate("window.__galaxySkeletonDiagnostics"))

 # Capture actual render during entrance, pickup and final presentation.
 label="mobile" if viewport["width"]<600 else "reduced" if reduced else "desktop"
 await page.screenshot(path=str(ROOT/("preview-p19-"+label+"-entrance.png")),timeout=20000)
 if not reduced:
  await page.wait_for_function("""() => window.__galaxySkeletonDiagnostics?.currentPhase === 'collecting' && window.__galaxySkeletonDiagnostics?.currentClip === 'PickUp' && Number.isInteger(window.__galaxySkeletonDiagnostics?.currentPickupIndex) && window.__galaxySkeletonDiagnostics.currentPickupIndex >= 0""",timeout=9000)
  started=await page.evaluate("window.__galaxySkeletonDiagnostics.currentPickupIndex")
  print('P23 VERIFIED PER-WORLD KAYKIT PICKUP',started)
  await page.screenshot(path=str(ROOT/("preview-p19-"+label+"-pickup.png")),timeout=20000)
  await page.wait_for_function("""index => window.__galaxySkeletonDiagnostics?.currentPickupIndex !== index || window.__galaxySkeletonDiagnostics?.currentPhase === 'offering'""",arg=started,timeout=9000)
 await page.wait_for_timeout(5100 if not reduced else 350)
 if not reduced:
  await page.locator(".guardian-skip").wait_for(state="hidden",timeout=20000)
 await page.screenshot(path=str(ROOT/("preview-p19-"+label+"-offer.png")),timeout=20000)
 diagnostics=await page.evaluate("window.__galaxySkeletonDiagnostics")
 assert diagnostics and diagnostics.get("rig",{}).get("detectedBones",0)>0
 assert diagnostics.get('asset','').startswith('KayKit')
 assert diagnostics.get('clips',0)>=2
 assert any(m.get('map') for m in diagnostics.get('materials',[])), 'Textured character should preserve original CC0 atlas'
 if diagnostics.get("rig",{}).get("canOffer"):
  assert isinstance(diagnostics.get("gripMidpoint"),list) and len(diagnostics["gripMidpoint"])==3
 if diagnostics.get("rig",{}).get("canCarry"):
  assert isinstance(diagnostics.get("waistPosition"),list) and len(diagnostics["waistPosition"])==3
 if not reduced:
  pose=await page.evaluate("window.__galaxySkeletonDiagnostics")
  print('P19 ACTUAL OFFERING IK:',pose.get('ikError'),pose.get('hasArmIK'))
  assert pose.get('hasArmIK') is True,'FBX real-arm CCD chain must exist'
  assert isinstance(pose.get('ikError'),(int,float)) and math.isfinite(pose['ikError']),'IK must execute against real wrist targets'
  assert pose['ikError']<.35,'Hand endpoint too far from offered planet target'
 await page.screenshot(path=str(ROOT/("preview-p15-"+("mobile" if viewport["width"]<600 else "reduced" if reduced else "desktop")+".png")),timeout=20000,animations="disabled")
 await page.locator(".guardian-accept").click()
 await page.locator(".galaxy-portal").wait_for(timeout=6000)
 await page.wait_for_url("**/*galaxyWorld=1*",timeout=12000)
 # Demo completed chapters 0/2/4; recommended world is chapter index 1.
 assert "galaxyWorld=1" in page.url, page.url
 assert not errors,errors
 assert not remote,"Unexpected third-party browser requests: "+str(remote)
 print("P15 WEBGL PREVIEW PASS",viewport,"reduced",reduced)
 await page.close()

async def main():
 assert (DIST/"index.html").is_file(),"Build experience/dist before running browser test"
 handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(DIST))
 server=http.server.ThreadingHTTPServer(("127.0.0.1",0),handler)
 thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
 origin="http://127.0.0.1:"+str(server.server_address[1])
 try:
  async with async_playwright() as playwright:
   browser=await playwright.chromium.launch(headless=True,args=[
     "--no-sandbox","--disable-dev-shm-usage","--enable-webgl",
     "--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
   try:
    await inspect(browser,origin,{"width":1440,"height":900})
    await inspect(browser,origin,{"width":390,"height":844})
    await inspect(browser,origin,{"width":1440,"height":900},reduced=True)
   finally: await browser.close()
 finally:server.shutdown();server.server_close()
if __name__=="__main__":asyncio.run(main())
