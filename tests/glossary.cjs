// The glossary page: every study card (terms, formal definitions, results and
// proofs) in one deck with search, filters and flashcard study in a popup.
const {assert, origin, run, inBothThemes, fitsViewport} = require("./helpers.cjs");

const url = `${origin}/notes/study-notes/glossary.html`;
const visibleCards = page => page.locator(".deck-card:visible");
const openLayers = page => page.locator(".deck-card details[open]");
const status = page => page.locator(".deck-study-status").textContent();

// A filter lives in a dropdown menu of the bar above the cards.
// `inMenu` opens the menu that holds `selector`, runs `action` on that element, and closes the menu.
async function inMenu(page, selector, action) {
  const menu = page.locator(`.deck-menu:has(${selector})`);
  if (await menu.evaluate(el => !el.open)) await menu.locator("summary").click();
  await action(menu.locator(selector));
  await menu.evaluate(el => { el.open = false; });
}
// Clicks one row of a filter ("tag" = subject; "" = its "All" row).
const pick = (page, key, value) => inMenu(page, `[data-facet="${key}"] button[data-value="${value}"]`, row => row.click());
// The Study button opens the flashcard popup with the cards that are shown.
const study = page => page.locator(".deck-study-open").click();

async function listChecks(page, width) {
  await page.goto(url, {waitUntil: "networkidle"});
  const cards = page.locator(".deck-card");
  const total = await cards.count();
  const layers = await page.locator(".deck-card details").count();
  const formal = await page.locator(".deck-card details[data-collapsed]").count();
  assert(total >= 72);
  assert.equal(await page.locator(".deck-bar").isVisible(), true);
  const labels = await page.locator(".deck-card-title").allTextContents();
  assert.deepEqual(labels, [...labels].sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1));
  const taggedWith = tag => cards.evaluateAll((items, name) => items.filter(el => el.dataset.tag.split(" ").includes(name)).length, tag);

  // Definitions start open; statements and proofs start closed.
  assert(formal > 0);
  assert.equal(await openLayers(page).count(), layers - formal);
  // The list has no "hide answers" switch: hiding answers is what the Study popup is for.
  assert.equal(await page.locator(".deck-controls input[type=checkbox]").count(), 0);

  // A subject tag on a card is a small pill, clearly smaller than the card's title.
  const sizes = await page.locator(".deck-card").first().evaluate(card => ["h2", ".deck-tag"].map(part => {
    const el = card.querySelector(part);
    return {font: parseFloat(getComputedStyle(el).fontSize), height: el.getBoundingClientRect().height};
  }));
  assert(sizes[1].font <= 0.7 * sizes[0].font && sizes[1].height < sizes[0].height, `tag ${JSON.stringify(sizes[1])} is not clearly smaller than title ${JSON.stringify(sizes[0])}`);

  // One concept is one card: the term and its formal definition are layers of it.
  const convex = page.locator("#term-convex-function");
  assert.deepEqual(await convex.locator("summary").allTextContents(), ["Definition", "Statement"]);
  // Equations stay in Quarto's normal math pipeline.
  await page.waitForFunction(() => document.querySelector(".deck-card mjx-container"));
  assert(await cards.locator("mjx-container").count() > 10);
  // A proof always comes with the statement it proves.
  const proofs = await page.locator(".deck-card:has(.concept-proof)").count();
  assert(proofs > 0);
  assert.equal(await page.locator(".deck-card:has(.concept-proof):has(.concept-statement)").count(), proofs);
  // Statement and proof open separately, and the open card takes the whole row.
  const result = page.locator("#term-absolute-value-subdifferential");
  const narrow = (await result.boundingBox()).width;
  await result.locator(".concept-statement summary").click();
  assert.equal(await result.locator(".concept-proof details[open]").count(), 0);
  await result.locator(".concept-proof summary").press("Enter");
  assert.equal(await result.locator(".concept-proof details[open]").count(), 1);
  if (width === 1440) assert((await result.boundingBox()).width > narrow, "an open formal card spans the row");

  // Search covers every layer, including closed proofs. The controls show no
  // count of cards and no "Clear filters": emptying the box brings every card back.
  assert.equal(await page.locator(".deck-controls").getByText(/\d+ of \d+ cards|Clear filters/).count(), 0);
  await page.locator(".deck-search").fill("LATENT variable");
  assert.equal(await page.locator("#term-latent-variable").isVisible(), true);
  assert.equal(await page.locator(".deck-controls").getByText(/\d+ of \d+ cards|Clear filters/).count(), 0);
  await page.locator(".deck-search").fill("factorisation");
  assert.equal(await page.locator("#term-linearity-expectation").isVisible(), true);
  assert(await visibleCards(page).count() < total);
  await page.locator(".deck-search").fill("zzzz-no-such-card");
  assert.equal(await page.locator(".deck-empty").isVisible(), true);
  await page.locator(".deck-search").fill("");
  assert.equal(await visibleCards(page).count(), total);

  // The subject filter lives in the URL and survives a reload.
  const tagsShown = () => visibleCards(page).evaluateAll(items => items.map(el => el.dataset.tag.split(" ")));
  await pick(page, "tag", "robotics");
  const robotics = await tagsShown();
  assert(robotics.length > 0 && robotics.every(tags => tags.includes("robotics")));
  assert.equal(new URL(page.url()).searchParams.get("tag"), "robotics");
  await page.reload({waitUntil: "networkidle"});
  assert.equal(await page.locator('[data-facet="tag"] [data-value="robotics"]').getAttribute("aria-pressed"), "true");
  assert.equal(await visibleCards(page).count(), robotics.length);
  // Several subjects can be on at once; a card needs any one of them.
  await pick(page, "tag", "physics");
  const both = await tagsShown();
  assert(both.length > robotics.length && both.every(tags => tags.includes("robotics") || tags.includes("physics")));
  assert.deepEqual(new URL(page.url()).searchParams.get("tag").split(",").sort(), ["physics", "robotics"]);
  await pick(page, "tag", "robotics");
  assert((await tagsShown()).every(tags => tags.includes("physics")));
  await pick(page, "tag", "");
  assert.equal(new URL(page.url()).searchParams.get("tag"), null);
  assert.equal(await visibleCards(page).count(), total);

  // The page has no sidebar: search, Subject and Study are one row above the
  // cards, two cards to a row on a wide screen and one on a phone.
  const wide = width === 1440;
  assert.equal(await page.locator("#quarto-sidebar, .quarto-secondary-nav").count(), 0);
  const columns = new Set(await visibleCards(page).evaluateAll(items => items.slice(0, 6).map(el => Math.round(el.getBoundingClientRect().left))));
  assert.equal(columns.size, wide ? 2 : 1);
  // The page is as wide as the site's other pages, such as Background.
  if (wide) {
    const box = () => page.locator("main").evaluate(el => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; });
    const here = await box();
    await page.goto(`${origin}/background.html`, {waitUntil: "networkidle"});
    assert.deepEqual(here, await box());
    await page.goto(url, {waitUntil: "networkidle"});
  }
  // The search box, the Subject button and the Study button are equally tall.
  const heights = await page.locator(".deck-search, .deck-menu > summary, .deck-study-open").evaluateAll(items => items.map(el => Math.round(el.getBoundingClientRect().height)));
  assert.equal(heights.length, 3);
  assert.equal(new Set(heights).size, 1, `search box and buttons differ in height: ${heights}`);
  // The Subject button shows how many subjects are chosen, and each row its number of cards.
  const subject = page.locator('.deck-menu:has([data-facet="tag"])');
  const badge = page.locator('[data-facet-count="tag"]');
  const chips = page.locator(".deck-token");
  const searchWidth = () => page.locator(".deck-search").evaluate(el => Math.round(el.getBoundingClientRect().width));
  const unfiltered = await searchWidth();
  assert.equal(await badge.isVisible(), false);
  assert.equal(await chips.count(), 0);
  assert.equal(await subject.locator('[data-value=""] .deck-n').textContent(), String(total));
  assert.equal(await subject.locator('[data-value="physics"] .deck-n').textContent(), String(await taggedWith("physics")));
  // The menu stays open while rows are picked, and its panel stays on screen.
  await subject.locator("summary").click();
  await subject.locator('[data-value="physics"]').click();
  await subject.locator('[data-value="robotics"]').click();
  assert.equal(await subject.evaluate(el => el.open), true);
  assert.equal(await badge.textContent(), "2");
  assert.equal(await badge.isVisible(), true);
  // Choosing subjects never changes the length of the search box.
  assert.equal(await searchWidth(), unfiltered);
  // Each chosen subject is a chip under the row; its × takes that subject off.
  assert.deepEqual(await chips.evaluateAll(items => items.map(el => el.firstChild.textContent)), ["Physics", "Robotics"]);
  // A chip is as small as a subject on a card.
  const look = selector => page.locator(selector).first().evaluate(el => {
    const style = getComputedStyle(el);
    return [style.fontSize, style.backgroundColor, style.borderRadius];
  });
  assert.deepEqual(await look(".deck-token"), await look(".deck-card:not([hidden]) .deck-tag"));
  // The chips stay on one line, which scrolls sideways when they do not fit: with
  // every subject chosen the line is no taller than with two.
  const chipLine = () => page.locator(".deck-picked").evaluate(row => ({
    height: Math.round(row.getBoundingClientRect().height),
    overflow: getComputedStyle(row).overflowX,
    lines: new Set([...row.children].map(chip => Math.round(chip.getBoundingClientRect().top))).size,
    inside: row.getBoundingClientRect().right <= document.documentElement.clientWidth,
  }));
  const two = await chipLine();
  for (const value of ["computer-software", "machine-learning", "mathematics"]) await subject.locator(`[data-value="${value}"]`).click();
  assert.deepEqual(await chipLine(), {height: two.height, overflow: "auto", lines: 1, inside: true});
  assert.equal(await chips.count(), 5);
  for (const value of ["computer-software", "machine-learning", "mathematics"]) await subject.locator(`[data-value="${value}"]`).click();
  assert.equal(await chips.count(), 2);
  const panel = await subject.locator(".deck-menu-panel").boundingBox();
  assert(panel.x >= 0 && panel.x + panel.width <= width, "the open menu fits the screen");
  // Escape closes the menu; so does a click outside it.
  await page.keyboard.press("Escape");
  assert.equal(await subject.evaluate(el => el.open), false);
  await subject.locator("summary").click();
  assert.equal(await subject.evaluate(el => el.open), true);
  await page.locator(".deck-search").click();
  assert.equal(await subject.evaluate(el => el.open), false);
  await chips.first().locator("button").click();
  assert.equal(new URL(page.url()).searchParams.get("tag"), "robotics");
  assert.equal(await badge.textContent(), "1");
  assert.equal(await searchWidth(), unfiltered);
  // "All" in the menu takes every subject off; with no chips their line is gone.
  await pick(page, "tag", "");
  assert.equal(await chips.count(), 0);
  assert.equal(await page.locator(".deck-picked").isVisible(), false);
  assert.equal(await badge.isVisible(), false);
  // A tag on a card filters the whole deck.
  await page.locator('#term-latent-variable .deck-tag[data-value="mathematics"]').click();
  assert.equal(await visibleCards(page).count(), await taggedWith("mathematics"));
  assert.equal(new URL(page.url()).searchParams.get("tag"), "mathematics");

  // A link to a card opens it in the popup with every layer open, also when the filter hides that card.
  const popup = page.locator("dialog.deck-study");
  for (const link of ["?tag=robotics#term-latent-variable", "?tag=physics#term-affine-map"]) {
    await page.goto(url + link, {waitUntil: "networkidle"});
    const hash = new URL(page.url()).hash;
    assert.equal(await popup.locator(hash).isVisible(), true);
    assert.equal(await popup.locator("details:not([open])").count(), 0);
    assert.equal(await popup.locator("button:visible").count(), 1, "only the close button: there is nothing to answer");
    await popup.locator(".deck-study-exit").click();
    assert.equal(await popup.isVisible(), false);
    // The filter is as the link set it, so the card is hidden again, and the address no longer names it.
    assert.equal(new URL(page.url()).hash, "");
    assert.notEqual(new URL(page.url()).searchParams.get("tag"), null);
    assert.equal(await page.locator(hash).isVisible(), false);
  }
  await inBothThemes(page, async () => assert(await fitsViewport(page), "no horizontal overflow"));

  // Clicking a card in the list opens that card alone, large, with every layer open.
  await page.goto(url, {waitUntil: "networkidle"});
  const one = page.locator("#term-convex-function");
  const small = (await one.boundingBox()).width;
  await one.locator(".concept-definition p").first().click();
  const place = await page.evaluate(() => Math.round(window.scrollY));
  assert.equal(await popup.locator("#term-convex-function").isVisible(), true);
  assert.equal(await popup.locator(".deck-card").count(), 1);
  assert.equal(await popup.locator("details:not([open])").count(), 0);
  assert.equal(await page.locator(".deck-list #term-convex-function").count(), 0);
  assert.equal(new URL(page.url()).hash, "#term-convex-function");
  assert((await popup.boundingBox()).width > small, "the popup is larger than the card in the list");
  // Closing it puts the card back as it was, and the page has not moved.
  await page.keyboard.press("Escape");
  assert.equal(await popup.isVisible(), false);
  assert.equal(await page.locator(".deck-list #term-convex-function").count(), 1);
  assert.deepEqual(await one.locator("details").evaluateAll(items => items.map(el => el.open)), [true, false]);
  assert.equal(await page.evaluate(() => Math.round(window.scrollY)), place);
  // The title is a link, so the keyboard opens the card too.
  await one.locator(".deck-card-link").press("Enter");
  assert.equal(await popup.locator("#term-convex-function").isVisible(), true);
  await popup.locator(".deck-study-exit").click();
  // A layer's own toggle still opens it in the list, without the popup.
  await one.locator(".concept-statement summary").click();
  assert.equal(await popup.isVisible(), false);
  assert.deepEqual(await one.locator("details").evaluateAll(items => items.map(el => el.open)), [true, true]);
  await one.locator(".concept-statement summary").click();

  // The subjects of a card stay on one line; the row scrolls sideways when they do not fit.
  const rows = await page.locator(".deck-card-meta").evaluateAll(items => items.map(row => ({
    wrap: getComputedStyle(row).flexWrap,
    overflow: getComputedStyle(row).overflowX,
    lines: new Set([...row.children].map(tag => Math.round(tag.getBoundingClientRect().top))).size,
  })));
  assert(rows.every(row => row.wrap === "nowrap" && row.overflow === "auto" && row.lines === 1));
  // Cards do not list the notes that use them.
  assert.equal(await page.locator(".concept-related").count(), 0);
  assert.equal(await page.getByText("Related notes").count(), 0);

  // Printing shows every card and layer, then restores what was open.
  await pick(page, "tag", "robotics");
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await page.emulateMedia({media: "print"});
  assert.equal(await visibleCards(page).count(), total);
  assert.equal(await openLayers(page).count(), layers);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.emulateMedia({media: "screen"});
  assert.equal(await openLayers(page).count(), layers - formal);
}

