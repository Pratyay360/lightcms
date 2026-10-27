# Zine Template Reference

Zine (`zine-ssg`) is a niche static site generator built around SuperMD (`.smd`), SuperHTML (`.shtml`), and Ziggy schemas. It is powerful, but it is not a drop-in Markdown target for LightCMS. Use this reference only when the user explicitly wants Zine, or when maintaining the existing `zine_blog` / `zine_content` pair.

## Why Zine is different

LightCMS writes Markdown (`.md`) with YAML front matter. Zine reads SuperMD (`.smd`) with Ziggy-style front matter:

```smd
---
.title = "First Post",
.date = .date("2026-01-10T00:00:00"),
.layout = "post.shtml",
---
```

Those are not interchangeable. The org solves the gap with a two-repository pipeline:

```text
zine_content/                 zine_blog/
content/posts/*.md    ──►     scripts/fetch.js
content/notes/*.md            ├─ clones the content repo
content/devlogs/*.md          ├─ converts .md → .smd with md2smd
                              ├─ injects .layout
                              └─ zine release -f → public/
```

LightCMS edits the content repo. The site repo is a build target triggered by `repository_dispatch`.

## The two repositories

### `zine_content`

```text
.
├── content/
│   ├── posts/.gitkeep
│   ├── notes/.gitkeep
│   └── devlogs/.gitkeep
├── .github/workflows/ci.yml
├── mise.toml
└── LICENSE
```

The workflow dispatches a build to the site repo:

```yaml
name: build and deploy

permissions:
  contents: read
  pull-requests: write

on:
  push:
  pull_request:
  workflow_dispatch:

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger deploy
        env:
          GH_TOKEN: ${{ secrets.DEPLOY }}
        run: |
          gh api \
            --method POST \
            /repos/<owner>/<site-repo>/dispatches \
            -f event_type=content_update
```

`DEPLOY` must be a token that can dispatch to the site repo. Document the secret; do not commit it.

### `zine_blog`

```text
.
├── content/
│   ├── index.smd
│   ├── about.smd
│   ├── .smd.ziggy-schema
│   ├── blog/
│   ├── devlog/
│   └── notes/
├── layouts/
│   ├── base? (project-specific)
│   ├── index.shtml
│   ├── blog.shtml
│   ├── post.shtml
│   ├── page.shtml
│   └── *.xml
├── assets/
│   ├── style.css
│   ├── highlight.css
│   └── Temml math assets
├── scripts/fetch.js
├── public/
├── mise.toml
└── .github/workflows/ci.yml
```

## The fetch-and-convert script

`scripts/fetch.js` is the bridge. It:

1. clones the content repo at a branch into a temp directory;
2. walks each mapped source directory;
3. copies each `.md` to the target path as `.md`;
4. runs `md2smd` on it, producing `.smd`;
5. prepends `.layout = "<layout>",` if the converted front matter lacks one;
6. deletes the temporary `.md`.

The mapping in the org template:

```js
const DIRECTORY_MAPPINGS = [
  { src: "content/posts", dest: "content/blog", layout: "post.shtml" },
  { src: "content/blog", dest: "content/blog", layout: "post.shtml" },
  { src: "content/devlogs", dest: "content/devlog", layout: "page.shtml" },
  { src: "content/notes", dest: "content/notes", layout: "page.shtml" },
];
```

Change `REPO_URL`, `REPO_BRANCH`, and the mappings for the new site. The script hardcodes `light-cms/zine_content`; leaving it in a template is a bug.

## Front matter and schema

`content/.smd.ziggy-schema` defines the accepted page fields. The org schema includes:

- `title`, `description`
- `date` (RFC3339 string or Unix timestamp)
- `authors`, `tags`
- `layout`
- `aliases`, `alternatives`
- `translation_key`
- `draft`
- `forbid_subsections`
- `custom` (arbitrary map)

If the content repo starts producing fields the schema does not define, the convert step or the Zine build may fail. Decide explicitly what to do with LightCMS's default `isCJKLanguage`, `headless`, `weight`, and `keywords` fields. Either:

- strip them in `fetch.js` after conversion;
- add them to the Ziggy schema and the layouts;
- configure LightCMS to write only the fields Zine uses.

Do not assume unknown YAML keys are harmless; test the converted `.smd`.

## LightCMS usability

- The content repo has top-level `content`, so LightCMS shows one collection with `posts`, `notes`, and `devlogs` folders. That part works.
- LightCMS's editor is a Markdown editor. SuperMD syntax such as `[]($section.id('about'))` and `$link.page(...)` is not Markdown; writers can type it, but the visual editor may not preserve it.
- `.smd` files are not editable as normal Markdown in LightCMS. The content repo must hold `.md`; the site repo holds `.smd`.
- Images: `md2smd` copies referenced images when they are in the source directory; verify the paths survive conversion.
- Drafts: the Ziggy schema has `draft`, but the conversion must preserve it and the layout must honor it.

For a normal user who just wants a blog, recommend Hugo, Astro, Zola, Eleventy, or Jekyll instead. The Zine pipeline is worth it only when the user values Zine's SuperHTML model enough to maintain two repos and a conversion script.

## Build

```toml
# mise.toml
[tools]
"github:kristoff-it/ziggy" = "latest"
"github:kristoff-it/zine" = "latest"
"github:pratyay360/md2smd" = "latest"
node = "latest"
superhtml = "latest"

[settings]
experimental = true

[tasks.fetch]
run = "node scripts/fetch.js"

[tasks.build]
run = ["mise fetch", "zine release -f", "npx -y pagefind --site public"]
```

`zine release -f` writes `public/`. The org repo commits `public/`; for a template, add it to `.gitignore` and let CI publish it. Committed output hides broken builds.

## CI

The site workflow listens for `repository_dispatch` events from the content repo:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
  repository_dispatch:
    types: [content_update, blog_update]
```

Then it runs `mise trust`, `mise deps`, `mise install`, `mise run build`, and uploads `./public` to GitHub Pages. The content repo's dispatch is what makes a LightCMS save go live.

## Verify

```bash
rm -rf public
mise trust
mise fetch
mise run build
```

Then check:

- A converted `.smd` exists for each `.md` in the content repo.
- The `.layout` line is present.
- The Ziggy schema accepts the converted fields.
- `public/index.html` and a post page exist.
- Math assets and CSS load.
- The content repo dispatch actually triggers the site workflow.
- `REPO_URL` and `REPO_BRANCH` point at the user's repos, not the org examples.
