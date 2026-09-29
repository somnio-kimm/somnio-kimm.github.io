"""Pre-render step: build the wiki index used by the `wiki` filter.

Scans every .qmd page, records its title and draft state, and collects the
links between pages — both [[wikilinks]] and ordinary Markdown links to .qmd
files — so each page can show which other pages link to it ("Linked from").

Output: _wiki/wiki-index.json (generated; not committed).
Standard library only, so it runs on the GitHub Actions runner as-is.
"""

import json
import os
import posixpath
import re
from pathlib import Path

ROOT = Path(os.environ.get("QUARTO_PROJECT_DIR", Path(__file__).resolve().parent.parent))
OUT = ROOT / "_wiki" / "wiki-index.json"
SKIP_DIRS = {"_site", "_extensions", "_wiki", ".quarto", ".git", "node_modules", "tests"}

FRONTMATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.S)
WIKILINK = re.compile(r"\[\[([^\[\]|#]+)(?:#[^\[\]|]*)?(?:\|[^\[\]]*)?\]\]")
MDLINK = re.compile(r"\]\(\s*<?([^)\s>]+?\.qmd)(?:#[^)\s>]*)?>?(?:\s+\"[^\"]*\")?\s*\)")
CODE = re.compile(r"```.*?```|`[^`\n]*`", re.S)
COMMENT = re.compile(r"<!--.*?-->", re.S)


def scalar(block, key):
    m = re.search(rf"^{key}:\s*(.*)$", block, re.M)
    if not m:
        return None
    v = m.group(1).strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "'\"":
        v = v[1:-1]
    return v


def normalise(key):
    return re.sub(r"[\s_]+", "-", key.strip().lower())


def main():
    pages = {}
    texts = {}
    for p in sorted(ROOT.rglob("*.qmd")):
        rel = p.relative_to(ROOT).as_posix()
        if set(rel.split("/")[:-1]) & SKIP_DIRS or rel.startswith("_"):
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except OSError as e:  # e.g. a cloud-only file not yet downloaded
            print(f"wiki index: skipped unreadable {rel} ({e.strerror})")
            continue
        fm = FRONTMATTER.match(text)
        block = fm.group(1) if fm else ""
        draft = (scalar(block, "draft") or "false").lower() == "true"
        title = scalar(block, "title") or p.stem
        pages[rel] = {"title": title, "draft": draft}
        texts[rel] = text[fm.end():] if fm else text

    # Lookup keys: file stem, folder name for index pages, path suffixes, and title.
    keys = {}

    def add(k, rel):
        k = normalise(k)
        if k and rel not in keys.setdefault(k, []):
            keys[k].append(rel)

    for rel, info in pages.items():
        parts = rel[:-4].split("/")
        if parts[-1] == "index":
            parts = parts[:-1] or ["index"]
        for i in range(len(parts)):
            add("/".join(parts[i:]), rel)
        add(info["title"], rel)

    def resolve(target, source):
        cands = keys.get(normalise(target), [])
        if len(cands) <= 1:
            return cands[0] if cands else None
        src = source.split("/")
        # Prefer the candidate that shares the longest folder prefix with the source.
        return max(cands, key=lambda c: len(os.path.commonprefix([src, c.split("/")])))

    backlinks = {}
    for rel, text in texts.items():
        if rel.endswith("index.qmd"):
            continue  # navigation pages are not meaningful backlinks
        body = CODE.sub("", COMMENT.sub("", text))
        targets = set()
        for t in WIKILINK.findall(body):
            hit = resolve(t, rel)
            if hit:
                targets.add(hit)
        for href in MDLINK.findall(body):
            if "://" in href:
                continue
            base = "" if href.startswith("/") else posixpath.dirname(rel)
            hit = posixpath.normpath(posixpath.join(base, href.lstrip("/")))
            if hit in pages:
                targets.add(hit)
        for t in targets - {rel}:
            backlinks.setdefault(t, []).append(rel)

    for t in backlinks:
        backlinks[t] = sorted(set(backlinks[t]), key=lambda r: pages[r]["title"].lower())

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps({"pages": pages, "keys": keys, "backlinks": backlinks},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    n_links = sum(len(v) for v in backlinks.values())
    print(f"wiki index: {len(pages)} pages, {n_links} backlinks")


if __name__ == "__main__":
    main()
