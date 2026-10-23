"""Read-only live P14 browser acceptance. Never authenticate or contact the paid model.

This is intentionally run ONLY after the manual pinned-app.js-only deployment.
Browser blocks all evaluator requests. Screenshots contain guest/public data only.
"""
import asyncio
import hashlib
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://gengalaxy1429841605.z29.web.core.windows.net/"
EVALUATOR = (
    "https://gengalaxy-p3-1429841605.azurewebsites.net/api/practice/evaluate"
)
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)


async def check_case(label: str, viewport: dict, reduced: bool = False):
    blocked_paid_calls = []
    javascript_errors = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
            timeout=45000,
        )
        page = await browser.new_page(viewport=viewport, locale="en-IN")
        page.on("pageerror", lambda error: javascript_errors.append(str(error)))
        if reduced:
            await page.emulate_media(reduced_motion="reduce")

        async def prohibit_paid_evaluation(route):
            blocked_paid_calls.append(route.request.url)
            await route.abort()

        await page.route("**/api/practice/evaluate*", prohibit_paid_evaluation)

        try:
            response = await page.goto(
                SITE, wait_until="domcontentloaded", timeout=45000
            )
            assert response is not None and response.status == 200
            await page.wait_for_selector(".planet-node", timeout=25000)
            assert await page.locator(".planet-node").count() == 17

            # Use the PUBLIC staged URL. Nothing here sends an AI request.
            endpoint = await page.evaluate(
                "() => window.GALAXY_EVALUATOR_URL || ''"
            )
            assert endpoint == EVALUATOR, "Approved AI endpoint not staged"

            # Downloaded bytes are compared with the pinned, reviewed P14 JS.
            asset = await page.request.get(SITE + "app.js", timeout=25000)
            assert asset.status == 200
            served = await asset.body()
            expected = (ROOT / "app.js").read_bytes()
            assert hashlib.sha256(served).digest() == hashlib.sha256(expected).digest(), (
                "Live site serves stale or unexpected app.js bytes"
            )
            assert await page.locator("#signin-btn").inner_text() == "Sign in"
            await page.locator('[data-chapter="3"]').click(force=True)
            await page.locator("#open-next").click(force=True)
            await page.locator("#practice-this").click(force=True)

            mode = page.locator("#evaluation-mode")
            await mode.wait_for(timeout=8000)
            assert "Guest mode" in await mode.inner_text()
            assert "locally (free)" in await page.locator("#evaluate-btn").inner_text()
            assert await page.locator("#practice-signin").count() == 1
            await page.locator("#spoken-answer").fill(
                "LangGraph workflows use graph nodes, conditional edges and shared "
                "state. The execution path can change according to state, "
                "while authentication remains enforced by backend services."
            )
            await page.locator("#evaluate-btn").click(force=True)
            await page.wait_for_selector(".score-panel", timeout=10000)
            panel = await page.locator(".score-panel").inner_text()
            assert "LOCAL CONCEPT CHECK" in panel
            assert "NOT A FACTUAL GRADE" in panel
            assert "Why this is a local check" in panel
            assert "Guest mode" in panel
            assert not blocked_paid_calls, "Browser attempted a paid evaluator call"
            assert not javascript_errors, f"JavaScript errors: {javascript_errors[:2]}"
            print(f"P14_LIVE_PASS={label}; MODE=guest_local; MODEL_CALLS=0")
        finally:
            await page.screenshot(
                path=str(ARTIFACTS / f"galaxy-p14-{label}.png"),
                full_page=True,
                animations="disabled",
                timeout=12000,
            )
            await browser.close()


async def main():
    await check_case("desktop", {"width": 1440, "height": 900})
    await check_case("mobile", {"width": 390, "height": 844})
    await check_case("reduced-motion", {"width": 1440, "height": 900}, True)
    print("P14_PUBLIC_BROWSER_ACCEPTANCE=PASS; PAID_MODEL_CALLS=0")


if __name__ == "__main__":
    asyncio.run(main())
