<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';

	interface Props {
		dark?: boolean;
	}

	let { dark = undefined }: Props = $props();

	let isDark = $state<boolean>(false);

	onMount(() => {
		const isLocalhost =
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1' ||
			window.location.hostname === '[::1]';

		if (dev || isLocalhost) {
			return;
		}

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

		void import('website-carbon-badges/b.min.js').catch(() => {
			// Ignore badge loading failure
		});

		return () => {
			if (mediaQuery !== null) {
				mediaQuery.removeEventListener('change', handleChange);
			}
		};
	});
</script>

<div id="wcb" class="carbonbadge" class:wcb-d={isDark}></div>
