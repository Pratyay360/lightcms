# Eleventy Template Reference

Eleventy is the choice when the user wants full templating control with very little JavaScript. The `eleventy_blog` template is a small Nunjucks site with a Markdown post collection.

## Layout

```text
.
├── eleventy.config.js
├── package.json
├── src/
│   ├── _includes/
│   │   ├── base.njk
│   │   └── post.njk
│   ├── about.md
│   ├── blog.njk
│   ├── css/style.css
│   ├── index.njk
│   └── posts/
│       ├── posts.json          # applies post.njk to every post
│       ├── first-post.md
│       └── second-post.md
├── .github/workflows/ci.yml
├── mise.toml
├── LICENSE
└── README.md
```

LightCMS shows the top-level `src` collection; writers work in the `posts` folder.

## Configuration

```js
// eleventy.config.js
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  eleventyConfig.addCollection("posts", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/posts/*.{md,njk,html}")
      .filter((post) => !post.data.draft)
      .sort((a, b) => a.date - b.date);
  });

  eleventyConfig.addFilter("readableDate", (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    pathPrefix: "/eleventy_blog/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
```

Change `pathPrefix` to the real deploy path:

- GitHub Pages project site: `"/<repo>/"`.
- User site or custom domain: `"/"`.

The templates use the `url` filter for links, which applies `pathPrefix`. Hand-written absolute paths do not.

## Content and front matter

```markdown
---
title: First Post
description: What this starter includes.
date: '2026-01-10T00:00:00Z'
draft: false
tags:
  - intro
---

Body text.
```

The directory data file applies the layout automatically:

```json
{
  "layout": "post.njk"
}
```

A LightCMS-created file in `src/posts/` inherits that layout without the writer adding `layout` to the front matter. Keep the data file when changing the post layout.

`tags` is an Eleventy concept as well as a content field. A list such as `tags: [intro, static-sites]` creates Eleventy collections for those names. The `posts` collection here is built from the directory glob, not from `tags: posts`, so writers do not need a special tag.

## URLs and slugs

Eleventy derives the URL from the file path:

```text
src/posts/hello-world.md  →  /posts/hello-world/
```

A timestamp filename becomes `/posts/1792167272/`. Two ways to prevent that:

1. **Preferred:** tell writers to set a human slug in LightCMS. The filename is the URL.
2. Add a computed permalink in `src/posts/posts.11tydata.js`:

```js
export default {
  layout: "post.njk",
  eleventyComputed: {
    permalink: (data) => {
      const source = data.slug || data.title || data.page.fileSlug;
      const slug = String(source)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return `/posts/${slug}/`;
    },
  },
};
```

The computed permalink makes the URL follow the title. That is friendlier for writers but means changing a title changes a URL. Choose one rule and document it. If the project needs stable URLs, keep filename slugs.

LightCMS's `url` field is not wired to Eleventy by default. If you want a manual override, read `data.url` in the computed permalink before falling back to the title.

## Drafts and dates

- The collection filters `draft: true`, so drafts do not appear in lists.
- Eleventy still writes the draft page itself unless it is also excluded from the build. If a draft must not be public, add `eleventyExcludeFromCollections` or move it outside `src/posts`.
- `date` accepts ISO strings. The collection sorts ascending and the templates reverse the list for newest-first display.
- A missing `date` gives the file's creation time, which can produce unstable ordering. Keep a date on every post.

## Build and CI

```toml
# mise.toml
[tools]
"github:sass/dart-sass" = "latest"
bun = "latest"

[tasks]
install = "bun install"
start = "bun run dev"
build = "bun run build"
```

`bun run build` writes `_site/`.

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
          mise run install
          mise run build
      - uses: actions/upload-pages-artifact@main
        with:
          path: ./_site
      - id: deployment
        uses: actions/deploy-pages@main
```

## Templates and assets

- `src/_includes/base.njk` owns the head, nav, and footer.
- `src/_includes/post.njk` wraps a post and links back to `/blog/`.
- `src/blog.njk` and `src/index.njk` reverse the collection for newest-first order.
- Passthrough copies `src/css` to `/css` and `src/assets` to `/assets`. Keep image URLs consistent with those paths.
- `markdownTemplateEngine: "njk"` means Nunjucks syntax inside Markdown is executed. That is useful but surprising; document it if writers use `{{ }}` in prose.

## Verify

```bash
rm -rf _site node_modules
mise trust
mise run install
mise run build
```

Then check:

- `_site/index.html` and `_site/blog/index.html` exist.
- `_site/posts/first-post/index.html` exists.
- A `draft: true` post is absent from the lists.
- Links include the configured `pathPrefix`.
- CSS and images load under the project path.
- The RSS feed exists only if the template adds one; the org template does not.
