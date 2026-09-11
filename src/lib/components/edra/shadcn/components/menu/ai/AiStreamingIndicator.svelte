<script lang="ts">
	import { Sparkle } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
</script>

<div transition:fade class="animated-gradient-border rounded p-0.5">
	<div class="flex items-center gap-2 rounded-md bg-popover text-popover-foreground p-1">
		<Sparkle class="size-4!" />
		<span
			class="bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-semibold text-transparent"
		>
			AI is writing</span
		>
		<div class="flex h-5 items-center space-x-0.5">
			{#each Array(3) as id, i (i)}
				<div
					data-ball-number={id}
					class="dot h-1.25 w-1.25 rounded-full bg-primary"
					style:animation-delay="{i * 160}ms"
				></div>
			{/each}
			<span class="sr-only">Loading</span>
		</div>
	</div>
</div>
