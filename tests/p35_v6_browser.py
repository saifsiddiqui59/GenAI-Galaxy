"""Real rendered V6 acceptance. Demo-only seek never changes authenticated progress.

GALAXY_V6_URL selects hosted read-only acceptance; otherwise serve staged local files.
Screenshots and numeric diagnostics are evidence, not a substitute for opening images.
"""
import asyncio,functools,http.server,json,math,os,threading
from pathlib import Path
from PIL import Image
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
        try:
            await page.wait_for_function('() => window.__galaxySkeletonDiagnostics?.bones >= 40',timeout=45000)
        except Exception:
            print('GUARDIAN STARTUP FAILURE:',json.dumps({
              'errors':errors[-12:],
              'recentRequests':requests[-20:],
              'body':(await page.locator('body').inner_text())[:900],
              'anatomyMode':os.environ.get('GALAXY_V6_ANATOMY'),
            }),flush=True)
            await page.screenshot(path=str(OUT/f'{name}-startup-failure.png'),full_page=True)
            raise
        await page.wait_for_function('() => window.__galaxyV6 != null',timeout=10000)
        assert '3 SAMPLE MASTERED WORLDS' in await page.locator('.galaxy-mode-tag').inner_text()
        if os.environ.get('GALAXY_GENIE_EXPECT')=='1':
            # Original Genie SVG is the visible companion; hidden KayKit bones
            # still drive proven planet-to-palm collection for this transition.
            await page.wait_for_function("""() => {
              const e=document.querySelector('.galaxy-original-genie');
              return !!e && +getComputedStyle(e).opacity > .9
                && e.querySelector('img')?.complete
                && e.querySelector('img')?.naturalWidth > 0;
            }""", timeout=20000)
            assert await page.locator('.galaxy-original-genie').count()==1
            assert await page.locator('#galaxy-boot').count()==0,'Loading must clear when rig is ready'
            assert 'Genie' in await page.locator('.galaxy-original-genie').get_attribute('aria-label')

        await page.wait_for_timeout(400)
        labels=await page.locator('[data-world-index]').evaluate_all('(nodes)=>nodes.map(n=>({index:n.dataset.worldIndex,name:n.title,text:n.textContent}))')
        print(name,'Visible atlas label nodes',len(labels),'worlds',[x['index'] for x in labels],flush=True)
        assert len(labels)>=12 and all(x['name'] and x['text'].strip() for x in labels),labels
        if width>=700:
            assert await page.locator('[data-world-label]').count()>=1,'Desktop must name the recommended world'
        else:
            assert await page.locator('[data-world-label]').count()==0,'Compact Galaxy must not obscure worlds with an oversized title'
        if name=='desktop' and not reduced:
            try:
                await page.wait_for_function("() => window.__galaxySkeletonDiagnostics.currentPhase==='offering' && window.__galaxySkeletonDiagnostics.pickupLog.length===3",timeout=65000)
            except Exception:
                diag=await page.evaluate("() => window.__galaxySkeletonDiagnostics")
                print('P218 natural timeline diagnostic',json.dumps({'time':diag.get('time'),'phase':diag.get('currentPhase'),
                    'pickups':diag.get('pickupLog'),'errors':errors[-10:],'lastRequests':requests[-6:]}),flush=True)
                await page.screenshot(path=str(OUT/'desktop-failed-natural-timeline.png'),full_page=True)
                raise
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
            # Protect against a subtle R3F failure: a positive useFrame priority
            # takes over WebGL rendering while HTML captions still look alive.
            # The actual planets fill far more than 12% of this middle field;
            # an empty black canvas has under 2% bright pixels.
            image=Image.open(file).convert('RGB')
            iw,ih=image.size
            sampled=[max(image.getpixel((x,y)))>80
              for y in range(int(ih*.25),int(ih*.72),5)
              for x in range(int(iw*.12),int(iw*.88),5)]
            bright=sum(sampled)/len(sampled)
            assert bright>.12,(name,stage,'WebGL scene blank',round(bright,4))
            diag=await page.evaluate('window.__galaxySkeletonDiagnostics')
            snapshots.append({'stage':stage,'time':diag['time'],'ikError':diag.get('ikError'),'pickupTargetError':diag.get('pickupTargetError'),'miniatures':diag.get('miniatures',{})})
            print(name,stage,'IK',diag.get('ikError'))
            return diag
        if not reduced:
            intro=await capture('entrance',950)
            assert intro['atlasReveal']['phase']=='immersive' and intro['atlasReveal']['progress']==0, intro['atlasReveal']
            assert intro['movementMode']=='articulated-hover' and intro['torsoBendRadians']<.06,'Skull must never bend during entrance'
            assert intro['groundWalkWeight']<.001 and intro['groundPickupWeight']<.001, 'No floor-walk or floor-pick clips'
            assert intro.get('legBoneCount',0)>=4,('Actual skeleton thigh/knee joints must be mapped',intro.get('legBoneCount'))
            assert intro['legMotionRadians']>.02,('Both anatomical legs must move on entry',intro.get('legMotionRadians'))
            assert len(intro.get('worldMotion',{}))==17,'Full-screen introduction must render all 17 planets'
            for world_id,motion in intro['worldMotion'].items():
                x,y=motion['screen']
                assert 0<x<width and 0<y<height, ('Opening cropped an orbiting planet',name,world_id,motion['screen'])
            assert await page.locator('.guardian-journey.is-entering').count()==1
            flight=await capture('approach',2200+4800*.20)
            assert len(intro.get('worldMotion',{}))==17 and len(flight.get('worldMotion',{}))==17, 'All 17 planets must render in independently updated galaxy motion'
            motionA=intro['worldMotion'];motionB=flight['worldMotion']
            for i in range(17):
                a=motionA[str(i)];b=motionB[str(i)]
                delta=math.dist(a['position'],b['position'])
                assert delta>.015,('Planet must visibly revolve around galaxy',i,delta)
                assert b['spin']>a['spin'],('Planet must spin on its own axis',i)
            rotationSpeeds=[(motionB[str(i)]['spin']-motionA[str(i)]['spin'])/(flight['time']-intro['time']) for i in range(17)]
            assert len(set(round(v,6) for v in rotationSpeeds))>=5,'Planets need distinct axial spin speeds'
            first=flight['miniatures']['0']
            assert first['sourceWorldIndex']==0 and not first['visible'],first
            assert flight['approachTravel']>.0,'Skull must move towards the orbit while planet stays in place'
            reach=await capture('upright-orbit-reach',2200+4800*.47)
            assert reach['movementMode']=='articulated-orbital-pluck',reach['movementMode']
            assert reach['groundWalkWeight']<.001,'Collector must HOVER, not walk or bend while travelling'
            assert reach['groundPickupWeight']<.001,'Ground pickup animation must NEVER play'
            assert reach['torsoBendRadians']<.06,'Chest and waist must stay upright during the reach'
            assert reach['pluckReachWeight']>.95,'Actual arm must be extended before contact'
            assert reach['legMotionRadians']>.01,'Legs must move while hovering through orbit'
            assert not reach['palmContactInOrbit'],'Planet stays in moving galaxy until palm contact'
            assert not reach['miniatures']['0']['visible'],'No duplicate floor or pre-contact sphere'
            energy=await capture('orbital-contact-glow',2200+4800*.56)
            assert energy['palmContactInOrbit'], 'The pluck occurs in space at palm contact'
            assert energy['groundWalkWeight']<.001 and energy['groundPickupWeight']<.001
            assert energy['torsoBendRadians']<.06,'No bowing while holding the planet'
            assert math.dist(energy['miniatures']['0']['position'],energy['rightGrip'])<.002, 'Orbital planet must physically follow the real hand'
            assert energy['miniatures']['0']['beamVisible'],'Short contact glint must be visible as the Skull takes the world'
            assert energy['miniatures']['0']['attached'],'Orbital world should attach to real palm after contact'
            pickup=await capture('pickup',2200+4800*.61)
            assert pickup['miniatures']['0']['attached']
            assert pickup['miniatures']['0']['contactError']<.001
            assert pickup['pickupTargetError']<.04,pickup['pickupTargetError']
            deposit=await capture('deposit',2200+4800*.79)
            assert deposit['miniatures']['0']['stage']=='deposit'
            assert deposit['atlasReveal']['progress']==0,'Galaxy must never shrink or move to the right'
            sweep=await capture('galaxy-stays-fullscreen',7000+1750/2)
            for snap in (flight,reach,energy,deposit,sweep):
                assert snap['atlasReveal']['progress']==0 and snap['atlasReveal']['phase']=='immersive', 'Galaxy must NEVER become right-side atlas'
                assert math.dist(snap['atlasReveal']['position'],intro['atlasReveal']['position'])<.001, 'Galaxy parent must remain fixed fullscreen'
            # All three independent real source clip cycles must be observed.
            for order in [1,2]:
                ms=2200+(order+.61)*4800
                await page.evaluate('(ms)=>window.__galaxyV6.seek(ms)',ms)
                await page.wait_for_function('(ms)=>Math.abs(window.__galaxySkeletonDiagnostics.time-ms)<1',arg=ms)
        diag=await capture('offering',18800)
        assert diag['atlasReveal']['progress']==0 and diag['atlasReveal']['phase']=='immersive', 'Fullscreen orbit must persist after collecting'
        assert await page.locator('.guardian-journey.is-revealed').count()==1,'Show lesson controls without shrinking galaxy'
        assert diag['clips']==95 and diag['bones']==41,diag
        if os.environ.get('GALAXY_V6_ANATOMY')=='1':
            assert diag.get('anatomyEnabled') and diag.get('anatomicalParts',0)>=280,\
                ('New anatomical GLB must actually render in this browser run',diag.get('anatomicalParts'),diag.get('anatomyEnabled'))
            assert 10<=diag.get('anatomicalClusters',0)<=16,diag.get('anatomicalClusters')
            assert diag.get('articulatedLegs') and diag.get('articulatedArms') and not diag.get('spectralActive'),('Visible bone-rigged legs and palms, not a legless vapor body, are required',diag)
            assert diag.get('visibleLegMeshes',0)>=4,'Both thigh and shin meshes must render'
        assert diag.get('toyEyesHidden'),'Oversized KayKit toy eyes must stay hidden in the rendered Skull Master'
        if diag.get('offeringCenter') and diag.get('waistPosition'):
            # Both coordinates are world space. The globe may not sit inside
            # the skeletal rib cage as it did in rejected visual QA images.
            assert diag['waistPosition'][0]-diag['offeringCenter'][0]>.30,\
                (name,'offered planet overlaps torso',diag['offeringCenter'],diag['waistPosition'])
        assert diag['hasArmIK'] and math.isfinite(diag['ikError']) and diag['ikError']<.18,diag.get('ikError')
        assert diag['torsoBendRadians']<.06,'Skull must be upright when presenting planet'
        assert all(not m['visible'] for m in diag.get('miniatures',{}).values()),'Stored planets must be inside the bag'
        if not reduced:
            assert [p['index'] for p in diag['pickupLog']][-3:]==[0,1,2],diag['pickupLog']
        assert any(m['map'] for m in diag['materials'])
        await page.get_by_role('button',name='Explore all 17 worlds').click()
        assert await page.locator('.galaxy-dock li').count()==17
        if width<700 and not reduced:
            # Mobile uses the navigator for replay/skip so controls never cover the Genie.
            await page.get_by_role('button',name='Replay Genie entrance ↻').click()
            await page.wait_for_function("() => window.__galaxySkeletonDiagnostics.currentPhase==='arriving'")
            assert await page.locator('.galaxy-dock').count()==0
            await page.get_by_role('button',name='Explore all 17 worlds').click()
            await page.get_by_role('button',name='Skip Genie introduction →').click()
            await page.wait_for_function("() => window.__galaxySkeletonDiagnostics.currentPhase==='offering'")
        else:
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
        if not reduced:
            offered=await page.evaluate('window.__galaxySkeletonDiagnostics')
            assert offered.get('offeredWorldIndex')==1 and offered.get('offeredHitPoint') and offered.get('offeredDomTarget'),offered
            assert await page.get_by_role('button',name='Explore offered planet: Prompt Engineering').is_visible(), 'Touch target must be visible at offered planet'
            hit=offered['offeredHitPoint']
            assert 0<hit[0]<width and 0<hit[1]<height,(name,hit)
            await page.mouse.click(hit[0],hit[1])
        else:
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
