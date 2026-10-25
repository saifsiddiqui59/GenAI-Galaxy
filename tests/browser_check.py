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
  await page.set_content(html,wait_until='domcontentloaded')
  await page.add_style_tag(content=(R/'styles.css').read_text())
  await page.evaluate('''({subjects,lessons})=>{window.fetch=async (url)=>({ok:true,json:async()=>String(url).includes('curriculum')?subjects:lessons})}''',{'subjects':json.loads((R/'data/curriculum.json').read_text()),'lessons':json.loads((R/'data/lessons.json').read_text())})
  # Simulated browser STT; no microphone is accessed in CI.
  await page.evaluate('''() => { window.SpeechRecognition = class {start(){window.__fake_recognition=this;} stop(){this.onend?.();}} }''')
  await page.add_script_tag(content=(R/'app.js').read_text())
  await page.wait_for_selector('.planet-node',timeout=7000)
  # Login-first experience; choose explicit free guest preview for existing learner smoke.
  assert await page.locator('#entry-gate').is_visible()
  assert await page.locator('#entry-login').count()==1
  await page.locator('#entry-guest').click()
  assert not await page.locator('#entry-gate').is_visible()
  count=await page.locator('.planet-node').count();assert count==17,count
  assert await page.locator('#root h1').inner_text()
  if reduced:
   assert not await page.locator('#motion-toggle').is_checked()
   assert await page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
   await page.wait_for_timeout(100)
   assert not await page.locator('#motion-toggle').is_checked()
  await page.screenshot(path=str(R/path),full_page=True,animations='disabled',timeout=7000)
  await page.locator('[data-chapter="3"]').click(force=True)
  await page.wait_for_timeout(50)
  assert await page.locator('#chapter-panel h2').inner_text()=='LangChain & LangGraph'
  # Click first available topic in selected chapter, verify detailed navigation.
  await page.locator('#open-next').click()
  assert await page.locator('.content-block').count()==8
  await page.locator('#practice-this').click()
  assert await page.locator('#spoken-answer').count()==1
  assert await page.locator('[data-choice]').count()==0
  # Free adaptive tutoring: explain, guide, skip, and resume without a model.
  assert await page.locator('#adaptive-teach').count()==1
  await page.locator('.practice-more-actions > summary').first.click()
  assert await page.locator('#adaptive-teach').is_visible()
  await page.locator('#adaptive-teach').click()
  assert await page.locator('#adaptive-guide').count()==1
  assert 'Simple explanation' in await page.locator('#adaptive-guide').inner_text()
  await page.locator('#adaptive-guided-try').click()
  assert 'In your own words' in await page.locator('.practice-question').inner_text()
  await page.locator('#spoken-answer').fill("this something i dont know yet may its related to ai foundry projects")
  await page.locator('#evaluate-btn').click()
  assert await page.locator('#adaptive-guide').count()==1
  assert await page.locator('.score-panel').count()==0
  previous_topic = await page.locator('.panel h3').first.inner_text()
  await page.locator('.practice-more-actions > summary').first.click()
  assert await page.locator('#adaptive-skip').is_visible()
  await page.locator('#adaptive-skip').click()
  next_topic = await page.locator('.panel h3').first.inner_text()
  assert next_topic != previous_topic, 'Skip failed to advance topic'
  assert await page.locator('#adaptive-guide').count()==0
  assert await page.locator('#sidebar-mastered').inner_text()=='0'
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
