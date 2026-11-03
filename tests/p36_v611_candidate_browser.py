"""V6.11 visual inspection harness for an unapproved skinned candidate.
Screenshots are honest raw Chromium frames; green execution does NOT approve art.
No Azure, no hosted deployments or production asset replacement.
"""
import asyncio,json,math,os
from pathlib import Path
from playwright.async_api import async_playwright

OUTPUT=Path(os.environ.get('GALAXY_V611_CANDIDATE_OUTPUT','verification/v611-actor'))
OUTPUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('GALAXY_V611_CANDIDATE_URL','http://127.0.0.1:4177/rig-candidate.html')

async def main():
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,args=[
            '--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
            '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        for name,width,height in [('desktop',1440,900),('mobile',390,844),('mobile-small',360,740)]:
            context=await browser.new_context(
                viewport={'width':width,'height':height},
                reduced_motion='reduce' if name=='mobile-small' else 'no-preference',
                **({'record_video_dir':str(OUTPUT),
                    'record_video_size':{'width':width,'height':height}} if name=='desktop' else {}))
            page=await context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.goto(URL,wait_until='domcontentloaded',timeout=30000)
            await page.wait_for_function('window.__actorCandidate?.ready && window.__actorCandidate?.pose?.leftFoot',timeout=90000)
            await page.wait_for_timeout(450)
            idle=await page.evaluate('window.__actorCandidate')
            assert idle['jointCount']>=20 and idle['skinnedMeshes']>=1,(name,idle)
            assert idle['visuallyApproved'] is False,'Code must never claim human visual acceptance'
            assert len(idle['animationClips'])>=2
            await page.screenshot(path=str(OUTPUT/f'{name}-idle.png'),full_page=True)
            await page.locator('#walk').click()
            await page.wait_for_function("window.__actorCandidate?.clip==='walk_loop' && !!window.__actorCandidate?.ready",timeout=10000)
            poses=[]
            for t in range(4):
                await page.wait_for_timeout(330)
                pose=await page.evaluate('window.__actorCandidate.pose')
                assert pose and all(math.isfinite(v) for key in ['leftFoot','rightFoot','leftHand','rightHand'] for v in pose[key]),(name,pose)
                poses.append(pose)
                if t in (0,2,3):
                    await page.screenshot(path=str(OUTPUT/f'{name}-walk-{t}.png'),full_page=True)
            assert not errors,(name,errors)
            stride_distance=max(math.dist(poses[0]['leftFoot'],item['leftFoot']) for item in poses[1:])
            assert stride_distance>.005,('Walk clip does not animate an actual foot',name,stride_distance)
            results.append({'viewport':name,'size':[width,height],'jointCount':idle['jointCount'],
                'skinnedMeshes':idle['skinnedMeshes'],'sourceMaterials':idle['sourceMaterials'],
                'clips':idle['animationClips'],'walkFootMovement':stride_distance,
                'walkSamples':poses,'errors':errors,'visualAccepted':False})
            await context.close()
        await browser.close()
    (OUTPUT/'report.json').write_text(json.dumps({
        'source':'AutoSprite Skeleton Gunslinger published CC0 claim',
        'evidence':'Actual Chromium screenshots at desktop and 2 phone sizes; no visual approval',
        'results':results,'visualAccepted':False},indent=2))
    print('BROWSER RIG CANDIDATE RENDER PASS; VISUAL APPROVAL = FALSE')
    for item in results:
        print(item['viewport'],item['size'],'bones',item['jointCount'],'foot movement',round(item['walkFootMovement'],4))

if __name__=='__main__': asyncio.run(main())
