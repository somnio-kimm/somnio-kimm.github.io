# Study-note definitions

This local filter is enabled only by `notes/study-notes/_metadata.yml`.
The shared definitions live in small topic files under `notes/study-notes/_glossary/`.
`notes/study-notes/_glossary.yml` lists those files.
An unknown key or missing definition fails the render so an author cannot silently publish an empty bubble.

```markdown
[random variable]{.term key="random-variable"}
[parameter]{.term key="parameter" definition="Here, a learned weight held fixed during prediction."}
```

Each glossary entry has a `label`, reusable `tags`, and a short plain-text `definition`.
The optional `definition` attribute overrides that entry for the local context.
Bubbles contain only definitions; place links to full explanations in the surrounding note prose or Connections section.
Use annotations only on supporting prose terms, never inside another link, a heading, code, or an equation.
The main concept and assumptions belong in the visible explanation.
See the study-note template for the content structure and authoring guidance.

The filter emits readable definition text before JavaScript runs.
JavaScript enhances the labels into buttons with nonmodal definition panels, supporting hover, focus, tap, Escape, outside dismissal, and an explicit close button.
Definitions remain inline for printing or when JavaScript is disabled; non-HTML exports use footnotes.
The CSS follows Quarto's light/dark body classes and does not animate the panels.

Implementation references: [Quarto filter API](https://quarto.org/docs/extensions/lua-api.html) and [W3C guidance for content on hover or focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html).

## Adding a word card

Append an entry anywhere in the closest topic file; alphabetical ordering is optional.
The rendered cards are always sorted by label. Terms can have several tags across topics.

```yaml
your-term:
  label: Your term
  tags: [probability, generative-models]
  definition: A short definition in one or two plain-text sentences.
```

If a new topic needs its own file, add its relative path to `_glossary.yml`.
Keys must be unique across all files. Missing files and duplicate keys fail the render.
Existing note annotations keep working when entries move between topic files.
Tags use lowercase words joined with hyphens. They belong to the term, independently of which file holds it.

The Glossary page loads every entry from these same files. It supports text search,
tag filtering, shareable `?tag=probability&q=latent` filters, and practice by hiding
definitions until each native disclosure is opened. `#term-latent-variable` links
directly to a card. Without JavaScript, cards and definitions remain readable.
Printing includes all cards and definitions.

Related notes are collected from `.term` annotations by `_wiki/build_index.py`;
code examples and comments are ignored. Links to draft notes appear only with
`draft-mode: visible`, so normal production renders do not expose unfinished notes.
When all relevant notes are drafts, the production cards show only definitions and tags.
Preview the glossary together with its linked notes using `quarto preview`.

## Interaction checks

Render the site and serve `_site` over HTTP.
With `playwright-core` available to Node, run:

```sh
node tests/study-terms.cjs http://127.0.0.1:8765
node tests/glossary-cards.cjs http://127.0.0.1:8765
# For a site rendered with -M draft-mode:visible:
node tests/glossary-cards.cjs http://127.0.0.1:8765 --drafts
```

Set `NODE_PATH` if the package is installed outside this repository and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if Chromium is outside Playwright's default cache.
The test covers desktop and touch interactions, keyboard operation, dismissal and focus restoration, viewport placement, light/dark styling hooks, print, and no-JavaScript fallback.