// One card at a time in a popup: reveal each layer, then say whether you knew it.
async function flashcardChecks(page, width) {
  await page.goto(url, {waitUntil: "networkidle"});
  const popup = page.locator("dialog.deck-study");
  const inList = page.locator(".deck-list .deck-card:visible");
  const button = page.locator(".deck-study-open"); // the icon of two cards, with no menu behind it
  const scrolled = () => page.evaluate(() => Math.round(window.scrollY));
  // The Study button quizzes the cards that are shown, so it is off when there are none.
  await page.locator(".deck-search").fill("zzzz-no-such-card");
  assert.equal(await button.isDisabled(), true);
  await page.locator(".deck-search").fill("expectation");
  const size = await visibleCards(page).count();
  assert(size >= 3, "the study search finds terms and formal cards");
  assert.equal(await button.isDisabled(), false);
  assert.equal(await button.getAttribute("aria-label"), `Study these ${size} cards`);
  assert.equal(await page.locator(".deck-menu").count(), 1, "Subject is the only dropdown");
  assert.equal(await popup.isVisible(), false);

  // One click opens the popup over the page: the list stays behind it, less the card being studied.
  await study(page);
  assert.equal(await popup.isVisible(), true);
  assert.equal(await popup.locator(".deck-card").count(), 1);
  assert.equal(await inList.count(), size - 1);
  assert.equal(await page.locator(".deck-bar").isVisible(), true);
  const place = await scrolled();
  const box = await popup.boundingBox();
  const screen = page.viewportSize();
  assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= screen.width && box.y + box.height <= screen.height, "the popup fits the screen");
  if (width !== 1440) assert.equal(Math.round(box.width), screen.width, "on a phone the popup is the whole screen");
  assert.equal(await status(page), `Card 1 of ${size}`);
  assert.equal(await page.locator(".deck-current details[open]").count(), 0, "a card starts with its answers hidden");
  assert.equal(await popup.getByText("Keys:").count(), 0, "the popup does not list the keyboard shortcuts");
  // A card has two answers, always there and the only ones: "Learning" and "Mastered".
  const answers = () => popup.locator(".deck-study-actions button:visible").allTextContents();
  assert.deepEqual(await answers(), ["Learning", "Mastered"]);

  // Mouse or touch: each click on the card turns over one more layer. "Learning" brings the card back at the end.
  const closed = () => popup.locator(".deck-current details:not([open])").count();
  for (let left = await closed(); left > 0; left--) {
    await popup.locator(".deck-current h2").click();
    assert.equal(await closed(), left - 1);
  }
  assert.deepEqual(await answers(), ["Learning", "Mastered"]);
  await page.locator(".deck-study-again").click();
  assert.equal(await status(page), `Card 2 of ${size + 1}`);

  // Keyboard: Space turns over the next layer, 2 is "Mastered".
  for (let card = 0; card < size; card++) {
    for (let left = await closed(); left > 0; left--) {
      await page.keyboard.press("Space");
      assert.equal(await closed(), left - 1);
    }
    await page.keyboard.press("2");
  }
  assert.equal(await status(page), `Finished. ${size - 1} of ${size} cards mastered on the first try.`);
  assert.equal(await popup.locator(".deck-card").count(), 0);
  assert.equal(await inList.count(), size);
  assert.deepEqual(await answers(), ["Study again", "Back to the cards"]);
  assert(await fitsViewport(page));
  // "Study again" starts over with the same cards, and 1 is "Learning".
  await page.locator(".deck-study-restart").click();
  assert.equal(await status(page), `Card 1 of ${size}`);
  await page.keyboard.press("1");
  assert.equal(await status(page), `Card 2 of ${size + 1}`);
  // × closes the popup, and the page has not moved.
  await page.locator(".deck-study-exit").click();
  assert.equal(await popup.isVisible(), false);
  assert.equal(await inList.count(), size);
  assert.equal(await scrolled(), place);

  // Every round asks all the shown cards again: nothing is remembered between rounds.
  await study(page);
  assert.equal(await status(page), `Card 1 of ${size}`);
  // Escape closes the popup.
  await page.keyboard.press("Escape");
  assert.equal(await popup.isVisible(), false);
  assert.equal(await inList.count(), size);
  // So does a click on the dimmed page beside it (a phone has no such space).
  if (width === 1440) {
    await study(page);
    await page.mouse.click(8, 450);
    assert.equal(await popup.isVisible(), false);
    assert.equal(await inList.count(), size);
  }
}

run(async ({each, noScript}) => {
  await each("cards, layers, search, filters, menus, deep links, flashcards, layout, print", async (page, width) => {
    await listChecks(page, width);
    await flashcardChecks(page, width);
  });
  await noScript("every card and layer remains readable", async page => {
    await page.goto(url);
    assert.equal(await page.locator(".deck-bar").isVisible(), false);
    assert.equal(await page.locator(".deck-study-actions").isVisible(), false);
    assert.equal(await page.locator(".deck-card details:not([open])").count(), 0);
    assert.equal(await page.locator(".deck-card details p").first().isVisible(), true);
  });
});
