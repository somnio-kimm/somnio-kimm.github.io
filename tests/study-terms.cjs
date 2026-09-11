// Run against a rendered site served over HTTP:
// NODE_PATH=/path/to/node_modules node tests/study-terms.cjs http://127.0.0.1:8765
// Requires playwright-core and a Chromium browser; set PLAYWRIGHT_CHROMIUM_EXECUTABLE
// when the browser is not in Playwright's default cache.
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");

(async () => {
  const origin = process.argv[2] || "http://127.0.0.1:8765";
  const url = `${origin}/notes/study-notes/machine-learning/neural-network.html`;
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    headless: true,
  });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 }, hasTouch: width === 390,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(url, { waitUntil: "networkidle" });
      const root = page.locator("main .study-term").first();
      const trigger = root.locator(".study-term-label");
      const panel = root.locator(".study-term-definition");
      await trigger.scrollIntoViewIfNeeded();
      assert.equal(await trigger.evaluate(el => el.tagName), "BUTTON");
      assert.equal(await panel.isVisible(), false);

      if (width === 1440) {
        await trigger.hover();
        assert.equal(await panel.isVisible(), true, "hover opens the definition");
        await panel.hover();
        await page.waitForTimeout(300);
        assert.equal(await panel.isVisible(), true, "the bubble is hoverable");
        await page.keyboard.press("Escape");
        assert.equal(await panel.isVisible(), false, "Escape dismisses hover content");
        await page.mouse.move(0, 0);
        await trigger.focus();
        assert.equal(await panel.isVisible(), true, "keyboard focus opens the definition");
        await page.keyboard.press("Tab");
        assert.equal(await root.locator(".study-term-more").evaluate(el => el === document.activeElement), true);
        await page.keyboard.press("Escape");
        assert.equal(await panel.isVisible(), false);
        assert.equal(await trigger.evaluate(el => el === document.activeElement), true, "Escape returns focus from the bubble");
        await trigger.press("Enter");
        assert.equal(await panel.isVisible(), true);
        await trigger.press("Enter");
        assert.equal(await panel.isVisible(), false, "activation toggles a pinned definition");
      } else {
        await trigger.tap();
        assert.equal(await panel.isVisible(), true, "tap opens the definition");
        await trigger.tap();
        assert.equal(await panel.isVisible(), false, "a second tap closes it");
      }

      await trigger.click();
      assert.equal(await panel.isVisible(), true);
      for (const dark of [false, true]) {
        await page.evaluate(isDark => {
          document.body.classList.toggle("quarto-dark", isDark);
          document.body.classList.toggle("quarto-light", !isDark);
        }, dark);
        const geometry = await panel.boundingBox();
        assert(geometry.x >= 0 && geometry.x + geometry.width <= width, "bubble stays within the viewport");
        assert(geometry.y >= 0 && geometry.y + geometry.height <= 900);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      }
      await page.mouse.click(2, 2);
      assert.equal(await panel.isVisible(), false, "outside pointer action dismisses it");
      await trigger.click();
      await root.locator(".study-term-close").click();
      assert.equal(await panel.isVisible(), false, "explicit close button dismisses it");
      await trigger.press("Enter");
      await root.locator(".study-term-more").click();
      assert.equal(new URL(page.url()).hash, "#feedforward-neural-network");

      // Printing includes definitions even after JavaScript has hidden the bubbles.
      await page.emulateMedia({ media: "print" });
      assert.equal(await panel.isVisible(), true, "print retains the short definitions");

      // A definition in Mathematics must also link correctly to an ML note.
      await page.emulateMedia({ media: "screen" });
      await page.goto(`${origin}/notes/study-notes/mathematics/probability.html`, { waitUntil: "networkidle" });
      const crossSubject = page.locator('main .study-term[data-term="latent-variable"]');
      await crossSubject.locator(".study-term-label").click();
      await crossSubject.locator(".study-term-more").click();
      assert.equal(new URL(page.url()).pathname, "/notes/study-notes/machine-learning/autoencoders.html");
      assert.equal(new URL(page.url()).hash, "#vae");
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${width}px: hover/focus or touch, dismissal, links, layout, print`);
    }

    const fallback = await browser.newContext({ javaScriptEnabled: false });
    const page = await fallback.newPage();
    await page.goto(url);
    assert.equal(await page.locator("main .study-term-definition").first().isVisible(), true);
    assert.equal(await page.locator("main button.study-term-label").count(), 0);
    assert.equal(await page.locator("main .study-term-more").first().isVisible(), true);
    await fallback.close();
    console.log("PASS no JavaScript: readable definitions and ordinary links");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
