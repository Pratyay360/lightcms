<script lang="ts">
  import {
    ArrowLeft,
    Check,
    Code,
    FileText,
    FolderInput,
    GitBranch,
    LoaderCircle,
    Plus,
    Save,
    Settings2,
    Sparkles,
    Trash2,
  } from "@lucide/svelte";
  import { onMount, untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import { enhance } from "$app/forms";
  import { createEditor, Edra } from "$lib/components/edra/shadcn";
  import { Button } from "$lib/components/ui/button";
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { createLightCmsClient } from "$lib/orpc-client";
  import { uploadFile } from "$lib/utils/upload-file";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form?: ActionData } = $props();

  const file = $derived(data.file);
  const filePath = $derived(data.filePath);
  const parentPath = $derived(data.parentPath);
  const query = $derived(data.query);
  const selection = $derived(data.selection);

  let editorMode = $state<"rich" | "raw">(untrack(() => data.file.isMarkdown ? "rich" : "raw"));
  let bodyContent = $state(untrack(() => data.file.body));
  let frontMatterEntries = $state<Array<{ key: string; value: string }>>([]);
  let showFrontmatter = $state(false);
  let newFieldKey = $state("");
  let newFieldValue = $state("");
  let deleteDialogOpen = $state(false);
  let moveDialogOpen = $state(false);
  let destinationFolder = $state(untrack(() => data.parentPath));
  let newFilename = $state(untrack(() => data.file.filename));
  let isSaving = $state(false);
  let hasUnsavedChanges = $state(false);
  let lastSavedAt = $state<string | null>(null);


  // Initialize frontmatter entries from file
  onMount(() => {
    const entries: Array<{ key: string; value: string }> = [];
    if (file.frontMatter && typeof file.frontMatter === "object") {
      for (const [k, v] of Object.entries(file.frontMatter)) {
        entries.push({
          key: k,
          value: typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
        });
      }
    }
    frontMatterEntries = entries;
  });

  let orpcClient: ReturnType<typeof createLightCmsClient> | undefined;
  onMount(() => {
    orpcClient = createLightCmsClient();
  });

  const editor = createEditor({
    callAI: async (prompt: string, onChunk: (chunk: string) => void) => {
      if (!orpcClient) orpcClient = createLightCmsClient();
      const stream = await orpcClient.ai.generateContent({ prompt });
      for await (const chunk of stream) {
        onChunk(chunk);
      }
    },
    onUpdate: () => {
      if (!editor) return;
      bodyContent = editor.getMarkdown();
      hasUnsavedChanges = true;
    },
    onFileUpload: async (f: File) => uploadFile(f),
  });

  let editorSeeded = $state(false);
  $effect(() => {
    if (editor && !editorSeeded && file.isMarkdown) {
      editorSeeded = true;
      editor.commands.setContent(file.body ?? "", { contentType: "markdown" });
    }
  });

  function switchMode(newMode: "rich" | "raw") {
    if (newMode === "raw" && editorMode === "rich" && editor) {
      bodyContent = editor.getMarkdown();
    } else if (newMode === "rich" && editorMode === "raw" && editor) {
      editor.commands.setContent(bodyContent, { contentType: "markdown" });
    }
    editorMode = newMode;
  }

  function addFrontmatterField() {
    const key = newFieldKey.trim();
    if (!key) return;
    frontMatterEntries = [...frontMatterEntries, { key, value: newFieldValue }];
    newFieldKey = "";
    newFieldValue = "";
    hasUnsavedChanges = true;
  }

  function removeFrontmatterField(index: number) {
    frontMatterEntries = frontMatterEntries.filter((_, i) => i !== index);
    hasUnsavedChanges = true;
  }

  const frontMatterJson = $derived.by(() => {
    if (frontMatterEntries.length === 0) return "";
    const obj: Record<string, unknown> = {};
    for (const entry of frontMatterEntries) {
      if (!entry.key.trim()) continue;
      try {
        obj[entry.key.trim()] = JSON.parse(entry.value);
      } catch {
        obj[entry.key.trim()] = entry.value;
      }
    }
    return JSON.stringify(obj);
  });

  function getBackUrl(): string {
    if (!parentPath) {
      return `/cms/tree?${query}`;
    }
    return `/cms/tree/${parentPath}?${query}`;
  }
