import asyncio, json, pathlib, re
from playwright.async_api import async_playwright
R=pathlib.Path(__file__).resolve().parents[1]
async def inspect(viewport=(1440,900),path='galaxy-desktop.png',reduced=False):
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,timeout=45000,args=['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking'])
  page=await browser.new_page(viewport={'width':viewport[0],'height':viewport[1]},device_scale_factor=1)
  if reduced: await page.emulate_media(reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  html=(R/'index.html').read_text();html=re.sub(r'<link rel="stylesheet" href="styles.css">','',html);html=html.replace('<script src="app.js" defer></script>','')
  html=html.replace('<script src="genie/guide.js" defer></script>','')
  for asset in ('genie/progress/story.js','genie/effects/cosmic-polish.js','galaxy/handoff/planet-flight.js'):
   html=html.replace('<script src="'+asset+'" defer></script>','')
  for asset in ('genie/effects/cosmic-polish.css','galaxy/handoff/planet-flight.css'):
   html=html.replace('<link rel="stylesheet" href="'+asset+'">','')
  await page.set_content(html,wait_until='domcontentloaded')
  await page.add_style_tag(content=(R/'styles.css').read_text())
  for asset in ('genie/effects/cosmic-polish.css','galaxy/handoff/planet-flight.css'):
   await page.add_style_tag(content=(R/asset).read_text())
  await page.evaluate('''({subjects,lessons})=>{window.fetch=async (url)=>({ok:true,json:async()=>String(url).includes('curriculum')?subjects:lessons})}''',{'subjects':json.loads((R/'data/curriculum.json').read_text()),'lessons':json.loads((R/'data/lessons.json').read_text())})
  # Simulated browser STT; no microphone is accessed in CI.
  await page.evaluate('''() => { window.SpeechRecognition = class {start(){window.__fake_recognition=this;} stop(){this.onend?.();}} }''')
  for asset in ('genie/progress/story.js','genie/effects/cosmic-polish.js','galaxy/handoff/planet-flight.js'):
   await page.add_script_tag(content=(R/asset).read_text())
  await page.add_script_tag(content=(R/'app.js').read_text())
  await page.wait_for_selector('.planet-node',timeout=7000)
  count=await page.locator('.planet-node').count();assert count==17,count
  assert await page.locator('h1').inner_text()
  if reduced:
   assert not await page.locator('#motion-toggle').is_checked()
   assert await page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
   await page.wait_for_timeout(100)
   assert not await page.locator('#motion-toggle').is_checked()
  await page.screenshot(path=str(R/path),full_page=True,animations='disabled',timeout=7000)
  # Login-guide UI acceptance is mocked locally; it does not create an Auth user.
  await page.add_script_tag(content=(R/'genie/guide.js').read_text())
  shown=await page.evaluate("""() => window.GalaxyGenieGuide.show({
    userId:'browser-demo-a',
    masteredWorlds:[{index:0,name:'LLM Fundamentals'}],
    next:{index:2,title:'RAG & Retrieval',isReview:false},
    motion:true,onContinue:()=>{window.__genieContinued=true}
  })""")
  assert shown
  assert await page.locator('#genie-guide').is_visible()
  assert await page.locator('#genie-collected-count').inner_text()=='1 of 17 worlds mastered'
  assert await page.locator('#genie-collected-orbs circle').count()==1
  assert await page.locator('#genie-guide .genie-cosmic-particle').count()==18
  assert await page.locator('#genie-world-name').inner_text()=='RAG & Retrieval'
  assert await page.evaluate("document.activeElement?.id === 'genie-skip'")
  if reduced:
   assert 'no-motion' in (await page.locator('#genie-guide').get_attribute('class'))
  await page.screenshot(path=str(R/('genie-'+path)),animations='disabled',timeout=7000)
  await page.locator('#genie-continue').click()
  assert await page.evaluate('window.__genieContinued===true')
  flight=await page.evaluate("""async () => {
   let nav=0;
   const result=await window.GalaxyPlanetHandoff.run({
     sourceRect:{left:300,top:180,width:72,height:72},
     targetRect:{left:600,top:370,width:58,height:58},
     motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,
     duration:140,onNavigate:()=>nav++
   });
   return {nav,animated:result.animated,reason:result.reason};
  }""")
  assert flight['nav']==1
  assert flight['reason']==('reduced-motion' if reduced else 'completed')
  assert not await page.locator('#genie-guide').is_visible()
  assert not await page.evaluate("""() => window.GalaxyGenieGuide.show({
    userId:'browser-demo-a',next:{title:'Do not repeat'}})""")
  await page.evaluate("""() => window.GalaxyGenieGuide.show({
    userId:'browser-demo-b',
    masteredWorlds:[],next:{title:'Next world',index:1}})""")
  assert await page.locator('#genie-collected-count').inner_text()=='0 of 17 worlds mastered'
  await page.keyboard.press('Escape')
  assert not await page.locator('#genie-guide').is_visible()
  await page.locator('[data-chapter="3"]').click(force=True)
  await page.wait_for_timeout(50)
  assert await page.locator('#chapter-panel h2').inner_text()=='LangChain & LangGraph'
  # Click first available topic in selected chapter, verify detailed navigation.
  await page.locator('#open-next').click()
  assert await page.locator('.content-block').count()==8
  await page.locator('#practice-this').click()
  assert await page.locator('#spoken-answer').count()==1
  assert await page.locator('[data-choice]').count()==0
  await page.locator('#mic-control').click()
  assert await page.locator('#mic-control').get_attribute('aria-pressed')=='true'
  await page.evaluate('''() => {const r=window.__fake_recognition; const part=[{transcript:'I am practicing a spoken interview answer'}];part.isFinal=true;r.onresult({results:[part]})}''')
  assert 'practicing a spoken interview' in await page.locator('#spoken-answer').input_value()
  await page.locator('#mic-control').click()
  assert await page.locator('#mic-control').get_attribute('aria-pressed')=='false'
  await page.locator('#spoken-answer').fill('We use nodes and edges to define a graph. Conditional routing selects tools and our shared state carries data through the workflow; authorization and safe execution remain backend duties.')
  await page.locator('#evaluate-btn').click()
  await page.wait_for_selector('.score-panel',timeout=3500)
  score_text=(await page.locator('.score-panel').inner_text())[:160]
  assert 'NOT A FACTUAL GRADE' in score_text
  assert await page.locator('#sidebar-mastered').inner_text()=='0'  # local keywords cannot certify mastery
  await page.locator('[data-view="vault"]').first.click()
  assert 'Sign in' in await page.locator('#root').inner_text()
  assert not errors,errors
  print(viewport,'PASS planets',count,'practice',score_text.replace('\n',' ')[:100]);await browser.close()
async def main():
 await inspect((1440,900),'galaxy-desktop.png')
 await inspect((390,844),'galaxy-mobile.png')
 await inspect((1440,900),'galaxy-reduced-motion.png',reduced=True)
asyncio.run(main())
