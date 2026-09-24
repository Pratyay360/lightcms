<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		dark?: boolean;
	}

	let { dark = undefined }: Props = $props();

	let isDark = $state<boolean>(false);

	onMount(() => {

		let mediaQuery: MediaQueryList | null = null;

		function handleChange(event: MediaQueryListEvent): void {
			isDark = event.matches;
		}

		if (dark === undefined) {
			if (window.matchMedia) {
				mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
				isDark = mediaQuery.matches;
				mediaQuery.addEventListener('change', handleChange);
			}
		} else {
			isDark = dark;
		}

		return () => {
			if (mediaQuery !== null) {
				mediaQuery.removeEventListener('change', handleChange);
			}
		};
	});
</script>

<div id="wcb" class="carbonbadge" class:wcb-d={isDark}></div>
