---
name: lightcms-skills
description: Build, customize, audit, and publish LightCMS-compatible static-site templates. Use this skill whenever the user mentions LightCMS templates, a LightCMS-ready repository, or wants to create, port, or customize a blog or documentation starter for Hugo, Astro/Starlight, Zola, Eleventy, Jekyll, Zine, or mdBook. Also use it for content-folder layout, YAML front matter, slug and filename compatibility, mise tasks, GitHub Actions deployment, or verifying that a site still builds after LightCMS creates a file. Trigger it even when the user only says “make a template like the light-cms org” or “connect this site to LightCMS.”
license: Apache-2.0
metadata:
  labels: "lightcms,hugo,astro,zola,eleventy,jekyll,zine,mdbook,static-site,frontmatter"
  maintainer: light-cms
---

# LightCMS Templates

A LightCMS template is not just a working static site. It is a site whose content a non-technical writer can create, edit, and publish through LightCMS without breaking the build. The generator, the content folder, the front matter, the slug rules, and the deploy pipeline all have to agree.

This skill captures the conventions used by the `light-cms` template repositories and the failure modes that appear when a normal SSG project is connected to LightCMS.

## The contract

Treat these as the definition of “LightCMS-ready.” Each one exists because breaking it produces a failure a writer cannot fix from the editor.

1. **Content must live under a top-level directory LightCMS can discover.** LightCMS lists the repository root and treats every non-dot directory as a collection. A project with `content/posts/` is manageable as the `content` collection; a project with `src/posts/` is manageable as `src`. Hidden folders such as `.github` are ignored. Content buried outside a top-level directory is invisible to the CMS.
2. **Files must be Markdown or MDX with YAML front matter.** LightCMS writes `---` YAML. The generator must accept YAML, not only TOML or JSON. Zola, Hugo, Jekyll, Eleventy, and Astro all accept YAML; Zine needs a conversion step.
3. **The filename is the slug.** LightCMS exposes a Slug field on every entry and defaults it to a Unix timestamp. A human slug (`hello-world`) gives a clean URL everywhere. An epoch filename (`1792167272`) gives an ugly URL and, in Jekyll, fails to load at all without the `nodate` plugin.
4. **Use the common front matter first.** `title`, `description`, `date`, `draft`, and `tags` work across the templates and are the safest fields to depend on. Add `keywords`, `weight`, or generator-specific fields only when that generator actually uses them.
5. **Dates are ISO 8601 UTC.** LightCMS normalizes dates to `YYYY-MM-DDTHH:mm:ssZ`. A generator that rejects a quoted date, or expects a local timezone, needs a test with a LightCMS-created file before the template is considered done.
6. **Build and deploy are one command each.** Every template uses `mise.toml` with a `build` task and a CI workflow that runs that task from a clean checkout. The artifact path in CI must match the generator's real output directory.
7. **The first clone must build without private state.** No secrets, no local `node_modules`, no committed build output, no absolute paths. A template is a starting point someone else will copy.

## Route the request

Pick one primary route before editing. If the request is ambiguous, inspect the repository first; the presence of `hugo.toml`, `astro.config.mjs`, `_config.yml`, `eleventy.config.js`, `zola.toml`, `book.toml`, or `.smd` files usually settles it.

| Intent                                                 | Route                                                                                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create a new template from scratch                     | Read [references/content-contract.md](references/content-contract.md), then the matching SSG reference                                                         |
| Customize a copied template (rename, theme, add pages) | Read the matching SSG reference and [references/quality-checklist.md](references/quality-checklist.md)                                                         |
| Port an existing site to LightCMS                      | Read [references/content-contract.md](references/content-contract.md) and the matching SSG reference; focus on collection discovery and filename compatibility |
| Author or fix content in an existing LightCMS repo     | Read [references/content-contract.md](references/content-contract.md); only load an SSG reference when a build or URL issue appears                            |
| Deploy or fix CI                                       | Read [references/deployment.md](references/deployment.md) and the matching SSG reference                                                                       |
| Add a new SSG variant                                  | Follow the structure of an existing reference, then add a row to the matrix below and a link in this file                                                      |

