<script lang="ts">
import Moon from "@lucide/svelte/icons/moon";
import Sun from "@lucide/svelte/icons/sun";
import { mode, toggleMode } from "mode-watcher";
import { Button } from "$lib/components/ui/button";

const isDark = $derived(mode.current === "dark");
</script>

<Button
  variant="ghost"
  size="sm"
  aria-pressed={isDark}
  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
  class="flex items-center gap-2 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
  onclick={() => toggleMode()}
>
  <div class="relative size-4 flex items-center justify-center">
    <Sun
      size={16}
      class="absolute transition-all duration-300 {isDark
        ? 'rotate-90 scale-0 opacity-0'
        : 'rotate-0 scale-100 opacity-100'}"
    />
    <Moon
      size={16}
      class="absolute transition-all duration-300 {isDark
        ? 'rotate-0 scale-100 opacity-100 '
        : '-rotate-90 scale-0 opacity-0'}"
    />
  </div>
  <span class="capitalize">{mode.current ?? "theme"}</span>
</Button>
