"""Public hosted Galaxy P42 authentication surface and anonymous RBAC Playwright QA.
This is real HTTPS Chromium/PostgREST testing, but NOT a signed-in login test.
No user creation, email submission, account mutation or model/API spend.
"""
import asyncio
import re
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://gengalaxy1429841605.z29.web.core.windows.net/"
SUPABASE = "https://vfoghlhtnifpnbevgufa.supabase.co"

async def scenario(browser, viewport, reduced=False, mobile=False):
    context = await browser.new_context(viewport=viewport, is_mobile=mobile,
                                        has_touch=mobile, permissions=[])
    page = await context.new_page()
    await page.goto(SITE, wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_selector(".planet-node", timeout=20000)
    assert await page.locator("#entry-gate").is_visible(), "Login-first gate missing"
    assert await page.locator("#platform-nav").is_hidden(), "Anonymous user sees admin nav"
    assert await page.locator("#platform-plan-form").count() == 0
    await page.locator("#entry-login").click()
    assert await page.locator("#auth-modal").is_visible()
    assert "Welcome back" in await page.locator("#auth-title").inner_text()
    email = page.locator("#auth-email")
    assert await email.get_attribute("type") == "email"
    assert await page.locator("#auth-password").get_attribute("type") == "password"
    await email.fill("not-an-email")
    assert not await email.evaluate("(e)=>e.checkValidity()"), "Invalid email unexpectedly valid"
    await page.locator("#auth-switch").click()
    assert "Create your explorer" in await page.locator("#auth-title").inner_text()
    await page.locator("#auth-switch").click()
    assert "Welcome back" in await page.locator("#auth-title").inner_text()
    await page.locator("#auth-forgot").click()
    assert "Reset your password" in await page.locator("#auth-title").inner_text()
    await page.locator("#close-modal").click()
    await page.locator("#entry-guest").click()
    assert await page.locator("#entry-gate").is_hidden()
    await page.evaluate("setView('platform')")
    assert "Administrator sign-in required" in await page.locator("#root").inner_text()
    assert await page.locator("#platform-plan-form").count() == 0
    assert await page.locator("#platform-nav").is_hidden()
    if reduced:
        assert await page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
    print("PASS public hosted UI", viewport, "reduced_motion=", reduced)
    await context.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True,
                        args=["--no-sandbox", "--disable-dev-shm-usage"])
        try:
            await scenario(browser, {"width":1440,"height":900})
            await scenario(browser, {"width":390,"height":844}, mobile=True)
            await scenario(browser, {"width":1440,"height":900}, reduced=True)
            async with p.request.new_context() as request:
                response = await request.get(SITE+"app.js",timeout=30000)
                assert response.ok, "Live Galaxy JavaScript asset missing"
                deployed = await response.body()
                expected = (ROOT/"app.js").read_bytes()
                assert deployed == expected, "Hosted frontend diverges from audited P42 main"
                local = expected.decode("utf-8")
                key_match = re.search(r"const SB_PUBLISHABLE_KEY='(sb_publishable_[^']+)'",local)
                assert key_match, "Expected a public key only"
                headers = {"apikey":key_match.group(1),"Content-Type":"application/json"}
                for rpc in ("galaxy_my_platform_role","galaxy_platform_summary",
                            "galaxy_platform_accounts","galaxy_platform_pending"):
                    args={"p_limit":1,"p_offset":0} if rpc=="galaxy_platform_accounts" else {}
                    denied = await request.post(SUPABASE+"/rest/v1/rpc/"+rpc,
                                                headers=headers, data=args,timeout=20000)
                    assert denied.status in (401,403), "Guest unexpectedly invoked "+rpc+":" + str(denied.status)
                    print("PASS unauthenticated server denial",rpc,denied.status)
            print("PASS hosted P42 asset parity, auth modal, mobile, accessibility and 4 anonymous denials")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
