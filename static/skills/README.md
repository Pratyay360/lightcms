# LightCMS Skills

A skill for building, customizing, porting, and publishing on static site templates possible with lightcms. It encodes the conventions shared by the `light-cms` template repositories and the compatibility issues that appear when a normal Hugo, Astro, Zola, Eleventy, Jekyll, Zine, or mdBook project is connected to LightCMS.

The skill is the repository root: `SKILL.md` is the entry point, `references/` holds per-generator deep dives, and `scripts/check-content.mjs` validates the content contract.

## Install

Copy or symlink this directory into the skills directory used by your agent. For OpenCode:

```bash
ln -s /path/to/lightcms-skills ~/.config/opencode/skills/lightcms-skills
```

The folder name and the `name` in `SKILL.md` should match. If your setup discovers skills from another directory, keep the same layout: a folder containing `SKILL.md`, `references/`, and `scripts/`.

## What it covers

- Creating a new starter with home, about, section index, sample posts, 404, CSS, `mise.toml`, and GitHub Actions.
- Customizing a copied template without breaking LightCMS discovery, front matter, or deploy paths.
- Porting an existing SSG site: finding the top-level collection, fixing epoch filenames, checking YAML dates, and wiring CI.
- Authoring content: required fields, ISO dates, drafts, tags, images, and the Jekyll `nodate` plugin.
- Deploying to GitHub Pages, Cloudflare Pages, Vercel, Netlify, or Surge.
- Reviewing a finished template with the quality checklist.

## The content checker

```bash
node scripts/check-content.mjs content
node scripts/check-content.mjs src
node scripts/check-content.mjs _posts
node scripts/check-content.mjs src --allow-no-frontmatter   # mdBook
```

It exits non-zero on missing titles/descriptions, invalid dates, non-boolean drafts, and epoch filenames. TOML front matter is accepted because Hugo and Zola samples often use it; LightCMS itself writes YAML, so always test at least one YAML entry.

## Layout

```text
SKILL.md
references/
  content-contract.md
  hugo.md
  astro.md
  zola.md
  eleventy.md
  jekyll.md
  zine.md
  mdbook.md
  deployment.md
  quality-checklist.md
scripts/
  check-content.mjs
```

## Scope

The references describe the public `light-cms` template patterns, not a frozen API. Pin tool versions in real projects and re-run the build after upgrades. Zine is documented because the org has a Zine template, but the two-repository md2smd pipeline is intentionally presented as a specialist option rather than the default.

## License

Apache-2.0, matching the template repositories.
