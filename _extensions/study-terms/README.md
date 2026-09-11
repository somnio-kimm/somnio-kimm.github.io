# Study-note definitions

This local filter is enabled only by `notes/study-notes/_metadata.yml`.
The shared definitions live in `notes/study-notes/_glossary.yml`.
An unknown key or missing definition fails the render so an author cannot silently publish an empty bubble.

```markdown
[random variable]{.term key="random-variable"}
[parameter]{.term key="parameter" definition="Here, a learned weight held fixed during prediction."}
```

Each glossary entry has a `label`, a short plain-text `definition`, and an optional `href` to a root-relative source note such as `/notes/study-notes/mathematics/probability.qmd#random-variables`.
The optional `definition` and `href` attributes override that entry for the local context.
Use annotations only on supporting prose terms, never inside another link, a heading, code, or an equation.
The main concept and assumptions belong in the visible explanation.
See the study-note template for the content structure and authoring guidance.

The filter emits readable text and links before JavaScript runs.
JavaScript enhances the labels into buttons with nonmodal definition panels, supporting hover, focus, tap, Escape, outside dismissal, and an explicit close button.
The panels contain ordinary links and therefore do not use the noninteractive ARIA tooltip role.
Definitions remain inline for printing or when JavaScript is disabled; non-HTML exports use footnotes.
The CSS follows Quarto's light/dark body classes and does not animate the panels.

Implementation references: [Quarto filter API](https://quarto.org/docs/extensions/lua-api.html) and [W3C guidance for content on hover or focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html).

## Interaction checks

Render the site and serve `_site` over HTTP.
With `playwright-core` available to Node, run:

```sh
node tests/study-terms.cjs http://127.0.0.1:8765
```

Set `NODE_PATH` if the package is installed outside this repository and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if Chromium is outside Playwright's default cache.
The test covers desktop and touch interactions, keyboard access to links, dismissal and focus restoration, viewport placement, light/dark styling hooks, print, and no-JavaScript fallback.
