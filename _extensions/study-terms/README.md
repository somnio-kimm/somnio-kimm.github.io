# Study-note definitions

This local filter is enabled only by `notes/study-notes/_metadata.yml`.
The shared definitions live in subject files under `notes/study-notes/_glossary/`.
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

Append an entry anywhere in the closest subject file; alphabetical ordering is optional.
The rendered cards are always sorted by label. Terms can have several subject tags.

```yaml
your-term:
  label: Your term
  tags: [mathematics, machine-learning]
  definition: A short definition in one or two plain-text sentences.
```

Each glossary filename matches a study-note subject folder, such as `mathematics.yml`
or `machine-learning.yml`. Keep each term in one primary subject file and use tags
for its other subjects. The six subject files are listed in `_glossary.yml`;
`computer-hardware.yml` is ready for future entries.
If you add a new subject folder and glossary file, add its relative path to `_glossary.yml`.
Keys must be unique across all files. Missing files and duplicate keys fail the render.
Existing note annotations keep working when entries move between subject files.
Tags match the study-note subject folder names: `mathematics`, `machine-learning`,
`robotics`, `physics`, `computer-hardware`, and `computer-software`. Use more than
one when a term spans subjects. They belong to the term, independently of which file holds it.

The Glossary page loads every entry from these same files. It supports text search,
an A–Z first-letter filter, tag filtering, shareable `?tag=mathematics&letter=L&q=latent`
filters, and practice by hiding
definitions until each native disclosure is opened. `#term-latent-variable` links
directly to a card. Without JavaScript, cards and definitions remain readable.
Printing includes all cards and definitions.
The glossary has its own sidebar, with alphabetical subject links that filter the
glossary directly. Subjects with no entries show the empty state.

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
