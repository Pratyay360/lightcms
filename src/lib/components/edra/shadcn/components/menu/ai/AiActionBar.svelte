<script lang="ts">
	import { Check, Copy, CornerDownLeft, RotateCcw, Trash2 } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		onReplace: () => void;
		onInsert: () => void;
		onCopy: () => void;
		onRetry: () => void;
		onDiscard: () => void;
	}

	const { onReplace, onInsert, onCopy, onRetry, onDiscard }: Props = $props();
</script>

<div
	transition:fade
	class="flex items-center justify-between gap-2 rounded-lg border border-border bg-popover text-popover-foreground p-2 shadow-2xl"
>
	<Button size="sm" onclick={onReplace}>
		<Check />
		Replace
	</Button>
	<Button variant="outline" size="sm" onclick={onInsert}>
		<CornerDownLeft />
		Insert
	</Button>
	<Button variant="outline" size="sm" onclick={onCopy}>
		<Copy />
		Copy
	</Button>
	<Button variant="outline" size="sm" onclick={onRetry}>
		<RotateCcw />
		Retry
	</Button>
	<Button variant="destructive" size="sm" onclick={onDiscard}>
		<Trash2 />
		Discard
	</Button>
</div>
