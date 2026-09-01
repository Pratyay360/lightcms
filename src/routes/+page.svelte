<script lang="ts">
import {
	ArrowRight,
	Bookmark,
	Check,
	FileText,
	GitBranch,
	Pencil,
	ShieldCheck,
	Sparkles
} from "@lucide/svelte";
</script>

<svelte:head>
  <title>LightCMS | Content without the clutter</title>
  <meta
    name="description"
    content="A focused Git-backed content workspace for editing and publishing markdown."
  />
</svelte:head>

<section
  class="grid min-h-[calc(100vh-12rem)] items-center gap-12 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-12"
>
  <div class="max-w-2xl space-y-8">
    <div class="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-foreground">
      <Sparkles size={13} class="animate-pulse text-primary" />
      <span>Easy to use</span>
    </div>

    <div class="space-y-4">
      <h1 class="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:leading-[1.1]">
        A easier place to shape what you <span class="text-primary">publish</span>.
      </h1>
      <p class="text-lg leading-relaxed text-muted-foreground">
        Edit structured content with a gorgeous notion like editor, and commit clean
        markdown directly to your GitHub repository. No databases to manage, no server related headaches.
      </p>
    </div>

    <div class="flex flex-wrap gap-4">
      <a class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98] gap-2.5" href="/cms">
        Open workspace
        <GitBranch size={17} />
      </a>
    
    </div>

    <div
      class="grid grid-cols-1 gap-6 border-t border-border pt-8 sm:grid-cols-3"
    >
      <div class="space-y-3 p-4 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <Bookmark size={20} class="text-primary" />
        <h3 class="text-sm font-bold text-foreground">Read the docs</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Learn how to customize collections and fields.
        </p>
        <a href="/docs" class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          Read docs <ArrowRight size={12} />
        </a>
      </div>

      <div class="space-y-3 p-4 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <Pencil size={20} class="text-primary" />
        <h3 class="text-sm font-bold text-foreground">Simple  editing</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Edit markdown with simple notion like editor.
        </p>
      </div>

      <div class="space-y-3 p-4 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <ShieldCheck size={20} class="text-primary" />
        <h3 class="text-sm font-bold text-foreground">Secure access</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Leverage GitHub's platform for authentication and access control related features.
        </p>
      </div>
    </div>
  </div>

  <div class="relative lg:block">
    <div class="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
      <!-- Window Header / Top Bar -->
      <div class="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-3 rounded-full bg-red-500/80"></span>
          <span class="h-3 w-3 rounded-full bg-yellow-500/80"></span>
          <span class="h-3 w-3 rounded-full bg-green-500/80"></span>
        </div>
        <div class="flex items-center gap-2 rounded bg-muted/60 px-3 py-1 text-xs font-mono text-muted-foreground">
          <GitBranch size={12} class="text-primary" />
          <span>main: content/posts/hello-world.md</span>
        </div>
        <div class="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <Check size={10} />
          <span>Synced</span>
        </div>
      </div>

      <!-- Workspace Preview -->
      <div class="grid h-100 place-items-center bg-muted/20 p-8 text-center">
        <div class="space-y-2">
          <FileText size={24} class="mx-auto text-muted-foreground" />
          <p class="text-xs text-muted-foreground">Workspace preview</p>
        </div>
      </div>
    </div>
  </div>
</section>
