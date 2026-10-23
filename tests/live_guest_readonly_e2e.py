"""Read-only REAL HOSTED Playwright guest/browser acceptance.

No authentication, Azure OpenAI calls, document uploads, user writes, or secrets.
In addition to counting any evaluator POSTs, route.abort() blocks them by
default in case a future frontend version attempts a surprising AI call.
This tests the DEPLOYED website, not the PR checkout.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

SITE = "https://gengalaxy1429841605.z29.web.core.windows.net/"
EXPECTED_EVALUATOR = (
    "https://gengalaxy-p3-1429841605.azurewebsites.net/api/practice/evaluate"
)
ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True)


async def inspect(label, width, height, reduced=False):
    leaked_requests = []
    javascript_errors = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"],
            timeout=60000)
        page = await browser.new_page(
            viewport={"width": width, "height": height}, locale="en-IN")
        if reduced:
            await page.emulate_media(reduced_motion="reduce")
        page.on("pageerror", lambda error: javascript_errors.append(str(error)))
        async def deny_any_model_call(route):
            leaked_requests.append("BLOCKED: unintended evaluator HTTP request")
            await route.abort()
        await page.route("**/api/practice/evaluate*", deny_any_model_call)
        async def check():
            response = await page.goto(
                SITE, wait_until="domcontentloaded", timeout=60000)
            assert response is not None and response.status == 200, (
                f"Public website HTTP {response.status if response else 'no response'}")
            await page.wait_for_selector(".planet-node", timeout=30000)
            planets = await page.locator(".planet-node").count()
            assert planets == 17, f"Expected 17 planets, found {planets}"
            config = await page.evaluate("() => window.GALAXY_EVALUATOR_URL || ''")
            print("HOSTED_EVALUATOR_URL_CONFIGURED=" + str(config == EXPECTED_EVALUATOR))
            assert config == EXPECTED_EVALUATOR, (
                "Live site does not publish the approved AI evaluator endpoint")
            assert "Sign in" in await page.locator("#signin-btn").inner_text()
            await page.locator('[data-chapter="3"]').click(force=True)
            await page.locator("#open-next").click(force=True)
            await page.locator("#practice-this").click(force=True)
            assert await page.locator("#spoken-answer").count() == 1
            mode = page.locator("#evaluation-mode")
            if await mode.count() != 1:
                print("FRONTEND_OUTDATED=YES (P14 UI not published)")
                raise AssertionError(
                    "Public site still serves the old instant-local-feedback UI. "
                    "P14 is merged but the new frontend has not been deployed.")
            mode_text = await mode.inner_text()
            assert "Guest mode" in mode_text, (
                "Guest user does not see clearly labeled local-only evaluation")
            text = await page.locator("#evaluate-btn").inner_text()
            assert "locally (free)" in text, (
                "Guest evaluation button does not explicitly say it is free/local")
            assert await page.locator("#practice-signin").count() == 1, (
                "No sign-in prompt offered for authenticated AI evaluation")
            await page.locator("#spoken-answer").fill(
                "LangGraph routes work through nodes and edges, updating shared "
                "state while authentication and tool permissions are enforced "
                "separately by server-side controls.")
            await page.locator("#evaluate-btn").click(force=True)
            await page.wait_for_selector(".score-panel", timeout=10000)
            scoring = await page.locator(".score-panel").inner_text()
            assert "LOCAL CONCEPT CHECK" in scoring
            assert "NOT A FACTUAL GRADE" in scoring
            assert "Why this is a local check" in scoring
            assert "Guest mode" in scoring
            assert not leaked_requests, "UNEXPECTED PAID MODEL REQUEST BLOCKED"
            assert not javascript_errors, (
                "JavaScript errors: " + "; ".join(javascript_errors[:2]))
            print(f"LIVE_PLAYWRIGHT_PASS={label} planets={planets} model_calls=0")

        try:
            await check()
        finally:
            # Guest-only screenshots: no account/private data can be present.
            await page.screenshot(
                path=str(ARTIFACTS / f"galaxy-live-{label}.png"),
                full_page=True, timeout=10000, animations="disabled")
            await browser.close()
    return True


async def main():
    outcomes = []
    cases = (
        ("desktop", 1440, 900, False),
        ("mobile", 390, 844, False),
        ("reduced-motion", 1440, 900, True),
    )
    for case in cases:
        try:
            outcomes.append(await inspect(*case))
        except Exception as error:
            print(f"LIVE_PLAYWRIGHT_FAIL={case[0]}: {error}")
            outcomes.append(False)
    if not all(outcomes):
        raise SystemExit("Hosted guest-mode acceptance not yet passing")
    print("LIVE_HOSTED_GUEST_PLAYWRIGHT=PASS; billable_AI_calls=0")


if __name__ == "__main__":
    asyncio.run(main())
