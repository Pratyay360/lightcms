# Jekyll Template Reference

Jekyll is the classic Ruby generator with a long GitHub Pages history. It is a good fit when the user wants a familiar blog structure, a simple Liquid theme, and an RSS feed with little configuration.

The `jekyll_blog` template also contains the compatibility plugin that makes Jekyll accept LightCMS filenames.

## Layout

```text
.
├── _config.yml
├── _layouts/
│   ├── default.html
│   └── post.html
├── _plugins/nodate.rb
├── _posts/
│   ├── first-post.md
│   └── second-post.md
├── assets/css/style.css
├── about.md
├── index.md
├── Gemfile
├── Gemfile.lock
├── compose.yml
├── .github/workflows/ci.yml
├── LICENSE
└── README.md
```

LightCMS shows the top-level `_posts` collection. Post files live directly in `_posts/`.

## The filename problem

Jekyll's default post reader only recognizes:

```text
_posts/2026-01-10-hello-world.md
```

It ignores `_posts/hello-world.md` and `_posts/1792167272.md`. LightCMS creates the latter by default and a human slug creates the former, so a stock Jekyll site silently drops LightCMS posts.

The template fixes this with `_plugins/nodate.rb`:

```ruby
class Jekyll::PostReader
  def read_posts(dir)
    read_publishable(dir, "_posts", /.*\.md$/)
  end

  def read_drafts(dir)
    read_publishable(dir, "_drafts", /.*\.md$/)
  end
end
```

Keep the file. Without it, the template is not LightCMS-compatible.

### GitHub Pages caveat

GitHub Pages' built-in Jekyll build runs in safe mode and does not load `_plugins/`. The org template avoids that by building in a `jekyll/jekyll` container and uploading the artifact, so the plugin runs. If the user chooses GitHub Pages' automatic Jekyll build instead, the plugin will not load; use the Actions workflow or a date-prefixed slug convention.

## Configuration

```yaml
# _config.yml
title: My Blog
description: A short description.
baseurl: /my-blog
url: https://example.github.io
markdown: kramdown
plugins:
  - jekyll-feed

defaults:
  - scope:
      path: ""
      type: posts
    values:
      layout: post
```

- `baseurl` must start with `/` and match the project path on GitHub Pages.
- `url` is the origin only.
- `layout: post` is applied by default so LightCMS entries do not need a layout field.
- `jekyll-feed` generates `/feed.xml` and the `feed_meta` tag in the default layout adds the link.

Add `permalink: /:title/` to the post defaults if the site should not expose dates in URLs:

```yaml
defaults:
  - scope:
      path: ""
      type: posts
    values:
      layout: post
      permalink: /:title/
```

Test the result. Jekyll's `:title` placeholder is derived from the filename, so a human slug gives a clean URL.

## Front matter

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

Jekyll uses `date` for ordering. The quoted ISO string is valid.

Jekyll's `draft` key is not the same as its `_drafts/` folder. A `draft: true` post in `_posts/` is still built unless the theme or a plugin filters it. If the template promises drafts, use one of these instead:

- put drafts in `_drafts/` and build with `--drafts` only for previews;
- use `published: false` (Jekyll's native flag);
- filter `site.posts` in Liquid.

Do not claim `draft: true` hides a post without implementing it.

## Build and preview

```bash
bundle install
bundle exec jekyll serve   # http://localhost:4000
bundle exec jekyll build   # _site/
```

The template also has a Docker Compose file:

```yaml
services:
  jekyll:
    image: docker.io/jekyll/jekyll:latest
    working_dir: /srv/jekyll
    ports:
      - "4000:4000"
      - "35729:35729"
    command: bundle exec jekyll build --incremental
    volumes:
      - .:/srv/jekyll:Z
```

`compose.yml` builds rather than serves; add `bundle exec jekyll serve --host 0.0.0.0` if the container should serve the site.

## CI

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
      image: docker.io/jekyll/jekyll:latest
    steps:
      - uses: actions/checkout@main
      - uses: actions/cache@main
        with:
          path: /srv/jekyll
          key: jekyll-${{ runner.os }}-${{ hashFiles('Gemfile.lock') }}
          restore-keys: jekyll-${{ runner.os }}-
      - run: bundle exec jekyll build --incremental
      - uses: actions/upload-pages-artifact@main
        with:
          path: ./_site
      - id: deployment
        uses: actions/deploy-pages@main
```

The `jekyll/jekyll` image includes the toolchain, so this workflow does not need mise. If the project uses mise for Ruby, switch to the mise container and run the same `bundle exec` command.

## Templates and assets

- `_layouts/default.html` owns the head, nav, footer, and `feed_meta`.
- `_layouts/post.html` renders the title, date, description, and body.
- `index.md` loops `site.posts`; `about.md` uses `permalink: /about/`.
- `assets/css/style.css` is plain CSS. Reference it with `relative_url` so `baseurl` is respected.
- Images in `assets/` are served under the base URL; use `relative_url` for hand-written paths.

## Verify

```bash
rm -rf _site .jekyll-cache
bundle install
bundle exec jekyll build
```

Then check:

- `_site/index.html` lists both sample posts.
- `_site/first-post/index.html` exists with the human slug.
- A LightCMS-style entry named `hello-world.md` is picked up (the plugin works).
- `_site/feed.xml` exists.
- A `published: false` post is absent.
- CSS and links work under `baseurl`, not only at the domain root.
