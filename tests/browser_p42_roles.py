"""Offline, genuine Chromium view checks for Galaxy SUPER_ADMIN / ADMIN / USER.

Synthetic role state only: does not create Supabase Auth users, JWTs or sessions.
All authorization must still be enforced on every privileged database RPC.
"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]

async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True, args=["--no-sandbox","--disable-dev-shm-usage"])
  page=await browser.new_page(viewport={"width":1280,"height":800})
  html=(ROOT/"index.html").read_text()
  html=html.replace('<link rel="stylesheet" href="styles.css">',"")
  html=html.replace('<script src="app.js" defer></script>',"")
  await page.set_content(html)
  await page.add_style_tag(content=(ROOT/"styles.css").read_text())
  await page.evaluate("""({subjects,lessons})=>{
     window.fetch=async url=>({ok:true,json:async()=>String(url).includes('curriculum')?subjects:lessons});
  }""",{"subjects":json.loads((ROOT/"data/curriculum.json").read_text()),"lessons":json.loads((ROOT/"data/lessons.json").read_text())})
  await page.add_script_tag(content=(ROOT/"app.js").read_text())
  await page.wait_for_selector(".planet-node", timeout=10000)
  await page.locator("#entry-guest").click()
  await page.evaluate("""()=>{
    state.user={id:'00000000-0000-4000-8000-000000000001',email:'galaxy-super@example.test'};
    state.isGuest=false;
    state.platformAuthorized=true;state.platformRole='SUPER_ADMIN';
    state.platformSummary={accounts:1,pending:1,approved:0,
       active_subscriptions:0,suspended:0};
    state.platformPending=[{email:'test-learner@example.test',user_id:'00000000-0000-4000-8000-000000000002'}];
    state.platformAccounts={total:1,offset:0,limit:25,accounts:[{
       email:'test-learner@example.test',user_id:'00000000-0000-4000-8000-000000000002',
       approval:'PENDING',plan_code:'FREE',subscription_status:'ACTIVE',evaluations_today:0}]};
    state.platformAudit=[];state.approvalInfo={approval_required:false};
    setView('platform');
  }""")
  assert await page.locator("#platform-plan-form").count()==1, "SUPER_ADMIN must see plan form"
  assert await page.locator("[data-manage-user]").count()==1, "SUPER_ADMIN can manage an approved account"
  assert await page.locator("[data-platform-approve]").count()==1
  await page.evaluate("""()=>{
    state.platformRole='ADMIN';render();
  }""")
  assert await page.locator("#platform-plan-form").count()==0, "ADMIN must not see plan form"
  assert await page.locator("[data-manage-user]").count()==0, "ADMIN cannot edit subscriptions"
  assert await page.get_by_text("Subscription changes restricted").count()==1
  assert await page.locator("[data-platform-approve]").count()==1, "ADMIN can review requests"
  await page.evaluate("""()=>{
    state.platformAuthorized=false;state.platformRole=null;state.platformSummary=null;render();
  }""")
  assert await page.locator("#platform-plan-form").count()==0
  assert await page.locator("#platform-nav").is_hidden()
  assert "Restricted administration" in await page.locator("#root").inner_text()
  print("PASS: Chromium SUPER_ADMIN management, ADMIN read-only plans/reviews, USER denial")
  await browser.close()

if __name__=="__main__":
 asyncio.run(run())
