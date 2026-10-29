<script lang="ts">
  import { LeafyGreen } from "@lucide/svelte";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Bookmark from "@lucide/svelte/icons/bookmark";
  import Check from "@lucide/svelte/icons/check";
  import CircleHelp from "@lucide/svelte/icons/circle-help";
  import Database from "@lucide/svelte/icons/database";
  import FileText from "@lucide/svelte/icons/file-text";
  import GitBranch from "@lucide/svelte/icons/git-branch";
  import Layers from "@lucide/svelte/icons/layers";
  import Pencil from "@lucide/svelte/icons/pencil";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Zap from "@lucide/svelte/icons/zap";
</script>

<div class="space-y-16 py-6 lg:py-12">
  <section
    id="hero"
    class="grid min-h-[calc(100vh-16rem)] items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]"
  >
    <div class="max-w-2xl space-y-8">
      <div
        class="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground"
      >
        <Sparkles size={13} class="animate-pulse text-primary" />
        <span>Easy to use</span>
      </div>

      <div class="space-y-4">
        <h1
          class="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          Fall back in love with writing again.
        </h1>
        <p class="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Giving everyone a voice to speak. A <strong>lightweight cms</strong> and Git backed headless content workspace for sharing experiences over the web with zero friction.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <a
          class="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
          href="/cms"
        >
          Open workspace
          <GitBranch size={17} />
        </a>
        <a
          class="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-xs transition-transform hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
          href="/demo"
        >
          Try the demo
        </a>
      </div>
    </div>

    <div class="relative lg:block">
      <div
        class="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3"
        >
          <div class="flex items-center gap-1.5">
            <span class="h-3 w-3 rounded-full bg-red-500/80"></span>
            <span class="h-3 w-3 rounded-full bg-yellow-500/80"></span>
            <span class="h-3 w-3 rounded-full bg-green-500/80"></span>
          </div>
          <div
            class="flex items-center gap-2 rounded bg-muted/60 px-3 py-1 font-mono text-xs text-muted-foreground"
          >
            <GitBranch size={12} class="text-primary" />
            <span>main: content/posts/hello-world.md</span>
          </div>
          <div
            class="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
          >
            <Check size={10} />
            <span>Synced</span>
          </div>
        </div>
        <div class="grid h-100 place-items-center bg-muted/20 p-8 text-center">
          <div class="space-y-2">
            <FileText size={24} class="mx-auto text-muted-foreground" />
            <p class="text-xs text-muted-foreground">Workspace preview</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="features" class="space-y-8 border-t border-border pt-12 sm:pt-16">
    <div class="max-w-3xl space-y-3">
      <h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        A developer friendly, open source Git CMS for modern static sites
      </h2>
      <p class="text-sm leading-relaxed text-muted-foreground sm:text-base">
        LightCMS brings together the straightforward simplicity of a <strong>flat file cms</strong> with the rock-solid reliability of Git version control. Manage your Markdown articles and SSG front matter with total autonomy.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        class="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs"
      >
        <Pencil size={20} class="text-primary" />
        <h3 class="text-base font-bold text-foreground">Awesome git markdown editor</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Edit posts with an intuitive <strong>git markdown editor</strong> featuring rich formatting, live syntax highlighting, and distractions removed so your ideas flow freely.
        </p>
      </div>

      <div
        class="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs"
      >
        <Layers size={20} class="text-primary" />
        <h3 class="text-base font-bold text-foreground">Flat file CMS & Jamstack simplicity</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Store all content as standard Markdown and YAML front matter. Enjoy a true <strong>jamstack cms</strong> architecture with zero database maintenance or hosting vendor lock-in.
        </p>
      </div>

      <div
        class="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs"
      >
        <ShieldCheck size={20} class="text-primary" />
        <h3 class="text-base font-bold text-foreground">Secure GitHub CMS collaboration</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Leverage GitHub's authentication, commit history, and pull requests. A secure <strong>github cms</strong> workflow where every update is traceable and audited.
        </p>
      </div>

      <div
        class="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs"
      >
        <LeafyGreen size={20} class="text-primary" />
        <h3 class="text-base font-bold text-foreground">Go green with sustainable web CMS</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Static sites consume significantly less energy than traditional dynamic databases. Lower your carbon footprint with an efficient, sustainable web architecture.
        </p>
        <a
          href="/docs"
          class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Read docs <ArrowRight size={12} />
        </a>
      </div>

      <div
        class="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs"
      >
        <FileText size={20} class="text-primary" />
        <h3 class="text-base font-bold text-foreground">AI & LLM search readiness</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Integrate LightCMS with AI coding agents and LLM tooling using our standard <code class="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">llms.txt</code> file for automated workflow adaptation.
        </p>
        <a
          href="/llms.txt"
          class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View llms.txt <ArrowRight size={12} />
        </a>
      </div>

      <div
        class="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs"
      >
        <Bookmark size={20} class="text-primary" />
        <h3 class="text-base font-bold text-foreground">Comprehensive documentation</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Follow our clear setup guides for Hugo, Astro, Zola, Eleventy, Jekyll, Zine, and mdBook to connect your repository in minutes.
        </p>
        <a
          href="/docs"
          class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Explore guides <ArrowRight size={12} />
        </a>
      </div>
    </div>
  </section>

  <section id="specifications" class="space-y-8 border-t border-border pt-12 sm:pt-16">
    <div class="max-w-3xl space-y-3">
      <h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Why developers choose LightCMS
      </h2>
      <p class="text-sm leading-relaxed text-muted-foreground sm:text-base">
        Built for developers who value performance, simplicity, and full data sovereignty.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <div class="rounded-xl border border-border bg-card p-6 text-center shadow-xs">
        <GitBranch size={24} class="mx-auto mb-2 text-primary" />
        <div class="text-3xl font-extrabold text-foreground">100%</div>
        <div class="mt-1 text-sm font-semibold text-foreground">Git-Native Architecture</div>
        <p class="mt-2 text-xs text-muted-foreground">
          Every edit creates verifiable commits and pull requests in your repository.
        </p>
      </div>

      <div class="rounded-xl border border-border bg-card p-6 text-center shadow-xs">
        <Database size={24} class="mx-auto mb-2 text-primary" />
        <div class="text-3xl font-extrabold text-foreground">0</div>
        <div class="mt-1 text-sm font-semibold text-foreground">Database Dependencies</div>
        <p class="mt-2 text-xs text-muted-foreground">
          No SQL servers to configure, patch, or maintain. Clean flat files throughout.
        </p>
      </div>

      <div class="rounded-xl border border-border bg-card p-6 text-center shadow-xs">
        <Zap size={24} class="mx-auto mb-2 text-primary" />
        <div class="text-3xl font-extrabold text-foreground">7+</div>
        <div class="mt-1 text-sm font-semibold text-foreground">SSG Frameworks</div>
        <p class="mt-2 text-xs text-muted-foreground">
          Pre-tested conventions for Hugo, Astro, Zola, Eleventy, Jekyll, Zine, and mdBook.
        </p>
      </div>
    </div>

    <div class="rounded-xl border border-border bg-card p-6 shadow-xs">
      <h3 class="mb-4 text-base font-bold text-foreground">Key Advantages</h3>
      <ul class="space-y-2 text-sm text-muted-foreground">
        <li class="flex items-start gap-2">
          <Check size={16} class="mt-0.5 shrink-0 text-primary" />
          <span><strong>Complete ownership:</strong> Your content stays entirely in your GitHub repository, never stored in a third-party proprietary database.</span>
        </li>
        <li class="flex items-start gap-2">
          <Check size={16} class="mt-0.5 shrink-0 text-primary" />
          <span><strong>Zero hosting fees:</strong> Deploy static sites effortlessly to GitHub Pages, Cloudflare Pages, Vercel, or Netlify for free.</span>
        </li>
        <li class="flex items-start gap-2">
          <Check size={16} class="mt-0.5 shrink-0 text-primary" />
          <span><strong>Eco-friendly delivery:</strong> Pre-rendered static pages use up to 80% less energy per pageview than dynamic database CMS platforms.</span>
        </li>
        <li class="flex items-start gap-2">
          <Check size={16} class="mt-0.5 shrink-0 text-primary" />
          <span><strong>Developer friendly:</strong> Use your favorite code editors and git commands alongside LightCMS without conflicts.</span>
        </li>
      </ul>
    </div>

    <blockquote
      class="rounded-xl border-l-4 border-primary border-y border-r border-border/80 bg-muted/20 p-5 italic text-muted-foreground"
    >
      <p class="text-sm leading-relaxed sm:text-base">
        "Static site generators produce the fastest, most resilient websites on the web. LightCMS brings a frictionless, intuitive writing environment to that workflow while preserving pure Git conventions."
      </p>
      <cite class="mt-3 block text-xs font-semibold not-italic text-foreground">
        — The LightCMS Team
      </cite>
    </blockquote>
  </section>

  <section id="faq" class="space-y-8 border-t border-border pt-12 sm:pt-16">
    <div class="max-w-3xl space-y-3">
      <div
        class="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground"
      >
        <CircleHelp size={13} class="text-primary" />
        <span>Got questions?</span>
      </div>
      <h2 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Frequently Asked Questions
      </h2>
      <p class="text-sm leading-relaxed text-muted-foreground sm:text-base">
        Everything you need to know about LightCMS, Git-backed architecture, and static site workflows.
      </p>
    </div>

    <div class="space-y-6">
      <div class="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
        <h3 class="text-base font-bold text-foreground">
          What is a Git-backed headless CMS?
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
          A Git-backed headless CMS uses your GitHub repository as its database. Every post, page, and asset is stored as a Markdown file with YAML front matter. Edits made in LightCMS trigger automated Git commits or pull requests, ensuring continuous versioning, team review workflows, and instant CI/CD deployment.
        </p>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
        <h3 class="text-base font-bold text-foreground">
          Which static site generators are supported by LightCMS?
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
          LightCMS works with any Markdown-compatible static site generator. We provide pre-built templates and testing guides for Hugo, Astro, Zola, Eleventy, Jekyll, Zine, and mdBook. Learn more in our <a href="/docs" class="font-semibold text-primary underline">documentation</a>.
        </p>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
        <h3 class="text-base font-bold text-foreground">
          Does LightCMS require a database or paid monthly hosting?
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
          No database is required. Because LightCMS operates as a flat file CMS interface on top of your GitHub repository, your published static website can be hosted on free tiers of GitHub Pages, Cloudflare Pages, or Vercel with zero database hosting costs.
        </p>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
        <h3 class="text-base font-bold text-foreground">
          Is LightCMS open source?
        </h3>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
          Yes, LightCMS is completely open source under the Apache-2.0 license. You can inspect the source code, contribute features, and deploy it yourself on <a href="https://github.com/light-cms/lightcms" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary underline">GitHub</a>.
        </p>
      </div>
    </div>
  </section>
</div>
