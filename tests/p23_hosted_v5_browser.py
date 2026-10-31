"""Read-only Chromium acceptance against the VERIFIED hosted V5 3D preview.

This deliberately does not use a Supabase account or mutate user progress.
Run from GitHub Actions where public Azure Static Website DNS is available.
"""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

URL="https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-3d-v5/index.html?demo=1"
ASSET="https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-3d-v5/models/kaykit/Skeleton_Mage.glb"
OUT=Path("artifacts/p23-hosted-v5")
OUT.mkdir(parents=True,exist_ok=True)

async def visit(browser, name, viewport, reduced=False):
    page=await browser.new_page(viewport=viewport,
        reduced_motion="reduce" if reduced else "no-preference",locale="en-IN")
    errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    response=await page.goto(URL,wait_until="domcontentloaded",timeout=45000)
    assert response and response.status==200,(name,response and response.status)
    await page.get_by_role("button",name="Explore all 17 worlds").wait_for(timeout=25000)
    assert "3 SAMPLE MASTERED WORLDS" in await page.locator(".galaxy-mode-tag").inner_text()
    await page.get_by_role("button",name="Explore all 17 worlds").click()
    assert await page.locator(".galaxy-dock li").count()==17
    await page.get_by_role("button",name="Close world navigator").click()
    await page.locator(".guardian-sack").click()
    assert await page.locator("#guardian-sack-panel li").count()==3
    await page.get_by_role("button",name="Close satchel").click()
    await page.wait_for_function(
      "() => window.__galaxySkeletonDiagnostics?.bones >= 40",timeout=25000)
    model=await page.request.get(ASSET,timeout=25000)
    assert model.status==200 and len(await model.body())==4761048,("GLB integrity",model.status)
    diag=await page.evaluate("window.__galaxySkeletonDiagnostics")
    assert diag["asset"].startswith("KayKit") and diag["clips"]>=90
    assert diag["rig"]["canOffer"] and diag["rig"]["canCarry"]
    assert any(x.get("map") for x in diag["materials"])
    if not reduced:
      # GLB decoding may finish after the first natural entrance. Replay only
      # when the button exists, so 3 real PickUp transitions are observable.
      replay=page.get_by_role("button",name="Replay guardian entrance")
      await replay.wait_for(state="visible",timeout=25000)
      await replay.click()
      # Full 3 mastered world sequence: read-only, synthetic only.
      # Atomically snapshot the three observed pickups while waiting. The
      # hosted V5 demo can reset its playback epoch between a successful
      # wait_for_function and a separate evaluate(), yielding an empty log.
      # A captured JS handle preserves the real observed events without
      # fabricating or retrying a missing physical pickup.
      evidence=await page.wait_for_function("""() => {
        const log=window.__galaxySkeletonDiagnostics?.pickupLog || [];
        return log.length >= 3
          ? log.slice(0,3).map(x=>({index:x.index,clip:x.clip}))
          : false;
      }""",timeout=25000)
      log=await evidence.json_value()
      assert [x["index"] for x in log[:3]] == [0,1,2],log
      assert all(x["clip"]=="PickUp" for x in log[:3]),log
      await page.locator(".guardian-skip").wait_for(state="hidden",timeout=15000)
      diag=await page.evaluate("window.__galaxySkeletonDiagnostics")
      assert diag["hasArmIK"] is True,diag
      assert isinstance(diag["ikError"],(int,float)) and diag["ikError"]<.35,diag
    await page.screenshot(path=str(OUT/(name+"-offer.png")),
      full_page=True,animations="disabled",timeout=25000)
    await page.locator(".guardian-accept").click()
    await page.wait_for_url("**/lesson/index.html?galaxyWorld=1",timeout=20000)
    assert "galaxyWorld=1" in page.url,page.url
    assert not errors,errors
    print(name+" HOSTED PASS",{"clips":diag["clips"],"bones":diag["bones"],
      "lesson_url":page.url,"snapshot":str(OUT/(name+"-offer.png"))})
    await page.close()

async def main():
    async with async_playwright() as pw:
      browser=await pw.chromium.launch(headless=True,args=["--enable-webgl",
        "--use-gl=angle","--use-angle=swiftshader","--disable-dev-shm-usage"])
      try:
        for name,size,reduced in [
          ("desktop",{"width":1440,"height":900},False),
          ("mobile",{"width":390,"height":844},False),
          ("reduced",{"width":1440,"height":900},True)
        ]:
          await visit(browser,name,size,reduced)
      finally:
        await browser.close()
if __name__=="__main__":asyncio.run(main())