</script>

<svelte:head>
  <title>Editing {file.filename} | LightCMS</title>
</svelte:head>

<div class="space-y-6">
  <!-- Top Bar -->
  <header class="flex flex-col gap-4 border-b border-border/50 pb-5 md:flex-row md:items-center md:justify-between">
    <div class="flex items-center gap-3">
      <a
        href={getBackUrl()}
        class="inline-flex size-9 items-center justify-center rounded-xl border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        title="Back to folder"
      >
        <ArrowLeft size={16} />
      </a>
      <div class="space-y-1">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span class="font-mono">{selection.repository}</span>
          <span>&middot;</span>
          <span class="inline-flex items-center gap-1 font-mono">
            <GitBranch size={12} class="text-primary" />
            {selection.branch ?? "default"}
          </span>
        </div>
        <h1 class="text-xl font-black text-foreground sm:text-2xl flex items-center gap-2">
          {file.filename}
          <span class="text-xs font-mono font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded border">
            {filePath}
          </span>
        </h1>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2.5">
      {#if file.isMarkdown}
        <div class="flex rounded-xl border bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 transition-all {editorMode === 'rich' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
            onclick={() => switchMode("rich")}
          >
            <Sparkles size={12} class="inline mr-1 text-primary" /> Rich
          </button>
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 transition-all {editorMode === 'raw' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}"
            onclick={() => switchMode("raw")}
          >
            <Code size={12} class="inline mr-1" /> Raw
          </button>
        </div>
      {/if}

      {#if file.isMarkdown}
        <Button
          type="button"
          variant="outline"
          class="gap-1.5 text-xs rounded-xl"
          onclick={() => (showFrontmatter = !showFrontmatter)}
        >
          <Settings2 size={14} /> Frontmatter
          {#if frontMatterEntries.length > 0}
            <span class="rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-mono">
              {frontMatterEntries.length}
            </span>
          {/if}
        </Button>
      {/if}

      <Button
        type="button"
        variant="ghost"
        class="text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl"
        title="Move or rename file"
        onclick={() => (moveDialogOpen = true)}
      >
        <FolderInput size={16} />
      </Button>

      <Button
        type="button"
        variant="ghost"
        class="text-destructive hover:bg-destructive/10 rounded-xl"
        onclick={() => (deleteDialogOpen = true)}
      >
        <Trash2 size={16} />
      </Button>


      <!-- Save Form -->
      <form
        method="POST"
        action="?/save"
        use:enhance={() => {
          if (editor && editorMode === "rich") {
            bodyContent = editor.getMarkdown();
          }
          isSaving = true;
          return async ({ result, update }) => {
            isSaving = false;
            await update();
            if (result.type === "success") {
              hasUnsavedChanges = false;
              lastSavedAt = new Date().toLocaleTimeString();
              toast.success("Saved successfully");
            } else if (result.type === "failure") {
              toast.error((result.data as { error?: string })?.error ?? "Save failed");
            }
          };
        }}
      >
        <input type="hidden" name="content" value={bodyContent} />
        <input type="hidden" name="frontMatter" value={frontMatterJson} />
        <Button
          type="submit"
          class="gap-1.5 text-xs font-semibold rounded-xl"
          disabled={isSaving}
        >
          {#if isSaving}
            <LoaderCircle size={14} class="animate-spin" /> Saving...
          {:else}
            <Save size={14} /> Save
          {/if}
        </Button>
      </form>
    </div>
  </header>

  <!-- Notification bar -->
  <div class="flex items-center justify-between text-xs text-muted-foreground">
    <div class="flex items-center gap-2">
      {#if hasUnsavedChanges}
        <span class="inline-flex size-2 rounded-full bg-amber-500"></span>
        <span class="font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span>
      {:else if lastSavedAt}
        <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <Check size={12} /> Saved at {lastSavedAt}
        </span>
      {:else}
        <span>Up to date</span>
      {/if}
    </div>
    <span class="font-mono text-[11px] text-muted-foreground/60">SHA: {file.sha.slice(0, 7)}</span>
  </div>

  <!-- Frontmatter Panel -->
  {#if showFrontmatter && file.isMarkdown}
    <div class="rounded-2xl border bg-card p-5 space-y-4 shadow-xs">
      <div class="flex items-center justify-between border-b pb-3">
        <h2 class="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Settings2 size={16} class="text-primary" /> Frontmatter Metadata
        </h2>
        <span class="text-xs text-muted-foreground">YAML metadata stored at the top of the file</span>
      </div>

      <div class="space-y-3">
        {#each frontMatterEntries as entry, index}
          <div class="flex items-center gap-2">
            <Input
              class="w-1/3 font-mono text-xs"
              placeholder="Key"
              bind:value={entry.key}
              oninput={() => (hasUnsavedChanges = true)}
            />
            <Input
              class="flex-1 font-mono text-xs"
              placeholder="Value"
              bind:value={entry.value}
              oninput={() => (hasUnsavedChanges = true)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="text-destructive h-9 px-2 hover:bg-destructive/10"
              onclick={() => removeFrontmatterField(index)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        {/each}

        <!-- Add Field Row -->
        <div class="flex items-center gap-2 pt-2 border-t">
          <Input
            class="w-1/3 font-mono text-xs"
            placeholder="New key (e.g. title)"
            bind:value={newFieldKey}
          />
          <Input
            class="flex-1 font-mono text-xs"
            placeholder="New value"
            bind:value={newFieldValue}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="gap-1 text-xs"
            onclick={addFrontmatterField}
          >
            <Plus size={14} /> Add
          </Button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Editor Area -->
  <div class="rounded-2xl border bg-card shadow-xs overflow-hidden min-h-[500px]">
    {#if file.isMarkdown && editorMode === "rich" && editor}
      <div class="p-6">
        <Edra {editor}>
          <Edra.UseAI />
          <Edra.BubbleMenu />
          <Edra.Content class="*:outline-none cursor-auto min-h-[500px]" />
          <Edra.DragHandle />
        </Edra>
      </div>
    {:else}
      <div class="p-4">
        <Textarea
          class="w-full min-h-[550px] font-mono text-sm leading-relaxed border-0 focus-visible:ring-0 resize-y bg-transparent"
          placeholder="File content..."
          bind:value={bodyContent}
          oninput={() => (hasUnsavedChanges = true)}
        />
      </div>
    {/if}
  </div>
</div>

<!-- Delete File Confirmation Dialog -->
<Dialog bind:open={deleteDialogOpen}>
  <DialogContent class="sm:max-w-md">
    <form method="POST" action="?/delete" class="space-y-4">
      <DialogHeader>
        <DialogTitle>Delete File</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <span class="font-mono font-bold text-foreground">{file.filename}</span>?
          This will commit the deletion to the repository.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="flex gap-2 justify-end">
        <DialogClose>Cancel</DialogClose>
        <Button type="submit" variant="destructive">Confirm Delete</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

<!-- Move File Dialog -->
<Dialog bind:open={moveDialogOpen}>
  <DialogContent class="sm:max-w-md">
    <form method="POST" action="?/move" class="space-y-4">
      <DialogHeader>
        <DialogTitle>Move or Rename File</DialogTitle>
        <DialogDescription>
          Change the folder location or filename for this file.
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-3 py-2">
        <div class="rounded-xl border bg-muted/40 p-3 text-xs space-y-1">
          <div class="text-muted-foreground">Current path:</div>
          <div class="font-mono font-semibold text-foreground truncate">
            {filePath}
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="destination-folder">Destination Folder</Label>
          <Input
            id="destination-folder"
            name="destinationFolder"
            bind:value={destinationFolder}
            placeholder="Leave blank for root, or specify folder"
            autocomplete="off"
          />
        </div>

        <div class="space-y-1.5">
          <Label for="new-filename">Filename</Label>
          <Input
            id="new-filename"
            name="newFilename"
            bind:value={newFilename}
            required
            autocomplete="off"
          />
        </div>
      </div>

      <DialogFooter class="flex gap-2 justify-end">
        <Button type="button" variant="outline" onclick={() => (moveDialogOpen = false)}>Cancel</Button>
        <Button type="submit">Move File</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

