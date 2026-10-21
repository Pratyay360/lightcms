<script lang="ts">
  import GitBranch from "@lucide/svelte/icons/git-branch";
  import Heart from "@lucide/svelte/icons/heart";
  import Mail from "@lucide/svelte/icons/mail";
  import MessageCircle from "@lucide/svelte/icons/message-circle";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import { Button } from "$lib/components/ui/button";
  import { SITE } from "$lib/seo";

  type FooterAction = {
    href: string;
    label: string;
    icon: typeof GitBranch;
    external: boolean;
  };

  const footerActions: FooterAction[] = [
    { href: SITE.repository, label: "Contribute on GitHub", icon: GitBranch, external: true },
    { href: SITE.sponsorUrl, label: "Support financially", icon: Heart, external: true },
    { href: SITE.contactFormUrl, label: "Contact form", icon: MessageCircle, external: true },
    { href: `mailto:${SITE.contactEmail}`, label: "Email Us", icon: Mail, external: false },
    { href: "/privacy", label: "Privacy policy", icon: ShieldCheck, external: false },
  ];
</script>

<section class="mx-auto max-w-3xl px-4 py-8 sm:py-12" aria-labelledby="about-title">
  <p class="eyebrow font-semibold text-primary">About LightCMS</p>

  <article
    class="mt-6 space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground leading-7 shadow-xs sm:p-8"
  >
    <header class="space-y-2">
      <h1 id="about-title" class="text-2xl font-bold tracking-tight sm:text-3xl">
        A modern and easy to use CMS for managing and crafting content
      </h1>
      <h2 class="text-base font-medium text-muted-foreground sm:text-lg">
        Built with SvelteKit, TypeScript, and viteplus
      </h2>
    </header>

    <p>
      LightCMS is focused on simplicity, speed, and great experience for both managing and creating content. It is created for
      anyone who wants to share their experiences and knowledge on the web without unnecessary complexity. No
      matter the SSG(vendor neutral), no matter the tech stack, if it supports frontmatter schema, Lightcms can be used with it.
    </p>

    <p>
      The goal of LightCMS is to bridge the gap between people willing to sharing their experiences and
      the internet itself. It's built to support the Jamstack approach for creating, managing and sharing content.
    </p>

    <footer class="space-y-4 border-t border-border pt-6">
      <nav class="flex flex-wrap gap-3" aria-label="About page links">
        {#each footerActions as action (action.label)}
          <Button
            href={action.href}
            variant="outline"
            class="gap-2"
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noopener noreferrer" : undefined}
          >
            <action.icon size={15} />
            {action.label}
          </Button>
        {/each}
      </nav>

      <p class="text-xs text-muted-foreground">
        Source code:
        <a
          href={SITE.repository}
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-foreground"
        >
          {SITE.repository.replace("https://", "")}
        </a>
      </p>
    </footer>
  </article>
</section>
