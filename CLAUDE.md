# Site rules for Claude

@AGENTS.md

## Wiki layer
- Link between notes with `[[file-name]]` or `[[file-name|text]]`; add a folder when a name is ambiguous (`[[theory/flow-matching]]` vs `[[machine-learning/flow-matching]]`). Ordinary relative `.qmd` links also count as backlinks.
- `_wiki/build_index.py` runs before every render and writes `_wiki/wiki-index.json` (git-ignored). `_extensions/wiki/wiki.lua` turns wikilinks into links and appends a *Linked from* section. Unresolved or ambiguous links are logged as `(W) wiki:` warnings — fix them before committing.
- Published pages never link to drafts: a wikilink from a public page to a draft renders as plain text. Draft pages do not appear in public *Linked from* lists.
- Every edited note gets today's `date-modified`; `notes/recent.qmd` (the change log) sorts by it.

## Promoting notes from the Obsidian vault (`Research/Note`)
- Use the `/wiki-promote` procedure: new pages start as `draft: true`; publishing is the owner's decision.
- Check that nothing private (company data, unpublished results, personal data, tokens) is in the page.
- Write for a newcomer: define terms at first use, no vault-only context such as daily-note links.

## Before committing
- `quarto render` must finish with no `(W) wiki:` warnings, and the homepage and navigation indexes must render nonempty (see AGENTS.md).
- Show the diff and ask before `git push` (pushing to `master` deploys the site).
