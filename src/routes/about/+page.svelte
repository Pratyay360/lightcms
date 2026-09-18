<svelte:head>
  <title>About | LightCMS</title>
  <meta
    name="description"
    content="Learn about LightCMS, a modern and simple CMS built with SvelteKit."
  />
</svelte:head>

<section class="mx-auto max-w-3xl px-4 py-8 sm:py-12" aria-labelledby="about-title">
  <p class="eyebrow font-semibold text-primary">About LightCMS</p>

  <article
    class="mt-6 space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground leading-7 shadow-xs sm:p-8"
  >
    <header class="space-y-2">
      <h1 id="about-title" class="text-2xl font-bold tracking-tight sm:text-3xl">
        A modern and easy to use CMS for managing content
      </h1>
      <h2 class="text-base font-medium text-muted-foreground sm:text-lg">
        Built with SvelteKit and TypeScript
      </h2>
    </header>

    <p>
      LightCMS is focused on simplicity, speed, and a great editing experience. It is created for anyone who wants to manage their content efficiently without unnecessary complexity.
      No matter the SSG no matter the tech stack ... if it supports frontmatter lightcms supports that.
    </p>

    <p>
      The main goal of LightCMS is to bridge the gap between people sharing their experiences and
      the internet itself. It's built to support the Jamstack approach to creating and managing
      content.
    </p>

    <footer>
      <a
        href="https://github.com/Pratyay360/lightcms"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Contribute on GitHub
      </a>
      <a
        href="https://pratyayupi.surge.sh"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Support financially
      </a>
    </footer>
  </article>
</section>
