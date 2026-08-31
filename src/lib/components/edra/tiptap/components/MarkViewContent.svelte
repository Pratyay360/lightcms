<script lang="ts">
	let { as = 'span', class: className, children }: { as?: string; class?: string; children?: any } = $props();
</script>

{#key 'mvc'}

	<div class={className} data-mark-view-content="" style="white-space: inherit"
	>
	{@render children?.()}
	</div>
{/key}
