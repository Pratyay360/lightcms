<script lang="ts">
  import { Check, TriangleAlert } from '@lucide/svelte';
  import { Spinner } from '$lib/components/ui/spinner';
  import { timeAgo } from '$lib/utils/time-ago';

  let { saving, hasUnsavedChanges, lastSaved }: {
    saving: boolean;
    hasUnsavedChanges: boolean;
    lastSaved: Date | null;
  } = $props();
</script>

{#if saving}
  <span class="flex items-center gap-1.5 text-sm font-medium text-primary">
    <Spinner class="h-4 w-4" />
    <span class="hidden sm:inline">Saving...</span>
  </span>
{:else if hasUnsavedChanges}
  <span class="flex items-center gap-1.5 text-sm font-medium text-amber-500">
    <TriangleAlert class="h-4 w-4" />
    <span class="hidden sm:inline">Unsaved changes</span>
  </span>
{:else if lastSaved}
  <span class="flex items-center gap-1.5 text-sm font-medium text-emerald-500">
    <Check class="h-4 w-4" />
    <span class="hidden sm:inline">Saved {timeAgo(lastSaved)}</span>
  </span>
{/if}
