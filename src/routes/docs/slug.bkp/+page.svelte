<!-- <script lang="ts">
import { ArrowLeft } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";

  
let {
	data,
}: {
	data: { content?: string };
} = $props();
</script>

<svelte:head>
  <title>Documentation | LightCMS</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-6 py-6 sm:py-10">
  <nav>
    <Button
      variant="outline"
      size="sm"
      href="/docs"
      class="gap-2 text-xs font-semibold"
    >
      <ArrowLeft size={16} /> Back to docs
    </Button>
  </nav>

  <article
    class="rounded-xl border border-border bg-card text-card-foreground p-6 sm:p-10 shadow-xs"
  >
    <div class="prose max-w-none text-foreground dark:prose-invert">
      {@html data?.content}
    </div>
  </article>
</div> -->
