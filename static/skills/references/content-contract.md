# The LightCMS Content Contract

This is the shared layer every template must satisfy. The SSG references assume these rules.

## How LightCMS finds content

LightCMS does not use a fixed content root. When a repository is selected, it lists the repository root and treats each non-dot directory as a collection:

```text
my-site/
├── content/          → collection "content"
│   ├── posts/        → folder "posts" inside that collection
│   └── about.md
├── src/              → collection "src"
├── _posts/           → collection "_posts"
├── .github/          → ignored (starts with a dot)
└── README.md         → not a collection
```

The collection path is the directory name. Entries are addressed as:

```text
<collection>/<optional-folder>/<slug>.md
```

The default built-in collection is `posts`, which resolves to a root-level `posts/` directory. Other names are discovered from the repository, so a template does not have to create a root `posts/` folder. What matters is that the content directory is top-level and visible.

### Choosing the collection name

Use the generator's natural content root unless there is a strong reason not to:

| Generator | Top-level collection | Writer-facing folder |
| --- | --- | --- |
| Hugo | `content` | `content/posts` |
| Astro + Starlight | `src` | `src/content/docs/blog` |
| Zola | `content` | `content/blog` |
| Eleventy | `src` | `src/posts` |
| Jekyll | `_posts` | directly in `_posts` |
| Zine | `content` | `content/blog` |
| mdBook | `src` | `src` (chapters listed in `SUMMARY.md`) |

Do not move a framework's content root just to make the collection name prettier. A `content` collection with a `posts` folder is understandable and keeps the SSG's conventions intact. Document the mapping in the README.

## File names and slugs

LightCMS always shows a **Slug** field. It defaults to a Unix timestamp:

```text
1792167272.md
```

That default is convenient for the CMS and bad for readers. A timestamp becomes the URL segment in Hugo, Zola, Eleventy, Jekyll, and Astro unless the template overrides it. It also makes the repository hard to browse.

Use a lowercase, hyphenated slug:

```text
hello-world.md
writing-a-static-blog.md
```

LightCMS validates slugs with lowercase letters, numbers, and hyphens only. It rejects slashes, spaces, uppercase letters, and punctuation.

### What each generator does with a filename

| Generator | Default URL from `hello-world.md` | Override available |
| --- | --- | --- |
| Hugo | `/posts/hello-world/` | `url` front matter, or `slug` |
| Astro/Starlight | `/blog/hello-world/` | `slug` front matter or `docsLoader({ generateId })` |
| Zola | `/blog/hello-world/` | `slug` or `path` front matter |
| Eleventy | `/posts/hello-world/` | `permalink` front matter or computed data |
| Jekyll | `/hello-world/` | `permalink` front matter or config defaults |
| mdBook | `hello-world.html` | Only via `SUMMARY.md` and output config |

For every one of these, the simplest reliable rule is: **set a human slug when creating the entry.** Do not build a template that depends on the timestamp default.

### Jekyll is the exception that needs code

Jekyll's default post reader only accepts filenames shaped like `YYYY-MM-DD-title.md`. A LightCMS entry named `hello-world.md` or `1792167272.md` is skipped. Include this plugin, copied from the `jekyll_blog` template:

```ruby
# _plugins/nodate.rb
class Jekyll::PostReader
  def read_posts(dir)
    read_publishable(dir, "_posts", /.*\.md$/)
  end

  def read_drafts(dir)
    read_publishable(dir, "_drafts", /.*\.md$/)
  end
end
```

The plugin accepts any `.md` filename in `_posts/`. Keep the post layout in `_config.yml` defaults so writers do not have to add `layout: post` to every file:

```yaml
defaults:
  - scope:
      path: ""
      type: posts
    values:
      layout: post
```

## Front matter

LightCMS reads and writes YAML front matter. A normal entry looks like this:

```markdown
---
title: A Human-Readable Title
description: One sentence used for SEO and cards.
date: '2026-10-14T10:00:00Z'
draft: false
tags:
  - lightcms
  - static-sites
keywords:
  - git-based cms
---

The body starts here.
```

### Fields that work everywhere

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Required by every template; also the editor's primary label |
| `description` | string | Meta description and list-page summary |
| `date` | datetime | LightCMS writes ISO 8601 UTC; quote it in YAML |
| `draft` | boolean | `true` hides the entry in generators that honor drafts |
| `tags` | string list | Used for taxonomies when the generator has them; Zola needs a nested mirror before tag pages work |
| `keywords` | string list | Safe extra metadata; not all themes render it |

### Fields to add only when the generator uses them

