<script lang="ts">
import { ArrowLeft, CircleAlert } from "@lucide/svelte";
import { page } from "$app/state";

const status = $derived(page.status);
const message = $derived(page.error?.message);
</script>

<svelte:head>
	<title>{status} | LightCMS</title>
</svelte:head>

<section class="mx-auto flex max-w-xl flex-col items-center gap-5 py-16 text-center">
	<span class="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
		<CircleAlert size={36} />
	</span>
	<div>
		<p class="eyebrow font-semibold text-primary">Error {status}</p>
		<h1 class="page-title mt-3 text-3xl font-extrabold text-foreground">{status === 404 ? "Page not found" : status === 403 ? "Access denied" : status === 401 ? "Sign in required" : "Something went wrong"}</h1>
		<p class="mt-3 text-sm leading-6 text-muted-foreground">
			{#if status}
				The page you were looking for doesn't exist or has been moved. Please check the URL or return to the homepage.
			{:else}
				{message || "The request could not be completed. Please try again."}
			{/if}
		</p>
	</div>
	<div class="mt-2 flex flex-wrap items-center justify-center gap-3">
		<a class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs gap-2" href={status === 401 ? "/auth" : "/cms"}>
			<ArrowLeft size={16} /> {status === 401 ? "Sign in" : "Go to workspace"}
		</a>
		<a class="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors gap-2" href="/">Home</a>
	</div>
</section>
