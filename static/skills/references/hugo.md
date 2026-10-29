# Hugo Template Reference

Hugo is the safest default for large blogs and content-heavy sites. It reads YAML, TOML, or JSON front matter, builds in milliseconds, and needs no runtime.

## Two variants in the `light-cms` org

| Variant        | Use it for                                          | Content path    | Theme                                        |
| -------------- | --------------------------------------------------- | --------------- | -------------------------------------------- |
| `hugo_blog`    | Minimal starter, no external dependencies           | `content/posts` | Built-in layouts in `layouts/`               |
| `blogtemplate` | Personal blog with richer styling and editor schema | `content/post`  | Built-in theme, Sass, pagefind, Surge deploy |

Start from `hugo_blog` unless the user asks for the richer blog. Do not copy `blogtemplate` wholesale into a new project without trimming its personal configuration.

## Layout of the minimal template

```text
.
├── archetypes/default.md
├── content/
│   ├── _index.md
│   ├── about.md
│   └── posts/
│       ├── _index.md
│       ├── first-post.md
│       └── second-post.md
├── layouts/
│   ├── 404.html
│   ├── _default/
│   │   ├── baseof.html
│   │   ├── list.html
│   │   └── single.html
│   └── home.html
├── static/css/style.css
├── .github/workflows/ci.yml
├── hugo.toml
├── mise.toml
├── LICENSE
└── README.md
```

The top-level collection LightCMS shows is `content`; writers work in the `posts` folder. This is expected and does not need a root `posts/` folder.

## Configuration

```toml
# hugo.toml
baseURL = 'https://example.github.io/my-blog/'
languageCode = 'en-us'
title = 'My Blog'

[params]
  description = 'A short description of the site.'
```

`baseURL` is the most common deployment bug:

- GitHub Pages project site: `https://<user>.github.io/<repo>/`
- GitHub Pages user site: `https://<user>.github.io/`
- Cloudflare Pages, Vercel, Netlify, custom domain: the site root, with a trailing slash

If the site is served under a project path, keep the path in `baseURL`. Templates that hardcode `/css/style.css` should use Hugo's `relURL` or `relPermalink` so the path works in both cases:

```html
<link rel="stylesheet" href="{{ "css/style.css" | relURL }}" />
```

## Front matter

Hugo accepts YAML, so a LightCMS-created file works:

```markdown
---
title: First Post
description: What this starter includes.
date: "2026-01-10T00:00:00Z"
draft: false
tags:
  - intro
---

Body text.
```

The archetype can stay TOML (`+++`) because Hugo accepts both formats per file:

```toml
+++
date = '{{ .Date }}'
draft = true
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
+++
```

Do not add `isCJKLanguage`, `headless`, or `weight` to every post unless the templates use them. They are valid Hugo fields, but they add noise to the editor.

## URLs and slugs

By default, Hugo uses the filename as the slug:

```text
content/posts/hello-world.md  →  /posts/hello-world/
```

The filename is what LightCMS calls the entry's slug. Tell writers to replace the timestamp with a human slug. If a writer needs a different URL than the filename, Hugo supports `url`:

```yaml
url: /custom/path/
```

`url` is one of LightCMS's configured fields, so it survives an edit. Hugo also supports `slug`, but LightCMS does not expose it by default; prefer the filename.

## Build and preview

```toml
# mise.toml
[tools]
"github:sass/dart-sass" = "latest"
hugo = "latest"
bun = "latest"

[tasks]
start = "hugo server "
build = "hugo"
index = "bun x pagefind --site public"
```

- `mise run start` serves with live reload.
- `mise run build` writes `public/`.
- `mise run index` builds the Pagefind search index after a build. It is optional; remove the task and the CI step if the template does not need search.

Pin versions if the template is meant to be stable for a long time. The org templates use `latest` for convenience; a production template should pin Hugo and test upgrades.

## CI for GitHub Pages

```yaml
name: github pages

on:
  push:
    branches: [main]
  workflow_dispatch:
  repository_dispatch:
    types: [content_update, blog_update]

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
          mise run index
      - uses: actions/upload-pages-artifact@main
        with:
          path: ./public
      - id: deployment
        uses: actions/deploy-pages@main
```

The `repository_dispatch` trigger is for split content/site repositories: a content repo can dispatch `content_update` to the site repo. Remove it if the site is a single repository.

## The `blogtemplate` variant

Use it only when the user wants a fuller personal blog. Its additional pieces are:

- `frontmatter.json` and `.frontmatter/` for the Front Matter VS Code/Cursor extension;
- `archetypes/posts.md` with `toc`, `images`, `tags`;
- `content/post/` (singular) and `content/test/` sample folders;
- `assets/css/` with Sass;
- `layouts/partials/` and `layouts/shortcodes/` for callouts and buttons;
- `mise.toml` tasks for `start`, `build`, `index`, and a Surge deploy;
- `utterances` comments and `goatcounter` analytics, both requiring configuration.

Before reusing it:

1. Replace the personal title, description, author, social links, and domain.
2. Replace `baseURL` with the real domain. The template uses `baseUrl`; normalize it to Hugo's documented `baseURL`.
3. Remove the Surge deploy task or set `SURGE_TOKEN` as a repository secret. Do not commit the token.
4. Remove the comments/analytics snippets if the user does not want them; they are third-party requests and need a privacy decision.
5. Keep `frontmatter.json` only if the user actually edits in VS Code. LightCMS does not read it.

## Verify

```bash
rm -rf public resources
mise trust
mise run build
```

Then check:

- `public/index.html` links to `/posts/`.
- `public/posts/first-post/index.html` exists.
- A post with `draft: true` is absent from `public/`.
- CSS loads when serving the site under the project path, not only at `/`.
- `public/index.xml` exists: Hugo emits RSS for the home page and sections by default, and the base layout links the alternate output. If a site disables RSS, remove the feed link rather than leaving a dead one.
- The CI artifact path is `./public`.
