<script lang="ts">
let {
	data,
}: {
	data: {
		title?: string;
		posts?: Array<{ slug: string; title: string; description?: string }>;
	};
} = $props();

import { ArrowRight, BookOpen, FileText } from "@lucide/svelte";

const _title = $derived(data.title ?? "Documentation");
const _posts = $derived(data.posts);
</script>

<svelte:head>
  <title>{_title} | LightCMS</title>
</svelte:head>

<section class="space-y-8">
  <header class="border-b border-border pb-8">
    <p class="eyebrow flex items-center gap-2 font-semibold text-primary">
      <BookOpen size={16} class="text-primary" /> Getting Started with LightCMS
    </p>
    </header>

  <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {#each _posts as post}
      <article
        class="group flex flex-col justify-between p-6 rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/50"
      >
        <div>
          <div class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <FileText size={20} />
          </div>
          <h2 class="text-lg font-bold text-foreground">
            <a href={post.slug} class="hover:text-primary">
              {post.title}
            </a>
          </h2>
          {#if post.description}
            <p class="mt-2 text-xs text-muted-foreground leading-5">
              {post.description}
            </p>
          {/if}
        </div>
        <div class="mt-6 flex items-center gap-1.5 text-xs font-bold text-primary">
          <span>Read guide</span>
          <ArrowRight size={14} class="transition-transform group-hover:translate-x-1" />
        </div>
      </article>
    {/each}
  </div>
</section>
