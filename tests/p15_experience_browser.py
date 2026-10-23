"""Real Chromium acceptance for compiled P15 3D preview, with no live Auth/Azure calls."""
import asyncio, functools, http.server, threading
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
 assert await page.locator("#galaxy-world-menu li").count()==17
 await page.get_by_role("button",name="Close worlds").click()
 await page.locator(".guardian-sack").click()
 assert await page.locator("#guardian-sack-panel li").count()==3
 await page.get_by_role("button",name="Close satchel").click()
 # Verify the staged model is served locally rather than requested via runtime CDN.
 model=await page.request.get(origin+"/models/guardian.glb")
 assert model.status==200 and len(await model.body())==463988
 await page.screenshot(path=str(ROOT/("preview-p15-"+("mobile" if viewport["width"]<600 else "reduced" if reduced else "desktop")+".png")),timeout=20000,animations="disabled")
 await page.locator(".guardian-accept").click()
 await page.locator(".galaxy-portal").wait_for(timeout=6000)
 await page.wait_for_url("**/*galaxyWorld=1*",timeout=12000) if False else await page.wait_for_url("**/*galaxyWorld=1*",timeout=12000)
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
