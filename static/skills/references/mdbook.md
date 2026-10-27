# mdBook Template Reference

mdBook is for documentation books, not blogs. It renders a `SUMMARY.md`-driven set of Markdown chapters into a static book. The `mdbook` template is intentionally tiny, and it exposes the weakest LightCMS fit of the group: mdBook has no native front matter.

## Layout

```text
.
├── book.toml
├── src/
│   ├── SUMMARY.md
│   └── chapter_1.md
├── .github/workflows/ci.yml
├── mise.toml
├── LICENSE
└── README.md
```

LightCMS shows the top-level `src` collection. Writers can edit `chapter_1.md` and `SUMMARY.md`, but new chapters must be added to `SUMMARY.md` or they will not appear in the book.

## Configuration

```toml
# book.toml
[book]
title = "My Book"
description = "A short description."
authors = ["Your Name"]
```

Output goes to `book/` by default. Change `build.build-dir` only if CI and the README are updated together.

## Navigation is the contract

`src/SUMMARY.md` is not optional. It is the table of contents and the build manifest:

```markdown
# Summary

- [Chapter 1](./chapter_1.md)
```

A new `src/getting-started.md` is invisible until the summary lists it:

```markdown
- [Getting Started](./getting-started.md)
```

If the template promises that LightCMS writers can add chapters without touching code, add a pre-build step that updates `SUMMARY.md`. Do not claim it works when the writer still has to edit the summary by hand.

A safe convention for a small book is to make the summary part of the writer's workflow and document it in the README:

1. Create `src/my-chapter.md`.
2. Add `- [My Chapter](./my-chapter.md)` to `SUMMARY.md`.
3. Run the build.

## Front matter does not exist

mdBook renders the chapter Markdown as-is. A LightCMS-created file starts with:

```markdown
---
title: My Chapter
date: '2026-10-14T10:00:00Z'
draft: false
---

Body.
```

mdBook will render the `---` lines as horizontal rules and the keys as text. That is a visible bug.

If the template must be edited through LightCMS, add a pre-build normalization step. A small Node script can copy `src/` to a temporary directory, remove a leading YAML block from each `.md`, and point mdBook at the copy:

```js
// scripts/strip-frontmatter.mjs
import { cp, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function strip(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await strip(path);
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;
    const source = await readFile(path, "utf8");
    const cleaned = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    await writeFile(path, cleaned);
  }
}

await cp("src", ".build-src", { recursive: true });
await strip(".build-src");
```

Then set `[book] src = ".build-src"` in `book.toml` and make the build task run the script before `mdbook build`. Add `.build-src/` to `.gitignore`. The alternative is to accept that mdBook is not a LightCMS authoring target and use it only for read-only docs.

Do not add YAML front matter to the sample chapters and then ship without a strip step; the rendered page will show it.

## Build and CI

```toml
# mise.toml
[tools]
mdbook = "latest"

[tasks]
build = "mdbook build"
```

```yaml
name: github pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/jdx/mise:2026.9.6
    steps:
      - uses: actions/checkout@main
      - uses: actions/cache@main
        with:
          path: |
            ~/.local/share/mise/installs
            ~/.local/share/mise/cache
          key: mise-${{ runner.os }}-${{ hashFiles('mise.toml') }}
          restore-keys: mise-${{ runner.os }}-
      - run: |
          mise trust
          mise deps
          mise run build
      - uses: actions/upload-pages-artifact@main
        with:
          path: ./book
      - id: deployment
        uses: actions/deploy-pages@main
```

## What mdBook does not give you

- No dates, tags, authors, or drafts in front matter.
- No RSS feed.
- No automatic listing of unlinked files.
- No per-page SEO metadata beyond the chapter title.
- No content collection beyond `src/`.

If the user asks for a blog with tags, dates, and drafts, steer them to Hugo, Zola, Eleventy, or Astro. Use mdBook when the job is a book with a table of contents.

## Verify

```bash
rm -rf book .build-src
mise trust
node scripts/check-content.mjs src --allow-no-frontmatter
mise run build
```

Then check:

- `book/index.html` exists.
- Every chapter in `SUMMARY.md` has a page.
- No YAML front matter is visible in the rendered chapter.
- The sidebar matches the summary.
- The CI artifact path is `./book`.
