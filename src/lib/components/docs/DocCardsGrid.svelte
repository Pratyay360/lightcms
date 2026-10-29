<script lang="ts">
	interface DocCardItem {
		title: string;
		description: string;
		icon?: any;
		badge?: string;
		href?: string;
	}

	let {
		cards = []
	}: {
		cards: DocCardItem[];
	} = $props();
</script>

<div class="my-8 grid gap-5 sm:grid-cols-2">
	{#each cards as card (card.title)}
		<div
			class="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
		>
			<div class="space-y-3">
				<div class="flex items-center justify-between gap-3">
					<h3 class="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
						{card.title}
					</h3>
					{#if card.badge}
						<span
							class="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary uppercase"
						>
							{card.badge}
						</span>
					{/if}
				</div>
				<p class="text-sm leading-relaxed text-muted-foreground">
					{card.description}
				</p>
			</div>

			{#if card.href}
				<div class="mt-4 pt-2">
					<a
						href={card.href}
						class="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-primary hover:underline"
					>
						Explore {card.title} &rarr;
					</a>
				</div>
			{/if}
		</div>
	{/each}
</div>
