<script lang="ts">
	import FileBadge2Icon from "@lucide/svelte/icons/file-badge-2";
	import Sparkles from "@lucide/svelte/icons/sparkles";

	let {
		title = "",
		tagline = "Fast • Git-Backed • Markdown-Native"
	}: {
		title?: string;
		tagline?: string;
	} = $props();
</script>

<div
	class="group relative my-8 flex min-h-55 sm:min-h-65 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-blue-600 via-indigo-600 to-sky-500 p-8 text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
>
	<!-- Decorative grid overlay -->
	<div
		class="pointer-events-none absolute inset-0 opacity-15"
		style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 24px 24px;"
		aria-hidden="true"
	></div>

	<!-- Ambient glow behind center icon -->
	<div
		class="pointer-events-none absolute -top-12 size-64 rounded-full bg-white/20 blur-3xl transition-transform duration-500 group-hover:scale-125"
		aria-hidden="true"
	></div>

	<!-- Center Badge & Insignia -->
	<div class="relative z-10 flex flex-col items-center text-center">
		<!-- Crown / Sparkle accent above icon like the screenshot -->
		<div class="mb-2 flex items-center justify-center text-amber-300 drop-shadow-md">
			<Sparkles size={28} />
		</div>

		<!-- Main Logo Icon Container -->
		<div
			class="relative flex size-24 sm:size-28 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md shadow-2xl ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-105"
		>
			<FileBadge2Icon size={52} class="text-white drop-shadow-lg" />
		</div>

		<!-- Tagline -->
		<div class="mt-4 space-y-1">
			<p class="font-mono text-xs font-semibold tracking-wide text-white/80 uppercase">
				{tagline}
			</p>
		</div>
	</div>
</div>
