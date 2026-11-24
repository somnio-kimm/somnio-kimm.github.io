// The glossary page: every study card (terms, formal definitions, results and
// proofs) in one deck with search, filters, practice and flashcard study.
const {assert, origin, drafts, run, inBothThemes, fitsViewport} = require("./helpers.cjs");

const url = `${origin}/notes/study-notes/glossary.html`;
const visibleCards = page => page.locator(".deck-card:visible");
const openLayers = page => page.locator(".deck-card details[open]");
const status = page => page.locator(".deck-study-status").textContent();

// Clicks one button of a filter ("tag" = subject; "" = its "All" button).
const pick = (page, key, value) => page.locator(`[data-facet="${key}"] button[data-value="${value}"]`).click();

async function listChecks(page, width) {
  await page.goto(url, {waitUntil: "networkidle"});
  const cards = page.locator(".deck-card");
  const total = await cards.count();
  const layers = await page.locator(".deck-card details").count();
  const formal = await page.locator(".deck-card details[data-collapsed]").count();
  assert(total >= 72);
  assert.equal(await page.locator(".deck-side").isVisible(), true);
  const labels = await page.locator(".deck-card-title").allTextContents();
  assert.deepEqual(labels, [...labels].sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1));
  const taggedWith = tag => cards.evaluateAll((items, name) => items.filter(el => el.dataset.tag.split(" ").includes(name)).length, tag);

  // Definitions start open; statements and proofs start closed.
  assert(formal > 0);
  assert.equal(await openLayers(page).count(), layers - formal);
  // Practice hides every answer; each one opens on its own with the keyboard.
  await page.locator(".deck-practice").check();
  assert.equal(await openLayers(page).count(), 0);
  await page.locator(".deck-card summary").first().press("Enter");
  assert.equal(await openLayers(page).count(), 1);
  await page.locator(".deck-practice").uncheck();
  assert.equal(await openLayers(page).count(), layers - formal);

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

  // Search covers every layer, including closed proofs.
  await page.locator(".deck-search").fill("LATENT variable");
  assert.equal(await page.locator("#term-latent-variable").isVisible(), true);
  await page.locator(".deck-search").fill("factorisation");
  assert.equal(await page.locator("#term-linearity-expectation").isVisible(), true);
  assert(await visibleCards(page).count() < total);
  await page.locator(".deck-search").fill("zzzz-no-such-card");
  assert.equal(await page.locator(".deck-empty").isVisible(), true);
  await page.locator(".deck-reset").click();
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

  // On a wide screen the filters and study buttons are the only thing in the
  // page sidebar; on a phone, where that sidebar is folded away, they stay above the cards.
  const wide = width === 1440;
  assert.equal(await page.locator("#quarto-sidebar .deck-side").count(), wide ? 1 : 0);
  assert.equal(await page.locator(".deck-controls .deck-side").count(), wide ? 0 : 1);
  assert.equal(await page.locator('.deck-side [data-study="all"]').isVisible(), true);
  if (wide) assert.equal(await page.locator("#quarto-sidebar .sidebar-menu-container > ul").isVisible(), false);
  else assert.equal(await page.locator(".quarto-secondary-nav").isVisible(), false);
  // A tag on a card filters the whole deck.
  await page.locator('#term-latent-variable .deck-tag[data-value="mathematics"]').click();
  assert.equal(await visibleCards(page).count(), await taggedWith("mathematics"));
  assert.equal(new URL(page.url()).searchParams.get("tag"), "mathematics");

  // A link to a card that the filter hides clears the filter and opens every layer.
  for (const link of ["?tag=robotics#term-latent-variable", "?tag=physics#term-affine-map"]) {
    await page.goto(url + link, {waitUntil: "networkidle"});
    const target = page.locator(new URL(page.url()).hash);
    assert.equal(await target.isVisible(), true);
    assert.equal(await target.locator("details:not([open])").count(), 0);
    assert.equal(new URL(page.url()).search, "");
  }
  await inBothThemes(page, async () => assert(await fitsViewport(page), "no horizontal overflow"));

  // Related notes never point at a draft that the site does not publish.
  await page.goto(url, {waitUntil: "networkidle"});
  if (drafts) {
    const link = page.locator('#term-parameterised-function .concept-related a[href$="neural-network.html"]');
    assert.equal(await link.count(), 1);
  } else {
    assert.equal(await page.locator(".concept-draft").count(), 0);
    assert.equal(await page.locator('.concept-related a[href$="neural-network.html"]').count(), 0);
  }

  // Printing shows every card and layer, then restores what was open.
  await page.locator(".deck-practice").check();
  await pick(page, "tag", "robotics");
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await page.emulateMedia({media: "print"});
  assert.equal(await visibleCards(page).count(), total);
  assert.equal(await openLayers(page).count(), layers);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.emulateMedia({media: "screen"});
  assert.equal(await openLayers(page).count(), 0);
}

