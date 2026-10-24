"""Protected, real hosted P37 signed-in Playwright acceptance.

Uses ONLY two owner-provided, dedicated Galaxy test logins from GitHub dev secrets.
Never uses service_role, real customers, paid model calls or screenshot artifacts.
Normal Galaxy sign-in may create a Galaxy-only signup_approvals request.
"""
import asyncio
import os
from playwright.async_api import async_playwright

SITE = "https://gengalaxy1429841605.z29.web.core.windows.net/"
EXPECTED_LIMITS = {"FREE": 5, "PLUS": 10, "PRO": 20}

def require(condition, explanation):
    if not condition:
        raise AssertionError(explanation)

async def sign_in(browser, email, password, viewport, is_mobile=False):
    context = await browser.new_context(
        viewport=viewport, is_mobile=is_mobile, has_touch=is_mobile,
        permissions=[], accept_downloads=False
    )
    page = await context.new_page()
    page_errors = []
    page.on("pageerror", lambda error: page_errors.append(type(error).__name__))
    await page.goto(SITE, wait_until="domcontentloaded", timeout=40000)
    await page.locator("#entry-login").click(timeout=20000)
    await page.locator("#auth-email").fill(email)
    await page.locator("#auth-password").fill(password)
    await page.locator("#auth-submit").click()
    await page.wait_for_function(
        "() => typeof state !== 'undefined' && !state.isGuest && Boolean(state.user?.id)",
        timeout=35000
    )
    await page.wait_for_function(
        "() => state.planInfo && Number.isFinite(state.planInfo.daily_eval_limit)",
        timeout=20000
    )
    result = await page.evaluate("""async () => {
      const userId=state.user?.id;
      const info=state.planInfo;
      const planCode=info?.plan_code;
      const lifecycle=await state.client.rpc('galaxy_my_plan_lifecycle');
      const approval=await state.client.rpc('galaxy_account_approval');
      const adminRpcs=['galaxy_platform_summary','galaxy_platform_pending',
                       'galaxy_platform_accounts','galaxy_platform_audit'];
      const denied=[];
      for(const rpc of adminRpcs){
        const args=rpc==='galaxy_platform_accounts'?{p_limit:1,p_offset:0}:{};
        const r=await state.client.rpc(rpc,args);
        denied.push(Boolean(r.error)&&!r.data);
      }
      return {userId,planCode,limit:info.daily_eval_limit,
              lifecycleOK:!lifecycle.error,approvalOK:!approval.error,
              approvalRequired:approval.data?.approval_required,
              adminUI:state.platformAuthorized,
              adminNavHidden:document.getElementById('platform-nav').hidden,
              denied};
    }""")
    require(result["userId"], "User identity missing after login")
    require(result["planCode"] in EXPECTED_LIMITS, "Unknown server-returned plan")
    require(result["limit"] == EXPECTED_LIMITS[result["planCode"]],
            "Server daily plan limit differs from FREE/PLUS/PRO contract")
    require(result["lifecycleOK"], "Own lifecycle RPC failed")
    require(result["approvalOK"], "Own approval status RPC failed")
    require(result["approvalRequired"] is False,
            "Approval enforcement unexpectedly enabled")
    require(not result["adminUI"] and result["adminNavHidden"],
            "Ordinary test learner unexpectedly has admin UI")
    require(all(result["denied"]), "A privileged Galaxy RPC returned user data")
    await page.locator('[data-view="plans"]').click()
    await page.locator("#root").get_by_text("Current entitlement:").wait_for(timeout=10000)
    require(result["planCode"] in await page.locator("#root").inner_text(),
            "Signed-in plan page does not display server entitlement")
    require(not page_errors, "Page JavaScript errors during signed-in acceptance")
    return context, page, result["userId"]

async def main():
    keys=("GALAXY_TEST_A_EMAIL","GALAXY_TEST_A_PASSWORD",
          "GALAXY_TEST_B_EMAIL","GALAXY_TEST_B_PASSWORD")
    missing=[key for key in keys if not os.getenv(key)]
    require(not missing, "Dedicated Galaxy test credentials not configured in protected dev environment")
    require(os.getenv("GALAXY_AUTH_TEST_SITE",SITE)==SITE,
            "Refusing to test a different website")
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,
            args=["--no-sandbox","--disable-dev-shm-usage"])
        a_context=None
        b_context=None
        mobile_context=None
        try:
            a_context, a_page, a_id = await sign_in(
                browser,os.environ[keys[0]],os.environ[keys[1]],
                {"width":1440,"height":900}
            )
            print("PASS: dedicated Galaxy learner A desktop sign-in, plan, approval status and negative admin RPCs")
            b_context, b_page, b_id = await sign_in(
                browser,os.environ[keys[2]],os.environ[keys[3]],
                {"width":1440,"height":900}
            )
            require(a_id!=b_id, "Test credentials resolve to the same account")
            cross=await a_page.evaluate("""async otherUserId => {
              const response=await state.client.from('genai_study_progress')
                .select('user_id').eq('user_id',otherUserId).limit(1);
              return {error:!!response.error,rows:response.data?.length};
            }""",b_id)
            require(not cross["error"] and cross["rows"]==0,
                    "Learner A could read learner B progress")
            print("PASS: independent learner B sign-in, isolation of existing progress, negative admin RPCs")
            mobile_context, mobile_page, mobile_id = await sign_in(
                browser,os.environ[keys[0]],os.environ[keys[1]],
                {"width":390,"height":844},is_mobile=True
            )
            require(mobile_id==a_id, "Mobile learner login identity mismatch")
            print("PASS: hosted mobile signed-in account and subscription navigation")
            print("NOTE: admin approval, paid plan changes, live quota consumption and password recovery are NOT tested")
            print("NOTE: login can submit Galaxy-only access requests; no public screenshots or paid AI calls")
        finally:
            for context in (mobile_context,b_context,a_context):
                if context:
                    await context.close()
            await browser.close()

if __name__=="__main__":
    asyncio.run(main())
