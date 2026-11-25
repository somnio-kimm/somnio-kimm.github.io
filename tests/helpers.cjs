// Shared setup for the browser tests. Render the site, serve _site over HTTP, then:
//   node tests/glossary.cjs [origin]
//   node tests/study-terms.cjs [origin]
// Draft notes are only reachable in a site rendered with `draft-mode: visible`
// (study-terms.cjs needs that; glossary.cjs runs against either render).
// Requires playwright-core (set NODE_PATH if it is installed elsewhere) and Chromium
// (set PLAYWRIGHT_CHROMIUM_EXECUTABLE if it is outside Playwright's default cache).
const assert = require("node:assert/strict");
const { chromium } = require("playwright-core");

const origin = process.argv.slice(2).find(arg => !arg.startsWith("--")) || "http://127.0.0.1:8765";
const widths = [1440, 390]; // desktop, and a phone with touch

// Runs `tests({each, noScript})` in one browser and sets the exit code on failure.
//   each(label, fn)  calls fn(page, width) at every width and fails on page errors
//   noScript(label, fn)  calls fn(page) with JavaScript disabled
function run(tests) {
  (async () => {
    const browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      headless: true,
    });
    try {
      await tests({
        async each(label, fn) {
          for (const width of widths) {
            const context = await browser.newContext({viewport: {width, height: 900}, hasTouch: width === 390});
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", error => errors.push(error.message));
            await fn(page, width);
            assert.deepEqual(errors, [], `the page reported errors: ${errors.join(" | ")}`);
            await context.close();
            console.log(`PASS ${width}px: ${label}`);
          }
        },
        async noScript(label, fn) {
          const context = await browser.newContext({javaScriptEnabled: false});
          await fn(await context.newPage());
          await context.close();
          console.log(`PASS no JavaScript: ${label}`);
        },
      });
    } finally {
      await browser.close();
    }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}

const fitsViewport = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

module.exports = {assert, origin, run, fitsViewport};
