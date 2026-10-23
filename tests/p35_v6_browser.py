"""Real rendered V6 acceptance. Demo-only seek never changes authenticated progress.

GALAXY_V6_URL selects hosted read-only acceptance; otherwise serve staged local files.
Screenshots and numeric diagnostics are evidence, not a substitute for opening images.
"""
import asyncio,functools,http.server,json,math,os,threading
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('GALAXY_V6_ARTIFACTS',ROOT/'artifacts/p35-v6'))
OUT.mkdir(parents=True,exist_ok=True)

async def inspect(pw,url,name,width,height,reduced=False):
    binary=os.environ.get('GALAXY_CHROMIUM_BINARY')
    args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
    if binary:args+=['--no-zygote','--single-process']
    browser=await pw.chromium.launch(headless=True,args=args,**({'executable_path':binary} if binary else {}))
    page=await browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce' if reduced else 'no-preference')
    errors=[];requests=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('request',lambda req:requests.append(req.url))
    try:
        response=await page.goto(url,wait_until='networkidle',timeout=60000)
        assert response.status==200,response.status
        await page.wait_for_function('() => window.__galaxySkeletonDiagnostics?.bones >= 40',timeout=45000)
        await page.wait_for_function('() => window.__galaxyV6 != null',timeout=10000)
        assert '3 SAMPLE MASTERED WORLDS' in await page.locator('.galaxy-mode-tag').inner_text()
        if name=='desktop' and not reduced:
            await page.wait_for_function("() => window.__galaxySkeletonDiagnostics.currentPhase==='offering' && window.__galaxySkeletonDiagnostics.pickupLog.length===3",timeout=60000)
            print('Natural timeline: three original PickUp cycles completed without seeking')
            await page.evaluate('window.__galaxyV6.reset()')
        snapshots=[]
        async def capture(stage,ms):
            if not reduced:
                await page.evaluate('(ms)=>window.__galaxyV6.seek(ms)',ms)
                await page.wait_for_function('(ms)=>Math.abs(window.__galaxySkeletonDiagnostics.time-ms)<1',arg=ms)
            await page.wait_for_timeout(180)
            file=OUT/f'{name}-{stage}.png'
            await page.screenshot(path=str(file),full_page=True,timeout=30000)
            diag=await page.evaluate('window.__galaxySkeletonDiagnostics')
            snapshots.append({'stage':stage,'time':diag['time'],'ikError':diag.get('ikError'),'pickupTargetError':diag.get('pickupTargetError'),'miniatures':diag.get('miniatures',{})})
            print(name,stage,'IK',diag.get('ikError'))
            return diag
        if not reduced:
            await capture('entrance',950)
            pickup=await capture('pickup',2200+2600*.38)
            assert pickup['miniatures']['0']['attached']
            assert pickup['miniatures']['0']['contactError']<.001
            assert pickup['pickupTargetError']<.04,pickup['pickupTargetError']
            deposit=await capture('deposit',2200+2600*.79)
            assert deposit['miniatures']['0']['stage']=='deposit'
            # All three independent real source clip cycles must be observed.
            for order in [1,2]:
                ms=2200+(order+.38)*2600
                await page.evaluate('(ms)=>window.__galaxyV6.seek(ms)',ms)
                await page.wait_for_function('(ms)=>Math.abs(window.__galaxySkeletonDiagnostics.time-ms)<1',arg=ms)
        diag=await capture('offering',11200)
        assert diag['clips']==95 and diag['bones']==41,diag
        assert diag['hasArmIK'] and math.isfinite(diag['ikError']) and diag['ikError']<.18,diag.get('ikError')
        assert all(not m['visible'] for m in diag.get('miniatures',{}).values()),'Stored planets must be inside the bag'
        if not reduced:
            assert [p['index'] for p in diag['pickupLog']][-3:]==[0,1,2],diag['pickupLog']
        assert any(m['map'] for m in diag['materials'])
        await page.get_by_role('button',name='Explore all 17 worlds').click()
        assert await page.locator('.galaxy-dock li').count()==17
        await page.get_by_role('button',name='Close world navigator').click()
        await page.locator('.guardian-sack').click()
        assert await page.locator('#guardian-sack-panel li').count()==3
        await page.get_by_role('button',name='Close satchel').click()
        rects=await page.evaluate('''() => Object.fromEntries(['.guardian-journey-top','.guardian-next','.galaxy-view-actions','.guardian-mission'].map(s=>{let r=document.querySelector(s).getBoundingClientRect();return [s,{x:r.x,y:r.y,w:r.width,h:r.height}]}))''')
        for key,r in rects.items():
            assert r['x']>=0 and r['x']+r['w']<=width+1,(name,key,r)
            assert r['y']>=0 and r['y']+r['h']<=max(height,740)+1,(name,key,r)
        def intersects(a,b):return a['x']<b['x']+b['w'] and b['x']<a['x']+a['w'] and a['y']<b['y']+b['h'] and b['y']<a['y']+a['h']
        assert not intersects(rects['.guardian-next'],rects['.galaxy-view-actions'])
        if width<700:
            assert diag['screenBody']['bottom']<rects['.guardian-next']['y']-4,(diag['screenBody'],rects)
            assert diag['screenBody']['top']>rects['.guardian-journey-top']['y']+rects['.guardian-journey-top']['h'],(diag['screenBody'],rects)
        if not reduced:
            await page.get_by_role('button',name='Motion: on',exact=True).click()
            await page.wait_for_timeout(250)
            before=await page.evaluate('window.__galaxyV6.frames')
            await page.wait_for_timeout(500)
            after=await page.evaluate('window.__galaxyV6.frames')
            assert after-before<=2,('Motion-off should leave GPU idle',before,after)
            await page.get_by_role('button',name='Motion: off',exact=True).click()
        await page.locator('.guardian-accept').click()
        await page.wait_for_url('**/lesson/index.html?galaxyWorld=1',timeout=20000)
        await page.wait_for_function('() => window.GenAIGalaxyTest != null',timeout=15000)
        assert await page.locator('body').inner_text() # Verify actual lesson document loads.
        assert not errors,errors
        assert not any('/rest/v1/' in r or '/auth/v1/' in r or '/api/practice/' in r for r in requests),requests
        result={'viewport':[width,height],'reduced':reduced,'screenshots':snapshots,'rectangles':rects,'lessonUrl':page.url,'errors':errors}
        (OUT/f'{name}-evidence.json').write_text(json.dumps(result,indent=2))
        print(name,'V6 BROWSER PASS',result['viewport'])
    finally:await browser.close()

async def main():
    url=os.environ.get('GALAXY_V6_URL');server=None
    if not url:
        stage=Path(os.environ.get('GALAXY_V6_STAGE',ROOT/'artifacts/p35-stage'))
        assert (stage/'previews/galaxy-3d-v6/index.html').is_file(),'Stage the compiled preview first'
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(stage)))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        url=f'http://127.0.0.1:{server.server_address[1]}/previews/galaxy-3d-v6/index.html?demo=1'
    try:
        async with async_playwright() as pw:
            for args in [('desktop',1440,900,False),('mobile',390,844,False),('reduced',1440,900,True),('mobile-small',360,740,False)]:
                await inspect(pw,url,*args)
    finally:
        if server:server.shutdown();server.server_close()
if __name__=='__main__':asyncio.run(main())
