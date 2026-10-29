# Template Quality Checklist

Use this after building or porting a template, and before calling the work finished. A template is a product someone else will copy; “it builds on my machine” is not the bar.

## Definition of done

- [ ] The repository has a README that states the stack, content path, front matter fields, build command, deploy target, and the files writers should not delete.
- [ ] The sample content builds from a clean checkout with no private state.
- [ ] A LightCMS-shaped entry (YAML, quoted ISO date, human slug, `draft: false`, tag list) builds and appears at the expected URL.
- [ ] A `draft: true` entry is hidden, or the README says drafts are not supported.
- [ ] The deploy workflow publishes the correct output directory.
- [ ] The site works under its real base path, not only at `/`.
- [ ] No generated output, dependency folder, or secret is committed.
- [ ] The license and `.gitignore` are present.

## Automated checks

Run these from the repository root.

```bash
# 1. Front matter and slug contract. Use the real content root.
#    Run the script from this skill's scripts/ directory, or copy it into
#    the template first.
node /path/to/lightcms-skills/scripts/check-content.mjs content
#    or: node /path/to/lightcms-skills/scripts/check-content.mjs src
#    or: node /path/to/lightcms-skills/scripts/check-content.mjs _posts
#    mdBook only:
#    node /path/to/lightcms-skills/scripts/check-content.mjs src --allow-no-frontmatter

# 2. Clean build.
rm -rf node_modules _site public dist book .build-src
mise trust
mise run build

# 3. Confirm generated output is ignored.
git status --short
```

The checker is a fast heuristic, not a Markdown parser. It checks YAML/TOML front matter, required fields, ISO dates, boolean drafts, list tags, and epoch filenames. It does not validate MDX syntax, shortcodes, or rendered links.

## Per-generator smoke test

After the build, confirm the output exists at the path the deploy workflow uploads:

| Generator | Build output | Check                                                                     |
| --------- | ------------ | ------------------------------------------------------------------------- |
| Hugo      | `public/`    | `test -f public/index.html && test -f public/posts/first-post/index.html` |
| Astro     | `dist/`      | `test -f dist/index.html && test -f dist/blog/first-post/index.html`      |
| Zola      | `public/`    | `test -f public/index.html && test -f public/blog/first-post/index.html`  |
| Eleventy  | `_site/`     | `test -f _site/index.html && test -f _site/posts/first-post/index.html`   |
| Jekyll    | `_site/`     | `test -f _site/index.html && test -f _site/first-post/index.html`         |
| Zine      | `public/`    | `test -f public/index.html && test -f public/blog/first-post/index.html`  |
| mdBook    | `book/`      | `test -f book/index.html && test -f book/chapter_1.html`                  |

The exact post path depends on the slug and permalink rule. Adjust the filename, not the generator's output directory.

## Content contract review

- [ ] Every post lives under a top-level directory LightCMS discovers (`content`, `src`, `_posts`, or `posts`).
- [ ] The README names the collection and the writer-facing folder.
- [ ] Filenames are lowercase, hyphenated slugs. No `1792167272.md` samples remain.
- [ ] `title` is present and not a filename placeholder.
- [ ] `description` is a real sentence, not “TODO.”
- [ ] `date` is ISO 8601. LightCMS will normalize a date-only value to a UTC datetime.
- [ ] `draft` is a boolean. A string such as `draft: "false"` is a bug.
- [ ] `tags` is a list. A single string works in some generators but is not portable.
- [ ] If the generator needs a different taxonomy shape (Zola uses `taxonomies.tags`), the build mirrors the LightCMS field or the README says tag pages are not supported.
- [ ] Generator-specific fields are either used by the template or removed.
- [ ] Images have alt text and resolve under the base path.
- [ ] The sample content does not contain personal data, real analytics IDs, or a real deployment token.

For Jekyll specifically:

