# somnio-kimm.github.io

Personal site of **Soo Min Kimm** — research notes, publications, and talks. Built with [Quarto](https://quarto.org) and deployed to GitHub Pages via GitHub Actions.

## Structure

- `index.qmd` — homepage
- `publications.qmd`, `talks.qmd`, `cv.qmd`
- `notes/` — the research wiki, grouped by area (Mathematics, Deep Learning, Reinforcement Learning, Literature Review)
- `_quarto.yml` — site config, navbar, and the group → subgroup sidebar
- `styles.scss` — theme tweaks
- `images/`, `files/` — note figures and talk slides

## Local development

```bash
quarto preview   # live-reload dev server
quarto render    # build into _site/
```

Pushing to `master` triggers `.github/workflows/publish.yml`, which renders with Quarto and deploys to GitHub Pages.