## Choose the generator

Use the user's stated generator. If they have no preference, recommend based on the job rather than novelty.

| Generator             | Best for                                 | Native content root | Output    | URL source                   | Main LightCMS gotcha                                                    |
| --------------------- | ---------------------------------------- | ------------------- | --------- | ---------------------------- | ----------------------------------------------------------------------- |
| **Hugo**              | Large blogs, fast builds, built-in theme | `content/`          | `public/` | Filename or `url`            | `baseURL` must include the project path on GitHub Pages                 |
| **Astro + Starlight** | Docs, guides, small blogs                | `src/content/docs/` | `dist/`   | File path or `slug`          | Epoch filenames become epoch URLs unless a slug is set                  |
| **Zola**              | Single binary, no runtime                | `content/`          | `public/` | Filename, `slug`, or `path`  | YAML works, but date quoting and `sort_by = "date"` need testing        |
| **Eleventy**          | Minimal JS, full templating control      | `src/`              | `_site/`  | File path or `permalink`     | `pathPrefix` must match the deploy path                                 |
| **Jekyll**            | GitHub Pages heritage, Ruby              | `_posts/`           | `_site/`  | Filename/date or `permalink` | Default post reader rejects non-date filenames; include `nodate.rb`     |
| **Zine**              | SuperMD/zine-ssg experiments             | `content/`          | `public/` | File path                    | `.smd` is not Markdown; use the md2smd bridge or pick another generator |
| **mdBook**            | Documentation books                      | `src/`              | `book/`   | `SUMMARY.md`                 | New chapters need a `SUMMARY.md` entry; front matter is not native      |

## Build a template

1. **Inspect before writing.** List the repo, read its README, config, `mise.toml`, CI workflow, and one sample post. Preserve unrelated user changes. If the repo already has a generator, customize it instead of replacing it.
2. **Decide the collection mapping.** Name the top-level directory LightCMS will show and the folder inside it where writers will work. Examples: Hugo `content` → `content/posts`; Astro `src` → `src/content/docs/blog`; Jekyll `_posts` → files directly in `_posts`. Write this mapping in the README.
3. **Scaffold the minimum complete site.** Home page, about page, one section index, two sample posts, a 404 page, plain CSS, a favicon, and an RSS/feed where the generator supports it. No theme dependency unless the user asked for one.
4. **Add the shared front matter.** Use `title`, `description`, `date`, `draft`, and `tags` in every sample post. Use ISO dates. Add `keywords` when the generator emits meta keywords. Do not put Hugo-only fields in a non-Hugo template. If the generator expects taxonomies in a different shape (Zola nests them under `taxonomies`), add a build-time mirror rather than making writers fill two fields; see the Zola reference.
5. **Make slugs safe.** Document the Slug field in the README. For Jekyll, add `_plugins/nodate.rb` so arbitrary LightCMS filenames load. For Astro, either instruct writers to set a human slug or add a `generateId()` that derives an ID from `data.title`. For Eleventy, add a computed `permalink` if the project should not expose filenames.
6. **Wire `mise.toml`.** Provide at least `start`/`dev`, `build`, and, where useful, `install`, `index`, and `deploy`. Keep the task names consistent with the existing templates so contributors can move between repos.
7. **Wire CI.** Use a pinned `ghcr.io/jdx/mise` container, `mise trust`, `mise deps`, and the same `mise run build` a contributor uses. Upload the generator's real output directory. Grant only the permissions the deploy target needs.
8. **Write the README.** State the stack, the content path, the front matter fields, the build command, the deploy target, and the one thing a writer must not change. The README is part of the template's usability.
9. **Verify from a clean state.** Remove generated output and dependency folders, run the build, and inspect the rendered HTML for the home page, a post, the feed, and a 404. Check that the base path is correct for the intended host.

