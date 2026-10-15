<script lang="ts">
import { ArrowLeft, ArrowRight } from "@lucide/svelte";
import { DocsBlogBanner } from "$lib/components/custom";
import { Button } from "$lib/components/ui/button";
import { Separator } from "$lib/components/ui/separator";

interface DocLink {
	slug: string;
	title: string;
}

let {
	data
}: {
	data: {
		title: string;
		description: string;
		content: string;
		previous: DocLink | null;
		next: DocLink | null;
	};
} = $props();
</script>

<div class="mx-auto max-w-3xl space-y-6 py-6 sm:py-10">
	<nav aria-label="Back to documentation">
		<Button
			variant="outline"
			size="sm"
			href="/docs"
			class="gap-2 text-xs font-semibold"
		>
			<ArrowLeft size={16} /> Back to docs
		</Button>
	</nav>

	<article
		class="rounded-xl border border-border bg-card text-card-foreground shadow-xs"
	>
		<header class="px-6 pt-8 sm:px-10 sm:pt-10">
			<h1
				class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
			>
				{data.title}
			</h1>
			{#if data.description}
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					{data.description}
				</p>
			{/if}
			<Separator class="mt-6" />
		</header>
		<div class="docs-article px-6 py-8 sm:px-10 sm:py-10">
			{@html data.content}
		</div>
	</article>

	<DocsBlogBanner />

	<nav
		aria-label="More guides"
		class="flex items-center justify-between gap-3"
	>
		{#if data.previous}
			<Button
				variant="outline"
				size="sm"
				href={data.previous.slug}
				class="max-w-[48%] gap-2 text-xs font-semibold"
			>
				<ArrowLeft size={16} />
				<span class="truncate">{data.previous.title}</span>
			</Button>
		{:else}
			<span></span>
		{/if}
		{#if data.next}
			<Button
				variant="outline"
				size="sm"
				href={data.next.slug}
				class="max-w-[48%] gap-2 text-xs font-semibold"
			>
				<span class="truncate">{data.next.title}</span>
				<ArrowRight size={16} />
			</Button>
		{:else}
			<span></span>
		{/if}
	</nav>
</div>

<style>
	.docs-article {
		color: var(--foreground);
		font-size: 0.95rem;
		line-height: 1.75;
		overflow-wrap: break-word;
	}

	.docs-article > :global(*:first-child) {
		margin-top: 0;
	}

	.docs-article > :global(*:last-child) {
		margin-bottom: 0;
	}

	.docs-article :global(h1),
	.docs-article :global(h2),
	.docs-article :global(h3),
	.docs-article :global(h4) {
		color: var(--foreground);
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.3;
		scroll-margin-top: 5rem;
	}

	.docs-article :global(h1) {
		font-size: 1.75rem;
		margin: 0 0 1rem;
	}

	.docs-article :global(h2) {
		font-size: 1.4rem;
		margin: 2.5rem 0 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.docs-article :global(h3) {
		font-size: 1.15rem;
		margin: 2rem 0 0.5rem;
	}

	.docs-article :global(h4) {
		font-size: 1rem;
		margin: 1.5rem 0 0.5rem;
	}

	.docs-article :global(p) {
		margin: 1rem 0;
	}

	.docs-article :global(a) {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
	}

	.docs-article :global(a:hover) {
		text-decoration-thickness: 2px;
	}

	.docs-article :global(strong) {
		color: var(--foreground);
		font-weight: 700;
	}

	.docs-article :global(del) {
		color: var(--muted-foreground);
	}

	.docs-article :global(ul),
	.docs-article :global(ol) {
		margin: 1rem 0;
		padding-left: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.docs-article :global(ul) {
		list-style-type: disc;
	}

	.docs-article :global(ol) {
		list-style-type: decimal;
	}

	.docs-article :global(li::marker) {
		color: var(--muted-foreground);
	}

	.docs-article :global(li > ul),
	.docs-article :global(li > ol) {
		margin: 0.5rem 0 0;
	}

	.docs-article :global(code) {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.85em;
	}

	.docs-article :global(:not(pre) > code) {
		background-color: var(--muted);
		color: var(--foreground);
		border-radius: calc(var(--radius) * 0.6);
		padding: 0.15rem 0.4rem;
	}

	.docs-article :global(pre) {
		margin: 1.5rem 0;
		padding: 1rem 1.25rem;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		overflow-x: auto;
		font-size: 0.85rem;
		line-height: 1.7;
	}

	.docs-article :global(pre code) {
		background-color: transparent;
		padding: 0;
	}

	.docs-article :global(blockquote) {
		margin: 1.5rem 0;
		padding: 0.25rem 0 0.25rem 1rem;
		border-left: 3px solid var(--primary);
		color: var(--muted-foreground);
		font-style: italic;
	}

	.docs-article :global(blockquote > *:first-child) {
		margin-top: 0;
	}

	.docs-article :global(blockquote > *:last-child) {
		margin-bottom: 0;
	}

	.docs-article :global(hr) {
		margin: 2rem 0;
		border: none;
		border-top: 1px solid var(--border);
	}

	.docs-article :global(table) {
		width: 100%;
		margin: 1.5rem 0;
		border-collapse: collapse;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	.docs-article :global(th),
	.docs-article :global(td) {
		padding: 0.6rem 0.9rem;
		border: 1px solid var(--border);
		text-align: left;
	}

	.docs-article :global(th) {
		background-color: var(--muted);
		font-weight: 700;
	}

	.docs-article :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		margin: 1.5rem 0;
	}
</style>
