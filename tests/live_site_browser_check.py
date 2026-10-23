"""Read-only acceptance of the LIVE public Galaxy website; guest mode only."""
import asyncio
import json
from hashlib import sha256
from pathlib import Path
from playwright.async_api import async_playwright

SITE = "https://gengalaxy1429841605.z29.web.core.windows.net/"
ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ASSETS = (
    "index.html", "styles.css", "app.js", "runtime-config.js",
    "data/curriculum.json", "data/lessons.json",
    "speech/azure-speech-adapter.js",
)
APPROVED_EVALUATOR = (
    "https://gengalaxy-p3-1429841605.azurewebsites.net/api/practice/evaluate"
)
EVAL_DEFAULT = "window.GALAXY_EVALUATOR_URL='';"
EVAL_APPROVED = "window.GALAXY_EVALUATOR_URL='" + APPROVED_EVALUATOR + "';"


def verify_public_asset(path, downloaded, local):
    """Exact release bytes; one documented exception for approved runtime URL.

    The protected deployment injects ONLY the evaluator URL into a staged copy.
    Replacing that one expected string is the only permitted difference.
    Model keys, payment SDKs and extra backend URLs are never allowed.
    """
    if path == "runtime-config.js":
        local_text = local.decode("utf-8")
        hosted_text = downloaded.decode("utf-8")
        assert local_text.count(EVAL_DEFAULT) == 1, "Unexpected runtime configuration source"
        expected = local_text.replace(EVAL_DEFAULT, EVAL_APPROVED)
        assert hosted_text == expected, (
            "Hosted evaluator URL, disabled Vault/Speech settings or "
            "other runtime config differs from approved AI_READY staging"
        )
        assert "window.GALAXY_VAULT_EXTRACT_URL='';" in hosted_text
        assert "window.GALAXY_SPEECH_BROKER_URL='';" in hosted_text
    else:
        assert sha256(downloaded).digest() == sha256(local).digest(), (
            f"{path}: hosted bytes differ from checked-out main; "
            "deploy this reviewed commit before claiming live acceptance"
        )


async def inspect(viewport, reduced=False):
    errors = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=True, timeout=45000,
            args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = await browser.new_page(viewport=viewport, locale="en-IN")
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        if reduced:
            await page.emulate_media(reduced_motion="reduce")

        response = await page.goto(SITE, wait_until="domcontentloaded", timeout=45000)
        assert response is not None and response.status == 200
        await page.wait_for_selector(".planet-node", timeout=20000)
        count = await page.locator(".planet-node").count()
        assert count == 17, f"Expected 17 planets, got {count}"

        # HTTP 200 does not prove GitHub main was deployed. Check the exact bytes
        # of every allowlisted static asset against the checked-out release SHA.
        hosted_curriculum = None
        hosted_lessons = None
        for path in PUBLIC_ASSETS:
            asset = await page.request.get(SITE + path, timeout=20000)
            assert asset.status == 200, f"{path}: HTTP {asset.status}"
            downloaded = await asset.body()
            local = (ROOT / path).read_bytes()
            verify_public_asset(path, downloaded, local)
            if path == "data/curriculum.json":
                hosted_curriculum = json.loads(downloaded)
            elif path == "data/lessons.json":
                hosted_lessons = json.loads(downloaded)
        assert len(hosted_curriculum) == 17
        assert len(hosted_lessons) == 245
        mapped = sum(
            item["title"] in hosted_lessons
            for chapter in hosted_curriculum
            for group in chapter["groups"]
            for item in group["items"]
        )
        assert mapped == 246, f"Hosted curriculum covers {mapped}/246 topics"

        if reduced:
            assert await page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
            assert not await page.locator("#motion-toggle").is_checked()

        await page.locator('[data-chapter="3"]').click(force=True)
        assert await page.locator("#chapter-panel h2").inner_text() == "LangChain & LangGraph"
        await page.locator("#open-next").click(force=True)
        assert await page.locator(".content-block").count() == 8

        await page.locator("#practice-this").click(force=True)
        assert await page.locator("#spoken-answer").count() == 1
        assert await page.locator("[data-choice]").count() == 0
        await page.locator("#spoken-answer").fill(
            "LangGraph manages nodes, conditional edges, and shared state. "
            "A router selects the next tool or agent after checks, and each "
            "step can update state while authorization stays on the backend.")
        await page.locator("#evaluate-btn").click(force=True)
        await page.wait_for_selector(".score-panel", timeout=10000)
        assert "NOT A FACTUAL GRADE" in await page.locator(".score-panel").inner_text()
        assert await page.locator("#sidebar-mastered").inner_text() == "0"

        await page.locator('[data-view="vault"]').first.click(force=True)
        assert "Sign in" in await page.locator("#root").inner_text()
        assert not errors, f"Frontend JavaScript errors: {errors}"
        print("LIVE PASS", viewport, "reduced_motion", reduced, "planets", count)
        await browser.close()


async def main():
    await inspect({"width": 1440, "height": 900})
    await inspect({"width": 390, "height": 844})
    await inspect({"width": 1440, "height": 900}, reduced=True)


if __name__ == "__main__":
    asyncio.run(main())