## Validate before handing off

Run the generator's build, then check:

- The home page links to the section and the sample posts.
- A post URL uses the human slug, not a timestamp.
- `draft: true` hides a post; `draft: false` shows it.
- Dates render correctly and do not shift by a day.
- The feed and 404 exist if the template claims them.
- Assets load when the site is served under its project path, not only at `/`.
- `mise run build` works from a fresh clone.
- The CI artifact path matches the build output.
- No `node_modules`, `_site`, `public`, `dist`, `book`, or `.sass-cache` is committed.
- The README's content path matches the actual directory.

Run the bundled checker against the content root before the build. The script lives in this skill's `scripts/` directory; use its absolute path, or copy it into the template if contributors should run it themselves:

```bash
node /path/to/lightcms-skills/scripts/check-content.mjs content
# or: node /path/to/lightcms-skills/scripts/check-content.mjs src
# or: node /path/to/lightcms-skills/scripts/check-content.mjs _posts
# mdBook only:
node /path/to/lightcms-skills/scripts/check-content.mjs src --allow-no-frontmatter
```

It catches missing titles/descriptions, non-ISO dates, string drafts, string tags, and epoch filenames. It accepts TOML front matter because Hugo and Zola templates often start that way, but LightCMS writes YAML; test at least one YAML entry.

For a content-only change, run the same build and check the changed page. A content change that breaks the build is still a template bug, not a writer mistake.

## Avoid these failure modes

- **Putting content only under a nested framework path with no explanation.** It is still reachable through the top-level collection, but the README must say so.
- **Relying on an epoch filename.** It is the default, not a requirement. Tell writers to replace it with a slug.
- **Adding a `slug` or `permalink` front matter field and expecting LightCMS to treat it as routing configuration.** LightCMS preserves unknown fields through its additional-fields drawer, but the normal form does not own those keys and a writer may not see them. Prefer the filename or a generator-level rule.
- **Using a `baseURL` or `base` that only works at the domain root.** GitHub Pages project sites live under `/<repo>/`; Cloudflare Pages and Vercel usually live at `/`.
- **Committing generated output.** It hides broken builds and creates noisy diffs.
- **Adding a framework or theme for a one-page starter.** The existing templates are intentionally plain and dependency-light.
- **Copying a deployment token into the repo.** Use repository secrets and document the secret name.

## References

| File                                                               | Read it when                                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [references/content-contract.md](references/content-contract.md)   | You need the exact LightCMS discovery, front matter, slug, or content-authoring rules   |
| [references/hugo.md](references/hugo.md)                           | Building or customizing the Hugo template (including the richer `blogtemplate` variant) |
| [references/astro.md](references/astro.md)                         | Building or customizing the Astro/Starlight template                                    |
| [references/zola.md](references/zola.md)                           | Building or customizing the Zola template                                               |
| [references/eleventy.md](references/eleventy.md)                   | Building or customizing the Eleventy template                                           |
| [references/jekyll.md](references/jekyll.md)                       | Building or customizing the Jekyll template, especially filename/date handling          |
| [references/zine.md](references/zine.md)                           | Working with the Zine two-repo setup or converting Markdown to SuperMD                  |
| [references/mdbook.md](references/mdbook.md)                       | Building or customizing the mdBook documentation template                               |
| [references/deployment.md](references/deployment.md)               | Wiring GitHub Pages, Cloudflare Pages, Vercel, Netlify, or Surge                        |
| [references/quality-checklist.md](references/quality-checklist.md) | Reviewing a finished template or a port                                                 |

## What a finished handoff looks like

Report the stack, the content path LightCMS will show, the front matter contract, the build command, the deploy target, and the verification you ran. If something could not be verified, say what it was and why. Do not claim a template is finished because the files exist; claim it when the build and the rendered pages have been checked.
