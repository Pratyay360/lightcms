# Deployment Reference

The template's build command is the contract. Every host should run the same command a contributor runs locally, and every host should publish the generator's real output directory.

## Output directories

| Generator | Command | Publish |
| --- | --- | --- |
| Hugo | `mise run build` (`hugo`) | `public/` |
| Astro | `mise run build` (`astro build`) | `dist/` |
| Zola | `mise run build` (`zola build`) | `public/` |
| Eleventy | `mise run build` (`eleventy`) | `_site/` |
| Jekyll | `bundle exec jekyll build` | `_site/` |
| Zine | `mise run build` (`zine release -f`) | `public/` |
| mdBook | `mise run build` (`mdbook build`) | `book/` |

A wrong publish directory is the most common “the build succeeded but the site is blank” failure.

## Base path and URL

Set the site's base path before deploying:

| Host | Typical public URL | Base setting |
| --- | --- | --- |
| GitHub Pages project site | `https://<user>.github.io/<repo>/` | Hugo `baseURL` includes `/<repo>/`; Astro `base: "/<repo>"`; Eleventy `pathPrefix: "/<repo>/"`; Jekyll `baseurl: "/<repo>"`; Zola `base_url` includes `/<repo>` |
| GitHub Pages user/org site | `https://<user>.github.io/` | Root path |
| Cloudflare Pages | `https://<project>.pages.dev/` | Root path |
| Vercel | `https://<project>.vercel.app/` | Root path |
| Netlify | `https://<project>.netlify.app/` | Root path |
| Custom domain | The domain root | Root path |

If assets 404 only on the deployed site, the base path is wrong. If they 404 only locally, the local server is not serving under the base path; test with the production-style command.

## GitHub Pages with Actions

The org templates use a mise container and upload an artifact:

```yaml
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
          path: ./public
      - id: deployment
        uses: actions/deploy-pages@main
```

Requirements:

1. The repository's **Settings → Pages → Build and deployment → Source** must be **GitHub Actions**, not “Deploy from a branch.”
2. The workflow needs `pages: write` and `id-token: write`.
3. The artifact path must match the generator output.
4. The workflow must run on pushes to the default branch, or on the branch configured for Pages.
5. If the repo is a project site, the site config must include the repo name in the base path.

Pinning actions to a tag or commit SHA is safer than `@main` for a template others will copy. The org templates use `@main` for freshness; a production template should pin.

### `repository_dispatch` for split repos

When content lives in a separate repository, the content repo can trigger the site build:

```yaml
on:
  repository_dispatch:
    types: [content_update, blog_update]
```

The content repo dispatches:

```bash
gh api --method POST /repos/<owner>/<site-repo>/dispatches \
  -f event_type=content_update
```

The token must be a repository secret with permission to dispatch. Document the secret name (`DEPLOY` in the Zine template) and never commit it.

## Cloudflare Pages

Connect the repository in the Cloudflare dashboard:

- Framework preset: the generator, or “None” for Hugo/Zola/mdBook.
- Build command: the same `mise run build`, or the native command if the environment already has the tool.
- Build output directory: the table above.
- Environment variables: set `MISE_EXPERIMENTAL=true` if the project uses experimental mise features.

Cloudflare Pages does not run the repository's GitHub Actions workflow; it runs its own build. Either keep both paths working or remove the unused workflow to avoid confusion.

For a project hosted at the root of `*.pages.dev`, use a root base path. A custom domain is also a root path.

## Vercel

Vercel detects Astro, Eleventy, Hugo, and Jekyll. Set:

- Build command: `mise run build`, or the native command.
- Output directory: the table above.
- Install command: `mise deps` / `mise install` if the project depends on mise; otherwise the package manager's install.

Vercel's build image may not have Hugo, Zola, or mdBook preinstalled. Use `mise` or a custom install step, and test the first deploy rather than assuming the framework preset installs the binary.

## Netlify

Set:

- Build command: `mise run build`.
- Publish directory: the table above.
- Environment: the generator's version if Netlify's default is older.

For Hugo, Netlify often has an older Hugo than the template expects. Pin the version with a `HUGO_VERSION` environment variable or use mise.

## Surge

The `blogtemplate` uses Surge:

```toml
[tasks]
build = "hugo"
index = "npx pagefind --site public"
deploy = "surge publish ./public blogtemplate.surge.sh"
```

- `SURGE_TOKEN` must be a repository secret.
- Change the domain in the task; do not deploy to the org's example domain.
- Surge is fine for a demo, but a template should not require a paid account or a personal domain.

## CI hygiene

- Run the build on pull requests as well as pushes, but only deploy on the default branch.
- Cache the tool installs (`~/.local/share/mise`, `~/.cache/mise`), not the site output.
- Run `mise trust` before `mise run`; a copied template has no trust entry.
- Use `mise deps` to install lockfile dependencies; use `mise install` for the tools.
- Keep `concurrency` so two pushes do not race the same Pages deployment.
- Do not upload `node_modules`, caches, or secrets in the artifact.
- If the build needs a token (Surge, a private content repo), pass it as an environment variable from `secrets`, never as a command-line literal.

## Verify the deployed result

After the first deploy:

- Open the home page and a post from a private window.
- Check the browser console for 404s on CSS, fonts, and images.
- Check that canonical URLs and feeds use the deployed origin, not `localhost` or the org's domain.
- Open a draft URL; it should 404 if drafts are excluded.
- Push a LightCMS-style entry and confirm the workflow runs and the page appears.
- Confirm the 404 page works on the host (some hosts need a `404.html` at the root).

If a deploy fails, read the first error in the build log, not the last. A missing tool usually appears before the generator's own error.
