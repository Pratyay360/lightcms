# Zola Template Reference

Zola is a single Rust binary with no runtime, built-in Sass, search index, feeds, and syntax highlighting. It is a good fit for users who want a fast blog without a Node or Ruby toolchain.

## Layout

```text
.
├── content/
│   ├── _index.md
│   ├── about.md
│   └── blog/
│       ├── _index.md
│       ├── first-post.md
│       └── second-post.md
├── templates/
│   ├── 404.html
│   ├── base.html
│   ├── index.html
│   ├── page.html
│   └── section.html
├── static/css/style.css
├── .github/workflows/ci.yml
├── zola.toml
├── mise.toml
├── LICENSE
└── README.md
```

LightCMS shows the top-level `content` collection; writers work in the `blog` folder.

## Configuration

```toml
# zola.toml
base_url = "https://example.github.io/my-blog"
title = "My Blog"
description = "A short description."

compile_sass = true
build_search_index = true
generate_feeds = true
feed_filenames = ["atom.xml"]

[[taxonomies]]
name = "tags"

[markdown]
[markdown.highlighting]
theme = "catppuccin-mocha"

[extra]
```

`base_url` must be the full site root, including the project path on GitHub Pages. Do not add a trailing slash if the rest of the config is consistent; Zola normalizes it.

Add `[[taxonomies]]` only if the template has a tags page or renders tag links. A taxonomy without a template does not add much.

## Front matter

Zola supports TOML front matter with `+++` and YAML front matter with `---`. LightCMS writes YAML, so the template should use YAML for entries that writers edit:

```markdown
---
title: First Post
description: What this starter includes.
date: 2026-01-10T00:00:00Z
draft: false
tags:
  - intro
---

Body text.
```

The section index:

```markdown
---
title: Blog
description: All posts.
sort_by: date
---
```

`sort_by = "date"` means a page without a `date` is not rendered in that section. Test every sample post with a date.

### Date compatibility

Zola's documentation says dates in TOML must not be quoted. YAML is supported for porting legacy content, but the date type still matters. LightCMS writes a quoted ISO string such as:

```yaml
date: "2026-10-14T10:00:00Z"
```

A quick build with a current Zola release accepted that exact YAML and rendered the page at `/blog/hello-world/`. Still run the same test with the version pinned in `mise.toml`, because the date parser is the kind of thing that changes between releases. If the quoted date is rejected, choose one of these fixes:

- keep the date unquoted in the sample and document the requirement;
- add a small pre-build normalization script that rewrites the date;
- switch the template to a generator that accepts LightCMS's YAML unchanged.

Do not assume it works because the site builds with a hand-written, unquoted date.

### Tags are a shape mismatch

LightCMS writes tags as a top-level list:

```yaml
tags:
  - lightcms
  - zola
```

Zola reads taxonomy values from a nested table:

```yaml
taxonomies:
  tags:
    - lightcms
    - zola
```

A page with only the LightCMS-shaped `tags` list builds, but it does not populate Zola's tag pages. If the template exposes a tags page, pick one of these approaches:

- **Mirror the field before the build.** Add a small script that copies top-level `tags` into `taxonomies.tags` and run it before `zola build`. This keeps the writer's LightCMS form simple and lets Zola render tag pages. Make the script idempotent; it rewrites generated front matter only when the tags change.
- **Drop tag pages.** Keep the top-level `tags` list as metadata, do not configure a Zola taxonomy, and do not promise tag browsing. This is the simpler option for a minimal starter.
- **Expose `taxonomies` as an additional LightCMS field.** This works only if writers remember to use the additional-fields drawer; do not make it the default.

Do not ship TOML sample posts with `[taxonomies]` and call the template LightCMS-ready. LightCMS writes YAML with a top-level `tags` list, so the sample would not match what a writer actually creates.

## URLs and slugs

Zola derives the output path from the filename unless front matter says otherwise:

```text
content/blog/hello-world.md  →  /blog/hello-world/
```

Supported overrides:

```yaml
slug: hello-world
# or
path: blog/hello-world
```

`slug` is the safer override because it keeps the section path. `path` replaces the section path entirely.

LightCMS does not expose either field by default. It preserves them through the additional-fields drawer, but do not make routing depend on a writer remembering to use the drawer. The reliable rule is still: **use a human filename slug**.

A timestamp filename (`1792167272.md`) becomes `/blog/1792167272/`. `slugify.paths = "on"` does not turn a timestamp into a title.

## Dates from filenames

Zola has a useful behavior that other generators lack: a filename beginning with `YYYY-MM-DD` supplies the page date and is removed from the URL:

```text
content/blog/2026-01-10-hello-world.md  →  /blog/hello-world/
```

LightCMS's slug validator allows this shape, so a writer can use `2026-01-10-hello-world` as the slug and get both a clean URL and a date. This is optional; the front matter date is still the source of truth.

## Build, preview, and search

```toml
# mise.toml
[tools]
zola = "latest"
bun = "latest"

[tasks]
start = "zola serve"
build = "zola build"
index = "bun x pagefind --site public"
```

- `mise run start` serves with live reload.
- `mise run build` writes `public/`.
- `mise run index` adds Pagefind search over the built HTML.

Zola also has `build_search_index = true`, which creates its own search index. If Pagefind is enabled, decide which search UI the template actually ships; having two indexes is unnecessary.

## CI for GitHub Pages

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
          mise install
          mise run build
          mise run index
      - uses: actions/upload-pages-artifact@main
        with:
          path: ./public
      - id: deployment
        uses: actions/deploy-pages@main
```

If the template has no Pagefind UI, remove `mise run index` from CI. A missing index is better than a failing deploy.

## Templates and assets

- `templates/base.html` owns the head, nav, and footer. Keep the title/description blocks in the child templates.
- Use `get_url(path="css/style.css")` so the base path is respected.
- `templates/section.html` lists `section.pages`; `sort_by` in the section controls order.
- `templates/404.html` is copied to `public/404.html` by Zola.
- `static/css/style.css` is plain CSS. Do not add a Sass build unless `compile_sass` is set and the file lives under `sass/`.

## Verify

```bash
rm -rf public
mise trust
mise run build
```

Then check:

- `public/index.html` links to `/blog/`.
- `public/blog/first-post/index.html` exists.
- A post with `draft: true` is absent.
- A quoted LightCMS-style date is accepted.
- `public/atom.xml` exists if feeds are enabled.
- The `base_url` does not leak another project's path.
- Tags render only if a taxonomy and template exist.