| Field | Used by | Caution |
| --- | --- | --- |
| `weight` | Hugo, Zola | Changes ordering; do not add by default |
| `slug` | Zola, Astro/Starlight | LightCMS preserves it as an additional field, but routing should not depend on that |
| `url` | Hugo | A configured LightCMS field, so it survives edits |
| `permalink` | Jekyll, Eleventy | Not a built-in LightCMS field; verify it survives an edit |
| `layout` | Jekyll, Eleventy | Better set through config defaults or directory data |
| `isCJKLanguage`, `headless` | Hugo | Hugo-specific; omit from others |
| `publishDate`, `expiryDate` | Hugo | Scheduling only works if the template honors it |

### Date rules

LightCMS normalizes dates to UTC and removes milliseconds:

```text
2026-10-14T10:00:00Z
```

Write dates in that shape. Avoid:

- unquoted YAML dates (`date: 2026-10-14`) when the generator expects a datetime;
- timezone-less local times;
- `YYYY/MM/DD`;
- dates embedded in filenames as the only date source.

Test with a date that is near midnight UTC; a template that shifts the day is a bug.

### Custom fields

LightCMS's editor has an additional-fields drawer for keys outside the built-in form. Those keys are preserved when the entry is saved. However, they are not part of the CMS's routing or validation. Use them for optional metadata, not for the only way a page gets a URL.

If a template depends on a custom key, add it to the sample posts and document it in the README. If the key is required, the build will fail when a writer omits it; prefer a generator default instead.

## Content that is not a post

Not every Markdown file is an entry:

- `_index.md` is a section index in Hugo and Zola.
- `index.md` may be a bundle or a section page.
- `SUMMARY.md` is mdBook navigation.
- `README.md` at the root is project documentation.
- Files starting with `_` are ignored by Starlight's `docsLoader`.
- Files starting with `.` are ignored by LightCMS discovery.

Put these files where the generator expects them, and explain in the README which files writers should not delete. Do not hide the section index from LightCMS if deleting it breaks the site.

## Images and other assets

The templates use plain Markdown images and repo-relative assets:

```markdown
![Alt text](/images/example.jpg)
```

LightCMS can insert image URLs and can upload images depending on the deployment. Keep the path style consistent with the SSG:

- Hugo: `static/images/...` is served at `/images/...`.
- Zola: `static/images/...` is served at `/images/...`.
- Eleventy: `src/assets/...` is copied to `/assets/...` by the passthrough rule.
- Astro/Starlight: `public/...` is served at the base path; `src/assets/...` is processed.
- Jekyll: `assets/...` is served at `/assets/...`.
- mdBook: images can live beside the chapter or under `src/`.

Always include alt text. A missing image should not break the build; use a normal Markdown image rather than a shortcode that only one generator understands.

## Drafts and scheduling

`draft: true` is the portable draft flag. The generator must actually honor it:

- Hugo: `draft` is native; drafts are excluded unless `--buildDrafts`.
- Zola: `draft` is native; excluded unless `--drafts`.
- Eleventy: filter on `draft` in the collection (the template does).
- Jekyll: `draft: true` in `_posts` is not the same as `_drafts/`; use `published: false` or a collection filter if needed.
- Astro/Starlight: `draft` is native; excluded from production builds and autogenerated sidebars, visible in dev. Filter a custom blog index if it should hide drafts locally.
- mdBook: no native draft flag; do not promise one.

If the user asks for scheduled publishing, verify the generator's real mechanism. Do not imply that `publishDate` works in a generator that ignores it.

## The publishing loop

A LightCMS edit should produce this sequence:

1. The writer edits an entry and saves.
2. LightCMS commits a `.md` file with YAML front matter to the selected branch.
3. The repository's CI workflow runs on that push.
4. `mise run build` produces the site.
5. The deploy step publishes the output.

A template is not finished until steps 3–5 work from a clean clone. Test the same path a writer will use: create a file with a human slug, a quoted ISO date, `draft: false`, and a tag list; push it; confirm the page appears.

## Content-authoring checklist

When creating or fixing an entry:

- [ ] The file lives under a top-level collection directory.
- [ ] The filename is a lowercase, hyphenated slug, not a timestamp.
- [ ] `title` is present and human-readable.
- [ ] `description` is one sentence and useful in search results.
- [ ] `date` is quoted ISO 8601 UTC.
- [ ] `draft` is a boolean, not a string.
- [ ] `tags` is a YAML list, not a comma-separated string.
- [ ] The body uses Markdown the target generator understands.
- [ ] The build passes and the page appears at the expected URL.
