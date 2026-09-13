<script lang="ts">
import "./layout.css";
import {
	Blocks,
	BookOpen,
	Info,
	LogIn,
	LucideFileBadge2,
	Sparkles,
} from "@lucide/svelte";
import { ModeWatcher } from "mode-watcher";
import { page } from "$app/state";
import { DEFAULT_THEME_ID, MODE_STORAGE_KEY, THEME_STORAGE_KEY } from "$lib/themes.js";
import ToggleMode from "$lib/components/custom/ToggleMode.svelte";
import { Avatar } from "$lib/components/ui/avatar";
import { Toaster } from "$lib/components/ui/sonner";
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
injectAnalytics({ mode: 'production' });
injectSpeedInsights();
let { children, data } = $props();
</script>

<ModeWatcher defaultTheme={DEFAULT_THEME_ID} modeStorageKey={MODE_STORAGE_KEY} themeStorageKey={THEME_STORAGE_KEY} />
<Toaster />

<svelte:head>
  <title>LightCMS</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground transition-colors duration-300">
  <a
    class="fixed left-4 top-2 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-xl transition-transform focus:translate-y-0"
    href="#main-content">Skip to content</a
  >
  <header
    class="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors"
  >
    <div
      class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
    >
      <a
        class="group flex items-center gap-2.5 rounded-lg p-1.5 focus-visible:outline-2 focus-visible:outline-primary"
        href="/"
        aria-label="LightCMS home"
      >
        <span
          class="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105 group-hover:rotate-3"
        >
          <LucideFileBadge2 size={20} />
        </span>
        <span
          class="hidden text-sm font-black tracking-wider uppercase text-foreground sm:inline"
          >LightCMS</span
        >
      </a>
      <nav class="flex items-center gap-2" aria-label="Primary navigation">
        <a
          class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 {page.url.pathname.startsWith('/cms') ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'}"
          href="/cms"
          aria-label="CMS workspace"
          aria-current={page.url.pathname.startsWith("/cms")}
        >
          <Blocks size={15} />
          <span class="hidden sm:inline">CMS</span>
        </a>
        <a
          class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 {page.url.pathname.startsWith('/docs') ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'}"
          href="/docs"
          aria-label="Documentation"
          aria-current={page.url.pathname.startsWith("/docs") ? "page" : undefined}
        >
          <BookOpen size={15} />
          <span class="hidden sm:inline">Docs</span>
        </a>
        <a
          class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 {page.url.pathname === '/about' ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'}"
          href="/about"
          aria-label="About LightCMS"
          aria-current={page.url.pathname === "/about"}
        >
          <Info size={15} />
          <span class="hidden sm:inline">About</span>
        </a>

        <span class="mx-1 h-5 w-px bg-border/60" aria-hidden="true"></span>

        <a class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs hover:opacity-90 active:scale-[0.98] transition-all duration-200" href="/auth">
          {#if data.session}
            <Avatar.Root class="size-5 shrink-0 border border-primary-foreground/20 rounded-full overflow-hidden">
              <Avatar.Fallback class="text-xs font-black bg-primary-foreground text-primary flex items-center justify-center size-full"
                >{(data.user?.name ?? data.user?.email ?? "U").charAt(
                  0,
                ).toUpperCase()}</Avatar.Fallback
              >
            </Avatar.Root>
          {:else}
            <LogIn size={15} />
          {/if}
          <span>{data.session ? "Account" : "Sign in"}</span>
        </a>

        <ToggleMode />
      </nav>
    </div>
  </header>

  <!-- Main Content container with background glow -->
  <div class="relative overflow-hidden">
    <main
      id="main-content"
      class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 relative z-10"
    >
      {@render children()}
    </main>
  </div>

  <footer class="border-t border-border/50 py-8 text-center text-xs text-muted-foreground bg-muted/20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-1.5 font-bold text-foreground">
        <Sparkles size={14} class="text-primary" />
        <span>LightCMS</span>
      </div>
    </div>
  </footer>
</div>
