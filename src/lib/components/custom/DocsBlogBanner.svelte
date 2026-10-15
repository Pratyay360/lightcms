<script lang="ts">
import { ExternalLink, Newspaper } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";
import { SITE } from "$lib/seo";
import { cn } from "$lib/utils";

let { class: className = "" }: { class?: string } = $props();
</script>

<aside
	aria-label="LightCMS Blog"
	class={cn(
		"flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:p-7",
		className
	)}
>
	<div class="flex items-start gap-4">
		<span
			class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
		>
			<Newspaper size={22} />
		</span>
		<div class="space-y-1">
			<h2 class="text-base font-bold text-foreground">
				Looking for tutorials, updates &amp; insights?
			</h2>
			<p class="text-xs leading-relaxed text-muted-foreground sm:text-sm">
				Explore stories, guides, and tips for building sustainable static websites on the LightCMS blog.
			</p>
		</div>
	</div>

	<Button
		href={SITE.blogUrl}
		target="_blank"
		rel="noopener noreferrer"
		class="shrink-0 gap-2 font-semibold shadow-xs"
	>
		<span>Read our Blog</span>
		<ExternalLink size={15} />
	</Button>
</aside>
