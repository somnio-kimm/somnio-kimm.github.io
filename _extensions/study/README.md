# Study-note filter

Enabled for everything under `notes/study-notes/` by `_metadata.yml` (`filters: [study]`).
Everything it shows comes from one place: the cards in `notes/study-notes/_cards/`, one file per subject.

| Feature | Markup | What it shows |
|---|---|---|
| Definition bubbles | `[text]{.term key="..."}` in a note | the card's definition |
| Glossary page | `::: {.glossary-cards}` in `glossary.qmd` | every card, A–Z, with search, filters, and flashcard study |

## Files

| File | Role |
|---|---|
| `study.lua` | Filter entry point, and the definition bubbles |
| `cards.lua` | Reads and checks the card files; builds the glossary page |
| `deck.lua` | The controls above the cards, tag links, text helpers |
| `deck.js`, `deck.css` | Search, filters, practice, and flashcard study on the page |
| `study-terms.js`, `study-terms.css` | Behaviour and style of the definition bubbles |
| `../wiki/project.lua` | Project paths and the wiki index (shared with the wiki filter) |

## Writing a card

Add a card anywhere in the closest subject file under `_cards/`; the page sorts all cards by title.
A new `.qmd` file in that folder is picked up automatically.

A card has up to three layers. There are no card types.

- **Definition:** what the thing is, in plain words. Every card that is used as a bubble needs one.
- **Statement:** the formal version, with math. This is where a mathematical definition, or a claim such as a lemma or theorem, goes.
- **Proof:** the proof of the statement.

The smallest card is a title and a definition:

```markdown
:::: {.concept-card key="your-term" tags="mathematics machine-learning"}
## your term

What the thing is, in one or two plain sentences.
::::
```

A fuller card adds a recall prompt, a statement, and a proof:

```markdown
:::: {.concept-card key="unique-key" tags="mathematics"}
## name of the result

The definition: what it is or says, in plain words.

::: {.concept-prompt}
State the result, its assumptions, and reconstruct the proof.
:::

::: {.concept-statement}
The precise statement, with $inline$ or $$display$$ math.
:::

::: {.concept-proof}
The proof in paragraphs, equations, or lists.
:::
::::
```

Rules, all checked at render time with a message naming the card and file:

- `key` is unique across all files and uses lowercase letters, digits, and hyphens. It is what notes refer to, and the card's link is `glossary.html#term-KEY`.
- A card needs a definition or a `concept-statement`. A `concept-proof` needs a `concept-statement` to prove. The prompt is optional.
- A lemma, proposition, or theorem is written like any other card; put its usual name in the title. The old `kind` attribute is rejected.
- `tags` are separated by spaces and name study-note subject folders: `mathematics`, `machine-learning`, `robotics`, `physics`, `computer-hardware`, `computer-software`. At least one is required.
- Start titles with a lowercase letter unless they begin with a name.
- The definition is the text directly under the title. It appears in bubbles, so it is plain text: no equations and no links.
- Put every assumption and quantifier in the statement so it stands alone, and keep the proof readable whether or not the statement is open.
- Cards are plain Markdown and math. Shortcodes and `[[wikilinks]]` are not processed inside them.
- When a concept has both a plain definition and a formal one, write one card: the plain one as the definition, the formal one as the statement.

## Using a card in a note

```markdown
[random variable]{.term key="random-variable"}
[parameter]{.term key="parameter" definition="Here, a learned weight held fixed during prediction."}
```

The optional `definition` replaces the card's definition for that one place.
A card without a definition cannot be used as a bubble; the render stops and says so.
Annotate supporting terms in prose only: never inside a link, a heading, code, or an equation.
Bubbles hold a definition and nothing else; links to full explanations go in the note's prose.
See the study-note template for the content structure.

The definition text is in the HTML before any script runs.
JavaScript turns each label into a button with a small panel: hover, focus, or tap opens it; Escape, a click outside, or its close button dismisses it.
Without JavaScript and in print the definition is shown inline; other formats get a footnote.

## The glossary page

- **Layers.** A card shows its definition; the statement and the proof start closed and open one by one. While one of those is open, the card takes the full width.
- **Search and filters.** Search covers all text on a card, including closed layers. First letter, content (*With statement*, *With proof*), and tag combine; a value that would leave no cards is disabled. A `#tag` on a card filters by it.
- **Links.** The state is in the URL: `glossary.html?tag=mathematics&has=proof&letter=L&search=latent`. `#term-latent-variable` opens that card with every layer, clearing a filter that would hide it. The search parameter is `search`, not `q`: Quarto's site search owns `q` and removes it on load.
- **Practice.** *Hide answers for practice* closes every layer; each opens on its own.
- **Flashcard study.** *Review due cards* or *Study all as flashcards* shows the filtered cards one at a time in random order. Reveal each layer (definition, then statement, then proof), then choose **Again** or **Got it**. A missed card returns at the end of the round. Keys: Space reveals the next layer and then marks the card known, `1` again, `2` got it, `→` skip, Esc leave.
- **Schedule.** A card you know moves up one box and is due again after 1, 3, 7, 14, then 30 days; a missed card starts over. This progress is stored in the browser (`localStorage`) and never leaves it. *Reset progress* clears it.
- **Related notes.** Each card lists the notes that annotate it, collected from `.term` annotations by `_wiki/build_index.py`. Draft notes are listed only when the site is rendered with `draft-mode: visible`, so a production render never links to an unpublished page.
- **Without JavaScript and in print**, every card is listed with all layers open.

## Tests

Render the site, serve `_site` over HTTP, and with `playwright-core` available to Node run:

```sh
node tests/glossary.cjs http://127.0.0.1:8765          # the glossary page
node tests/glossary.cjs http://127.0.0.1:8765 --drafts # same, on a site rendered with draft-mode: visible
node tests/study-terms.cjs http://127.0.0.1:8765       # definition bubbles; needs draft-mode: visible while the notes are drafts
```

Set `NODE_PATH` if the package is installed outside this repository and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if Chromium is outside Playwright's default cache.
`tests/helpers.cjs` holds the shared setup: desktop and touch-phone widths, light and dark themes, page-error checks, and a run without JavaScript.
