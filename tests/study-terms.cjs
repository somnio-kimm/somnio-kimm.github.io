// Definition bubbles on [text]{.term key="..."} annotations in the study notes.
// The notes are drafts, so run this against a site rendered with `draft-mode: visible`.
const {assert, origin, run, inBothThemes, fitsViewport} = require("./helpers.cjs");

const url = `${origin}/notes/study-notes/machine-learning/neural-network.html`;

run(async ({each, noScript}) => {
  await each("definition-only bubbles, hover/focus or touch, dismissal, layout, print", async (page, width) => {
    await page.goto(url, { waitUntil: "networkidle" });
    const root = page.locator("main .study-term").first();
    const trigger = root.locator(".study-term-label");
    const panel = root.locator(".study-term-definition");
    await trigger.scrollIntoViewIfNeeded();
    assert.equal(await trigger.evaluate(el => el.tagName), "BUTTON");
    assert.equal(await panel.isVisible(), false);
    assert.equal(await page.locator("main .study-term-definition a").count(), 0, "definitions contain no navigation links");
    assert.equal(await panel.locator(".study-term-text").textContent().then(text => text.trim().length > 0), true);

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
      assert.equal(await root.locator(".study-term-close").evaluate(el => el === document.activeElement), true, "Tab reaches the close button");
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
    await inBothThemes(page, async () => {
      const geometry = await panel.boundingBox();
      assert(geometry.x >= 0 && geometry.x + geometry.width <= width, "bubble stays within the viewport");
      assert(geometry.y >= 0 && geometry.y + geometry.height <= 900);
      assert(await fitsViewport(page));
    });
    await page.mouse.click(2, 2);
    assert.equal(await panel.isVisible(), false, "outside pointer action dismisses it");
    await trigger.click();
    await root.locator(".study-term-close").click();
    assert.equal(await panel.isVisible(), false, "explicit close button dismisses it");

    // Printing includes definitions even after JavaScript has hidden the bubbles.
    await page.emulateMedia({ media: "print" });
    // The print layout can take a moment to apply on a busy machine.
    await panel.waitFor({ state: "visible", timeout: 2000 }).catch(() => {});
    assert.equal(await panel.isVisible(), true, "print retains the short definitions");

    // Definitions in another subject are also text-only; ordinary note links remain.
    await page.emulateMedia({ media: "screen" });
    await page.goto(`${origin}/notes/study-notes/mathematics/probability.html`, { waitUntil: "networkidle" });
    const crossSubject = page.locator('main .study-term[data-term="latent-variable"]');
    await crossSubject.locator(".study-term-label").click();
    assert.equal(await crossSubject.locator(".study-term-definition").isVisible(), true);
    assert.equal(await page.locator("main .study-term-definition a").count(), 0);
    assert.ok(await page.locator('main a[href*="autoencoders.html#conditioning"]').count() > 0, "named links in the explanation remain");
  });

  await noScript("readable definitions without navigation links", async page => {
    await page.goto(url);
    assert.equal(await page.locator("main .study-term-definition").first().isVisible(), true);
    assert.equal(await page.locator("main button.study-term-label").count(), 0);
    assert.equal(await page.locator("main .study-term-definition a").count(), 0);
  });
});
