# somnio-kimm.github.io

Personal site of **Soo Min Kimm** — research notes, publications, and talks. Built with [Quarto](https://quarto.org) and deployed to GitHub Pages via GitHub Actions.

## Structure

- `index.qmd` — homepage
- `publications.qmd`, `talks.qmd`, `cv.qmd` (the Experience page), `background.qmd` (education and skills), `projects.qmd`
- `notes/literature-review/` — paper reviews grouped into Action, Theory, Vision, and Language
- `notes/study-notes/` — connected topic families under `mathematics/`, `machine-learning/`, `robotics/`, `physics/`, `computer-hardware/`, and `computer-software/`; electrical engineering material lives directly in `physics/`
- `notes/study-notes/_cards/` — the study cards, one file per card: glossary terms, formal definitions, results, and proofs in one format
- `_extensions/study/` — study-note filter: shows a card's short meaning as a definition bubble in notes, and builds the [glossary](notes/study-notes/glossary.qmd) page with search, filters, and flashcard study; see its `README.md` to add a card
- `tests/` — browser checks for the glossary page and definition bubbles
- `_extensions/wiki/` + `_wiki/build_index.py` — wiki layer: `[[wikilinks]]`, a *Linked from* backlinks list on every note, built from both wikilinks and ordinary `.qmd` links (see `CLAUDE.md`)
- `_quarto.yml` — site config, navbar, and subject sidebars; subject names link to overview pages, and arrows expand their notes
- `styles.scss` — design tokens (fonts, sepia colours) and site-wide rules; one theme, no dark mode
- `images/`, `files/` — note figures and talk slides

## Local development

```bash
quarto preview   # live-reload dev server
quarto render    # build into _site/
```

Pushing to `master` triggers `.github/workflows/publish.yml`, which renders with Quarto and deploys to GitHub Pages.
Published notes use `draft: false`.
The two `template.qmd` files remain drafts and are excluded from rendering and listings.