// One card at a time: reveal each layer, grade the card, keep the result for later visits.
async function flashcardChecks(page) {
  await page.goto(url, {waitUntil: "networkidle"});
  await page.locator(".deck-search").fill("expectation");
  const size = await visibleCards(page).count();
  assert(size >= 3, "the study search finds terms and formal cards");
  const dueButton = page.locator('[data-study="due"]'); // enabled only while a shown card is due
  assert.equal(await dueButton.isDisabled(), false);

  await page.locator('[data-study="all"]').click();
  assert.equal(await page.locator(".deck-side").isVisible(), false);
  assert.equal(await visibleCards(page).count(), 1);
  assert.equal(await status(page), `Card 1 of ${size}`);
  assert.equal(await page.locator(".deck-current details[open]").count(), 0, "a card starts with its answers hidden");
  assert.equal(await page.locator(".deck-study-good").isVisible(), false, "no grading before the answer is shown");

  // Mouse or touch: reveal layer by layer, then miss the card; it returns at the end.
  const reveal = page.locator(".deck-study-reveal");
  while (await reveal.isVisible()) await reveal.click();
  assert.equal(await page.locator(".deck-current details:not([open])").count(), 0);
  await page.locator(".deck-study-again").click();
  assert.equal(await status(page), `Card 2 of ${size + 1}`);

  // Keyboard: Space reveals the next layer, 2 marks the card as known.
  for (let card = 0; card < size; card++) {
    for (let layer = 0; layer < 5 && await reveal.isVisible(); layer++) await page.keyboard.press("Space");
    assert.equal(await page.locator(".deck-study-good").isVisible(), true);
    await page.keyboard.press("2");
  }
  assert.equal(await status(page), `Finished. ${size - 1} of ${size} cards recalled on the first try.`);
  assert.equal(await visibleCards(page).count(), 0);
  assert(await fitsViewport(page));
  await page.locator(".deck-study-exit").click();
  assert.equal(await page.locator(".deck-side").isVisible(), true);
  assert.equal(await visibleCards(page).count(), size);

  // Known cards are not due again today, also after a reload.
  assert.equal(await dueButton.isDisabled(), true);
  assert.equal(await page.locator('[data-study="due"]').isDisabled(), true);
  await page.reload({waitUntil: "networkidle"});
  assert.equal(await dueButton.isDisabled(), true);
  page.once("dialog", dialog => dialog.accept());
  await page.locator(".deck-forget").click();
  assert.equal(await dueButton.isDisabled(), false);
  assert.equal(await page.locator(".deck-forget").isVisible(), false);

  // Escape leaves study mode without grading anything.
  await page.locator('[data-study="due"]').click();
  await page.keyboard.press("Escape");
  assert.equal(await visibleCards(page).count(), size);
  assert.equal(await dueButton.isDisabled(), false);
}

run(async ({each, noScript}) => {
  await each("cards, layers, search, filters, sidebar, deep links, flashcards, layout, print", async (page, width) => {
    await listChecks(page, width);
    await flashcardChecks(page);
  });
  await noScript("every card and layer remains readable", async page => {
    await page.goto(url);
    assert.equal(await page.locator(".deck-side").isVisible(), false);
    assert.equal(await page.locator(".deck-study-actions").isVisible(), false);
    assert.equal(await page.locator(".deck-card details:not([open])").count(), 0);
    assert.equal(await page.locator(".deck-card details p").first().isVisible(), true);
  });
});
