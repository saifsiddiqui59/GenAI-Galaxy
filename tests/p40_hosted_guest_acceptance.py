"""P40 read-only hosted guest regression. No Auth accounts, DB writes or paid AI requests."""
import asyncio
from hashlib import sha256
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
SITE='https://gengalaxy1429841605.z29.web.core.windows.net/'
PINNED_FILES=('index.html','app.js','features/offline-misconceptions.js')

async def verify(viewport,reduced=False):
 errors=[]
 blocked=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=await browser.new_context(viewport=viewport,reduced_motion='reduce' if reduced else 'no-preference')
  page=await ctx.new_page()
  page.on('pageerror',lambda e: errors.append(str(e)))
  async def no_model(route):
   blocked.append(route.request.url)
   await route.abort()
  await page.route('**/api/practice/evaluate',no_model)
  response=await page.goto(SITE,wait_until='domcontentloaded',timeout=45000)
  assert response and response.status==200,'Galaxy homepage unavailable'
  for file in PINNED_FILES:
   remote=await page.request.get(SITE+file,timeout=30000)
   assert remote.status==200,file+' failed HTTP'
   local=(ROOT/file).read_bytes()
   assert sha256(await remote.body()).digest()==sha256(local).digest(),file+' differs from released source'
  await page.wait_for_function("Boolean(window.GalaxyMisconceptionGuard && window.GalaxyMisconceptionGuard.ruleCount===4)")
  # Use guest-only route; no real account is required or created.
  await page.locator('#entry-guest').click(timeout=15000)
  await page.locator('[data-view="practice"]').first.click(timeout=15000)
  await page.locator('#focus-topic').select_option(label='Tokens & tokenization')
  await page.locator('#spoken-answer').fill('All words map to exactly one token so multiply word count by one.')
  await page.locator('#evaluate-btn').click(timeout=15000)
  warning=page.locator('section[role="alert"]').filter(has_text='Potential misconception')
  await warning.wait_for(timeout=10000)
  assert 'Token boundaries' in await warning.inner_text()
  assert 'NOT A FACTUAL GRADE' in await page.locator('.score-panel').inner_text()
  assert await page.locator('#sidebar-mastered').inner_text()=='0','Free guard must not grant mastery'
  assert not blocked,'Guest unexpectedly tried to call a paid model endpoint'
  assert not errors,'JavaScript exceptions: '+str(errors)
  print('P40 HOSTED PASS',viewport,'reduced_motion=',reduced,'verified_files=',len(PINNED_FILES))
  await browser.close()

async def main():
 await verify({'width':1440,'height':900})
 await verify({'width':390,'height':844})
 await verify({'width':1440,'height':900},reduced=True)

if __name__=='__main__':
 asyncio.run(main())