- [ ] `_plugins/nodate.rb` exists and is loaded by the build path (not GitHub Pages' safe-mode builder).
- [ ] `layout: post` is applied through `_config.yml` defaults.
- [ ] `baseurl` starts with `/` and matches the deploy path.

For mdBook specifically:

- [ ] Every chapter is listed in `SUMMARY.md`.
- [ ] A LightCMS-created file does not render its YAML front matter as text, or the README says mdBook is read-only.
- [ ] The CI artifact is `book/`.

## Deployment review

- [ ] The site config uses the real origin and base path.
- [ ] The CI workflow runs the same `mise run build` as a contributor.
- [ ] The workflow uploads the generator's real output directory.
- [ ] GitHub Pages is set to **GitHub Actions**, not “Deploy from a branch.”
- [ ] The workflow has only the permissions it needs (`contents: read`, `pages: write`, `id-token: write`).
- [ ] Deploys run on the default branch; pull requests build but do not deploy.
- [ ] Secrets are repository secrets, and their names are documented in the README.
- [ ] Split content/site repositories dispatch the correct event type and use a token that can reach the site repo.
- [ ] The deployed feed and canonical URLs use the deployed origin, not `localhost` or the template author's domain.
- [ ] The 404 page works on the host.

## Accessibility and SEO

- [ ] The page has a `lang` attribute.
- [ ] Every page has a unique `<title>` and a useful meta description.
- [ ] There is one visible `h1` per page.
- [ ] Navigation is keyboard reachable and has a visible focus style.
- [ ] Color contrast is readable in light and dark modes, if both exist.
- [ ] Images have alt text; decorative images have empty alt text.
- [ ] The feed, sitemap, and robots file exist only if they are correct; a broken promise is worse than no file.
- [ ] The template does not load third-party analytics, comments, or fonts without the user asking for them.

## Repository hygiene

- [ ] `README.md` explains how to preview, build, and deploy.
- [ ] `LICENSE` matches the intended license (the org templates use Apache-2.0).
- [ ] `.gitignore` covers the generator output, dependencies, caches, and local env files.
- [ ] `mise.toml` has `start`/`dev` and `build` tasks; optional tasks are documented.
- [ ] Sample content is clearly marked as sample content and is safe to delete.
- [ ] No personal domain, name, analytics ID, or comments embed remains.
- [ ] No `node_modules`, `_site`, `public`, `dist`, `book`, or `.sass-cache` is tracked.

## Common findings

| Symptom                         | Likely cause                                            | Fix                                                                     |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Site is blank after deploy      | Wrong artifact directory                                | Match the table above                                                   |
| CSS 404s only on GitHub Pages   | Root-relative asset paths                               | Use the generator's base-aware URL helper                               |
| LightCMS post does not appear   | Wrong collection folder, draft flag, or filename filter | Check the top-level collection and the generator's post reader          |
| Post URL is a timestamp         | Epoch slug left in place                                | Use a human slug; add a filename-independent rule if needed             |
| Tag pages are empty             | Generator expects a different taxonomy shape            | Mirror `tags` at build time, or document that tag pages are unsupported |
| Jekyll silently skips posts     | Default date-prefixed reader                            | Include `_plugins/nodate.rb` and build outside safe mode                |
| Zola build fails on a date      | Quoted/unquoted date mismatch in the pinned version     | Test with LightCMS's exact YAML; normalize before build if needed       |
| mdBook shows `---` and `title:` | YAML front matter rendered as Markdown                  | Add a strip step or do not use mdBook for LightCMS authoring            |
| Draft still public              | Generator does not honor `draft`                        | Implement a filter or move drafts out of the content root               |
| CI passes but deploy is stale   | Pages source is a branch, not Actions                   | Switch Pages to GitHub Actions and rerun                                |

## Handoff report

State:

1. The stack and why it was chosen.
2. The LightCMS collection and writer-facing content folder.
3. The front matter contract (required fields and any optional fields).
4. The slug rule (filename, computed permalink, or date prefix).
5. The build command and output directory.
6. The deploy target and required secret names.
7. What was verified, including the exact commands and the URL paths checked.
8. What could not be verified and what the user must do next.

Do not end with “the template is ready” unless the build and the rendered pages were actually checked.
