# Website publishing rules

- Keep the homepage (`index.qmd`), top-level navigation destinations (`cv.qmd`, `publications.qmd`, `talks.qmd`), and all navigation/collection indexes (`notes/**/index.qmd`, including `notes/index.qmd`) explicitly set to `draft: false`.
- Never mark these pages as drafts, including when applying bulk draft changes to study notes or literature reviews. New navigation indexes must also use `draft: false`.
- Individual content notes may remain drafts. Do not override draft visibility globally to restore navigation, since that would also expose unfinished notes.
- Before publishing changes to draft settings or navigation, verify that the homepage and navigation indexes render nonempty HTML under the normal production render command.
