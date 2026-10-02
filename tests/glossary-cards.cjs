// Same Playwright setup as study-terms.cjs. Pass origin and optionally --drafts.
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");

(async () => {
  const origin = process.argv[2] || "http://127.0.0.1:8765";
  const url = `${origin}/notes/study-notes/glossary.html`;
  const drafts = process.argv.includes("--drafts");
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    headless: true,
  });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({viewport: {width, height: 900}, hasTouch: width === 390});
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(url, {waitUntil: "networkidle"});
      const cards = page.locator(".glossary-card");
      const total = await cards.count();
      assert(total >= 66);
      const labels = await page.locator(".glossary-card-title").allTextContents();
      assert.deepEqual(labels, [...labels].sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1));
      assert.equal(await page.locator(".glossary-definition[open]").count(), total);
      const sidebar = page.locator("#quarto-sidebar");
      assert(!(await sidebar.textContent()).includes("All study notes"));
      const subjectLinks = sidebar.locator('a[href*="?tag="]');
      assert.equal(await subjectLinks.count(), 6);
      assert((await subjectLinks.evaluateAll(items => items.map(el => el.href)))
        .every(href => new URL(href).pathname.endsWith("/glossary.html")));

      await page.locator('[data-letter="L"]').click();
      const lCards = await page.locator(".glossary-card:visible .glossary-card-title").allTextContents();
      assert(lCards.length > 0 && lCards.every(label => label.toUpperCase().startsWith("L")));
      assert.equal(new URL(page.url()).searchParams.get("letter"), "L");
      if (width === 390) await page.locator(".glossary-tag-picker summary").click();
      await page.locator('[data-filter="mathematics"]').click();
      const combined = await page.locator(".glossary-card:visible").evaluateAll(items => items.map(el => ({
        title: el.querySelector(".glossary-card-title").textContent,
        tags: JSON.parse(el.dataset.tags),
      })));
      assert(combined.length > 0 && combined.every(item => item.title.startsWith("L") && item.tags.includes("mathematics")));
      await page.reload({waitUntil: "networkidle"});
      assert.equal(await page.locator('[data-letter="L"]').getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator('[data-filter="mathematics"]').getAttribute("aria-pressed"), "true");
      await page.locator(".glossary-reset").click();
      assert.equal(await page.locator(".glossary-card:visible").count(), total);
      const missingLetter = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].find(letter => !labels.some(label => label.toUpperCase().startsWith(letter)));
      if (missingLetter) assert.equal(await page.locator(`[data-letter="${missingLetter}"]`).isDisabled(), true);

      {
        const hardwareCount = await cards.evaluateAll(items => items.filter(el => JSON.parse(el.dataset.tags).includes("computer-hardware")).length);
        if (width === 390) await page.getByRole("button", {name: "Toggle sidebar navigation"}).click();
        await sidebar.locator('a[href*="tag=computer-hardware"]').click();
        await page.waitForURL("**/glossary.html?tag=computer-hardware", {waitUntil: "networkidle"});
        assert.equal(await page.locator(".glossary-card:visible").count(), hardwareCount);
        assert.equal(await page.locator(".glossary-empty").isVisible(), hardwareCount === 0);
        assert.equal(await sidebar.locator('a[href*="tag=computer-hardware"]').getAttribute("aria-current"), "page");
        if (width === 390) await page.getByRole("button", {name: "Toggle sidebar navigation"}).click();
        await sidebar.getByText("All terms A–Z", {exact: true}).click();
        await page.waitForURL("**/glossary.html", {waitUntil: "networkidle"});
        assert.equal(await page.locator(".glossary-card:visible").count(), total);
      }

      if (width === 390) await page.locator(".glossary-tag-picker summary").click();
      await page.locator('[data-filter="robotics"]').click();
      assert(await page.locator(".glossary-card:visible").count() < total);
      await page.locator(".glossary-reset").click();
      if (width === 390) await page.locator(".glossary-tag-picker summary").click();

      await page.locator("#glossary-practice").check();
      assert.equal(await page.locator(".glossary-definition[open]").count(), 0);
      await cards.first().locator("summary").press("Enter");
      assert.equal(await cards.first().locator(".glossary-definition p").isVisible(), true);
      await page.locator("#glossary-search").fill("LATENT variable");
      assert.equal(await page.locator("#term-latent-variable").isVisible(), true);
      await page.locator("#glossary-search").fill("zzzz-no-such-term");
      assert.equal(await page.locator(".glossary-empty").isVisible(), true);
      await page.locator(".glossary-reset").click();
      assert.equal(await page.locator(".glossary-card:visible").count(), total);

      await page.locator('#term-latent-variable [data-tag="mathematics"]').click();
      const visible = await page.locator(".glossary-card:visible").evaluateAll(items => items.map(el => JSON.parse(el.dataset.tags)));
      assert(visible.length > 1 && visible.length < total);
      assert(visible.every(tags => tags.includes("mathematics")));
      assert(new URL(page.url()).searchParams.get("tag") === "mathematics");
      await page.reload({waitUntil: "networkidle"});
      assert.equal(await page.locator('[data-filter="mathematics"]').getAttribute("aria-pressed"), "true");
      await page.goto(`${url}?tag=robotics#term-latent-variable`, {waitUntil: "networkidle"});
      assert.equal(await page.locator("#term-latent-variable").isVisible(), true);
      assert.equal(await page.locator("#term-latent-variable details").getAttribute("open"), "");

      await page.locator(".glossary-reset").click();
      if (drafts) {
        const link = page.locator('#term-parameterised-function .glossary-related a[href$="neural-network.html"]');
        assert.equal(await link.count(), 1);
        await link.click();
        await page.waitForURL("**/neural-network.html", {waitUntil: "networkidle"});
        assert(await page.locator("main .study-term").count() > 0);
        await page.goBack({waitUntil: "networkidle"});
      } else {
        assert.equal(await page.locator(".glossary-draft").count(), 0);
        assert.equal(await page.locator('.glossary-related a[href$="neural-network.html"]').count(), 0);
      }
      for (const dark of [false, true]) {
        await page.evaluate(value => {
          document.body.classList.toggle("quarto-dark", value);
          document.body.classList.toggle("quarto-light", !value);
        }, dark);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "no horizontal overflow");
      }
      await page.screenshot({path: `/private/tmp/glossary-cards-${drafts ? "preview" : "production"}-${width}.png`, fullPage: false});
      await page.locator("#glossary-practice").check();
      await page.locator("#glossary-search").fill("latent");
      await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
      await page.emulateMedia({media: "print"});
      assert.equal(await page.locator(".glossary-card:visible").count(), total);
      assert.equal(await page.locator(".glossary-definition[open]").count(), total);
      await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
      assert.equal(await page.locator(".glossary-definition[open]").count(), 0);
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${width}px: glossary sidebar, A–Z + tags, practice, search, deep links, layout, print`);
    }
    const fallback = await browser.newContext({javaScriptEnabled: false});
    const page = await fallback.newPage();
    await page.goto(url);
    assert.equal(await page.locator(".glossary-controls").isVisible(), false);
    assert(await page.locator(".glossary-definition[open]").count() >= 66);
    assert.equal(await page.locator(".glossary-definition p").first().isVisible(), true);
    await fallback.close();
    console.log("PASS no JavaScript: cards and definitions remain readable");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
