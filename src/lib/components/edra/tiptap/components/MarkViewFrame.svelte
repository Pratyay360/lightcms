<script lang="ts">
	import type { Component as SvelteComponent } from 'svelte';

	let {
		component: Component,
		extension,
		...props
	}: {
		component: SvelteComponent;
		extension?: { name?: string };
		[key: string]: unknown;
	} = $props();

	let className = $derived(`svelte-renderer mark-${extension?.name}`);
</script>

<div class={className} data-mark-view-wrapper="">
	<Component {extension} {...props} />
</div>
