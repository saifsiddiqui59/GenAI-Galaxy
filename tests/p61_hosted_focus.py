"""Public-only desktop/mobile smoke for the isolated P61 Galaxy interview UI.

Runs after protected existing-storage publication. Guest mode only; no login,
Supabase user fixture, paid model invocation, microphone or cloud mutation.
"""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-ai-p61/index.html"
OUT = Path("artifacts/p61-hosted-interview")

async def one(browser, width, height):
    page = await browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
    errors=[]
    page.on("pageerror",lambda e:errors.append(str(e)))
    await page.goto(BASE+"?version="+os.environ["GITHUB_SHA"],wait_until="domcontentloaded",timeout=60000)
    await page.get_by_role("button",name="Explore free guest preview").click(timeout=18000)
    await page.locator('#entry-gate').wait_for(state="hidden",timeout=10000)
    # Guest entry may precede async curriculum fetches; wait until navigation is bound.
    await page.wait_for_function('document.querySelector(\'[data-view="practice"]\')?.dataset.bound === "1"',timeout=20000)
    await page.locator('[data-view="practice"]').first.click(timeout=15000)
    await page.locator('.practice-question').wait_for(timeout=12000)
    assert await page.locator('.practice-advanced').count()==1
    assert not await page.locator('.practice-advanced').evaluate("e=>e.open")
    assert await page.locator('.interview-journey').count()==1
    assert await page.locator('.practice-help').count()==1
    assert not await page.locator('.practice-help').evaluate("e=>e.open")
    assert not await page.locator('#tutor-reference').is_visible()
    assert await page.locator('#top-skip').is_visible()
    assert await page.locator('#evaluate-btn').is_visible()
    assert await page.get_by_text('01 · AI QUESTION').count()==1
    assert await page.get_by_label('02 · MY ANSWER — EDITABLE TRANSCRIPT').count()==1
    assert await page.locator('#evaluate-btn').count()==1
    assert await page.locator('#top-skip').count()==1
    assert await page.locator('#tutor-reference').count()==1
    assert await page.locator('[data-choice]').count()==0
    # Check the screenshot-reported mobile lesson cards before interview.
    await page.locator('[data-view="galaxy"]').first.click()
    await page.locator('#open-next').click()
    assert await page.locator('.lesson-content-card').count()==8
    assert await page.locator('.lesson-more').count()==1
    assert not await page.locator('.lesson-more').evaluate('e=>e.open')
    assert await page.locator('#practice-this').is_visible()
    assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'), 'Lesson horizontal overflow'
    OUT.mkdir(parents=True,exist_ok=True)
    await page.screenshot(path=str(OUT/f'lesson-{width}x{height}.png'),full_page=True,animations='disabled',timeout=15000)
    await page.locator('#practice-this').click()
    assert await page.locator('#evaluate-btn').is_visible()
    # Capture the uncluttered entry state before submitting; never trigger a model.
    OUT.mkdir(parents=True,exist_ok=True)
    await page.screenshot(path=str(OUT/f'interview-question-{width}x{height}.png'),full_page=True,animations='disabled',timeout=15000)
    # Guest-only offline concept check: NO authenticated/paid model call.
    await page.locator('#spoken-answer').fill(
        'Groundedness is checked against available evidence; relevance measures whether an answer addresses a question.')
    await page.locator('#evaluate-btn').click()
    await page.locator('.practice-feedback').wait_for(timeout=15000)
    assert 'NOT A FACTUAL GRADE' in await page.locator('.practice-feedback').inner_text()
    assert await page.locator('.practice-evidence').count()==1
    assert not await page.locator('.practice-evidence').evaluate("e=>e.open")
    assert await page.locator('#adaptive-next').is_visible()
    assert await page.get_by_text('04 · Improved interview-ready answer').count()==1
    OUT.mkdir(parents=True,exist_ok=True)
    await page.screenshot(path=str(OUT/f'interview-{width}x{height}.png'),full_page=True,animations='disabled',timeout=15000)
    assert not errors,errors
    print(f'P61 hosted public-only guest interview {width}x{height} PASS; no model call')
    await page.close()

async def main():
    if not os.environ.get("GITHUB_SHA") or len(os.environ["GITHUB_SHA"])!=40:
        raise RuntimeError('Require verified exact source SHA')
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        await one(browser,1440,900)
        await one(browser,390,844)
        await browser.close()

if __name__=="__main__":
    asyncio.run(main())
