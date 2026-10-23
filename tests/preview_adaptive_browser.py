"""Playwright test of the exact portable offline HTML sent for user acceptance."""
import asyncio
from pathlib import Path
import os
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / "artifacts/adaptive-learning-preview.html"
HOSTED = "https://gengalaxy1429841605.z29.web.core.windows.net/adaptive-preview/index.html"


async def inspect(name, width, height):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = await browser.new_page(viewport={"width": width, "height": height})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        try:
            target = os.getenv("GALAXY_ADAPTIVE_PREVIEW_URL", FILE.resolve().as_uri())
            assert target in (FILE.resolve().as_uri(), HOSTED), "Unexpected preview host"
            response = await page.goto(target, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_selector(".planet-node", timeout=10000)
            assert await page.locator(".planet-node").count() == 17
            assert await page.evaluate("window.__GALAXY_OFFLINE_PREVIEW") is True
            assert await page.evaluate("window.GALAXY_EVALUATOR_URL === ''")
            assert await page.locator("#signin-btn").is_disabled()
            await page.locator('[data-view="practice"]').first.click(force=True)
            before = await page.locator(".practice-question").inner_text()
            await page.locator("#adaptive-teach").click()
            assert await page.locator("#adaptive-guide").count() == 1
            assert "Simple explanation" in await page.locator("#adaptive-guide").inner_text()
            await page.locator("#adaptive-guided-try").click()
            assert "In your own words" in await page.locator(".practice-question").inner_text()
            await page.locator("#spoken-answer").fill("this something i dont know yet may its related to ai foundry projects")
            await page.locator("#evaluate-btn").click()
            assert await page.locator("#adaptive-guide").count() == 1
            assert await page.locator(".score-panel").count() == 0
            await page.locator("#adaptive-skip").click()
            assert await page.locator(".practice-question").inner_text() != before
            assert await page.locator("#sidebar-mastered").inner_text() == "0"
            await page.locator("#spoken-answer").fill(
                "We use embeddings to represent text as vectors for semantic "
                "similarity, retrieving relevant context and reasoning about "
                "results using appropriate metadata and scoring.")
            await page.locator("#evaluate-btn").click()
            await page.wait_for_selector(".score-panel", timeout=3000)
            assert "LOCAL CONCEPT CHECK" in await page.locator(".score-panel").inner_text()
            assert await page.locator("#adaptive-next-topic").count() == 1
            assert await page.locator("#adaptive-explain").count() == 1
            await page.locator("#adaptive-next-topic").click()
            assert await page.locator(".score-panel").count() == 0
            assert not errors, errors
            print(f"P18_OFFLINE_BROWSER_PASS={name}; model_calls=0; sign_in=disabled")
        finally:
            await page.screenshot(
                path=str(ROOT / f"artifacts/p18-{name}.png"),
                full_page=True, animations="disabled", timeout=10000)
            await browser.close()


async def main():
    if not FILE.exists():
        raise SystemExit("Build standalone HTML before Playwright")
    await inspect("desktop", 1440, 900)
    await inspect("mobile", 390, 844)


if __name__ == "__main__":
    asyncio.run(main())
