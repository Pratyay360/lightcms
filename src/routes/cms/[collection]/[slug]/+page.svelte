<script lang="ts">
  import {
    ArrowLeft,
    Clock3,
    CloudCheck,
    FileCode,
    FolderInput,
    FolderOpen,
    Maximize,
    Minimize,
    Save,
    Trash,
    Type,
  } from "@lucide/svelte";

  import { onMount, untrack } from "svelte";
  import { superForm } from "sveltekit-superforms";
  import { enhance as formEnhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import SaveStatus from "$lib/components/cms/SaveStatus.svelte";
  import { createEditor, Edra } from "$lib/components/edra/shadcn";
  import {
    Alert,
    AlertDescription,
    AlertTitle,
  } from "$lib/components/ui/alert";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardFooter } from "$lib/components/ui/card";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "$lib/components/ui/dialog";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Separator } from "$lib/components/ui/separator";
  import { Textarea } from "$lib/components/ui/textarea";
  import { createLightCmsClient } from "$lib/orpc-client";
  import { buildPayloadQuery } from "$lib/utils/cms-url";
  import { timeAgo } from "$lib/utils/time-ago";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const { form, errors, enhance, delayed, message, submitting } = untrack(
    () => {
      return superForm(data.form, {
        dataType: "json",
        resetForm: false,
        invalidateAll: false,
        warnings: { duplicateId: false },
        onUpdated({ form: f }) {
          if (f.valid && f.message) {
            lastSaved = new Date();
            initialSnapshot = JSON.stringify($form);
            hasUnsavedChanges = false;
          }
        },
      });
    },
  );

  import { uploadFile } from "$lib/utils/upload-file";
  import TagManager from "./TagManager.svelte";

  let orpcClient: ReturnType<typeof createLightCmsClient> | undefined;
  onMount(() => {
    orpcClient = createLightCmsClient();
  });

  const editor = createEditor({
    callAI: async (prompt: string, onChunk: (chunk: string) => void) => {
      try {
        if (!orpcClient) orpcClient = createLightCmsClient();
        const stream = await orpcClient.ai.generateContent({ prompt });
        for await (const chunk of stream) {
          onChunk(chunk);
        }
      } catch (err) {
        throw new Error(String(err));
      }
    },
    onUpdate: () => {
      if (!editor) return;
      ($form as Record<string, unknown>).body = editor.getMarkdown();
    },
    onFileUpload: async (file: File) => uploadFile(file),
  });

  let seededPath = $state("");
  let editorMode = $state<"rich" | "markdown">("rich");
  let rawMarkdown = $state("");
  $effect(() => {
    const entry = data.entry;
    if (entry && entry.path !== seededPath && editor) {
      seededPath = entry.path;
      editor.commands.setContent(entry.body ?? "", { contentType: "markdown" });
      rawMarkdown = entry.body ?? "";
    }
  });

  function switchToMarkdown() {
    if (!editor) return;
    rawMarkdown = editor.getMarkdown();
    editorMode = "markdown";
  }

  function switchToRich() {
    if (!editor) return;
    ($form as Record<string, string>).body = rawMarkdown;
    editor.commands.setContent(rawMarkdown, { contentType: "markdown" });
    editorMode = "rich";
  }

  let contentFullscreen = $state(false);
  $effect(() => {
    if (!contentFullscreen) return;
    document.body.style.overflow = "hidden";
    const guard = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        contentFullscreen = false;
        if (editorMode === "rich" && editor) {
          editor.commands.focus("end");
        } else if (editorMode === "markdown") {
          const markdownEditor = document.getElementById(
            "markdown-editor",
          ) as HTMLTextAreaElement | null;
          markdownEditor?.focus();
        }
      }
    };
    window.addEventListener("keydown", guard);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", guard);
    };
  });

  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      const formElement = document.getElementById(
        "main-entry-form",
      ) as HTMLFormElement;
      formElement?.requestSubmit();
    }
  }

  $effect(() => {
    if (!contentFullscreen) return;
    if (editorMode === "rich" && editor) {
      const frame = requestAnimationFrame(() => editor.commands.focus("end"));
      return () => cancelAnimationFrame(frame);
    } else if (editorMode === "markdown") {
      const frame = requestAnimationFrame(() => {
        const markdownEditor = document.getElementById(
          "markdown-editor",
        ) as HTMLTextAreaElement | null;
        markdownEditor?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  });

  const bodyText = $derived(
    String(($form as Record<string, unknown>).body ?? ""),
  );
  const wordCount = $derived(
    bodyText.trim() ? bodyText.trim().split(/\s+/).length : 0,
  );
  const charCount = $derived(bodyText.length);
  const readingMinutes = $derived(
    wordCount === 0 ? 0 : Math.max(1, Math.round(wordCount / 200)),
  );

  let initialSnapshot = untrack(() => JSON.stringify(data.form.data));
  let hasUnsavedChanges = $state(false);
  let lastSaved = $state<Date | null>(null);

  $effect(() => {
    hasUnsavedChanges = JSON.stringify($form) !== initialSnapshot;
  });

  onMount(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) e.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  });

  function getTags(): string[] {
    const value = ($form as Record<string, unknown>).tags;
    if (Array.isArray(value)) return value as string[];
    if (typeof value === "string")
      return value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    return [];
  }

  const tags = $derived(getTags());

  function handleTagsChange(newTags: string[]) {
    ($form as Record<string, unknown>).tags = newTags;
  }

  const currentTitle = $derived(
    String(
      data.entry?.frontMatter?.title ||
        data.entry?.slug ||
        (data.isNew ? "New Entry" : ""),
    ),
  );

  const saving = $derived($submitting || $delayed);
  let deleting = $state(false);
  function fieldError(name: string): string | undefined {
    const e = ($errors as Record<string, string[] | undefined>)[name];
    return e?.[0];
  }
  const errTitle = $derived(fieldError("title"));
  const errDesc = $derived(fieldError("description"));
  const errDate = $derived(fieldError("date"));
  const folder = $derived(data.folder ?? "");
  let moveDialogOpen = $state(false);
  let targetFolderInput = $state(untrack(() => data.folder ?? ""));
  let targetSlugInput = $state(untrack(() => data.entry?.slug ?? ""));


  const collectionUrl = $derived(() => {
    const params = data?.query;
    if (params && params.length > 0) {
      return `/cms/${encodeURIComponent(data.collection.name)}?${params}`;
    }
    return `/cms/${encodeURIComponent(data.collection.name)}`;
  });
  const payloadQuery = $derived(buildPayloadQuery(data.query ?? "", folder));
  const displayPath = $derived.by(() => {
    if (data.entry?.path) {
      return data.entry.path;
    }
    if (data.collection.path.length > 0 && folder.length > 0) {
      return `${data.collection.path}/${folder}`;
    }
    if (data.collection.path.length > 0) {
      return data.collection.path;
    }
    return folder;
  });
</script>

<svelte:head>
  <title>{data.isNew ? "New entry" : "Edit entry"} | LightCMS</title>
</svelte:head>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="min-h-screen bg-background text-foreground">
  <div
    class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
  >
    <div
      class="mx-auto flex h-auto min-h-14 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:h-14 sm:py-0 md:px-6 lg:px-8"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="sm"
          class="shrink-0"
          onclick={() => goto(collectionUrl())}
          aria-label={data.collection.label}
        >
          <ArrowLeft class="h-4 w-4" />
          <span class="hidden sm:inline">{data.collection.label}</span>
        </Button>
        <Separator orientation="vertical" class="h-6 shrink-0" />
        <span class="truncate font-semibold"
          >{data.isNew ? "New" : currentTitle}</span
        >
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <SaveStatus {saving} {hasUnsavedChanges} {lastSaved} />

        <Button
          form="main-entry-form"
          size="sm"
          class="gap-2"
          disabled={saving}
        >
          <Save class="h-4 w-4" />
          <span class="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
        </Button>
      </div>
    </div>
  </div>

  <main class="mx-auto w-full max-w-7xl space-y-8 px-4 md:px-6 lg:px-8 py-8">
    <header>
      <p
        class="text-sm text-muted-foreground uppercase tracking-wider font-semibold"
      >
        {data.isNew ? "New entry" : "Editing entry"}
      </p>
      <h1 class="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {data.isNew
          ? `Create a new ${data.collection.label}`
          : `Edit ${currentTitle}`}
      </h1>
      <p class="mt-4 max-w-2xl text-muted-foreground">
        {#if folder}
          <span
            class="inline-flex items-center gap-1.5 font-mono text-xs rounded-md bg-muted border px-2 py-0.5"
          >
            <FolderOpen size={12} class="text-primary-500" />
            <span class="text-foreground"
              >{`${data.collection.path}/${folder}`}</span
            >
          </span>
        {/if}
        {#if hasUnsavedChanges}
          <span class="text-amber-500 font-medium"
            >You have unsaved changes.</span
          >
        {/if}
      </p>
    </header>

    <Card>
      <form
        id="main-entry-form"
        method="POST"
        action={`?/save${payloadQuery ? `&${payloadQuery}` : ""}`}
        class="space-y-6"
        aria-busy={saving}
        use:enhance
      >
        <CardContent class="space-y-8 pt-6">
          <!-- Global message banner -->
          {#if $message}
            <Alert
              variant={($errors as Record<string, unknown>)._errors
                ? "destructive"
                : "default"}
            >
              <AlertTitle
                >{($errors as Record<string, unknown>)._errors
                  ? "Error"
                  : "Saved"}</AlertTitle
              >
              <AlertDescription>{$message}</AlertDescription>
            </Alert>
          {/if}
          {#if ($errors as Record<string, string[]>)._errors}
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {(
                  ($errors as Record<string, string[]>)._errors ??
                  []
                ).join(" ")}
              </AlertDescription>
            </Alert>
          {/if}

          <p
            id="save-status"
            class="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            {#if saving}Saving…{:else if hasUnsavedChanges}Unsaved changes{:else if lastSaved}Last
              saved {timeAgo(lastSaved)}{/if}
          </p>

          <div class="space-y-4">
            <h3 class="text-lg font-medium">Front Matter</h3>
            <Separator />

            <div class="grid gap-4 md:grid-cols-2">
              <div class="grid gap-2">
                <Label
                  for="field-title"
                  class="flex items-center gap-2 font-semibold"
                >
                  Title
                  <Badge variant="destructive" class="text-xs h-5"
                    >Required</Badge
                  >
                </Label>
                <Input
                  id="field-title"
                  name="title"
                  required
                  aria-invalid={!!errTitle}
                  aria-describedby={errTitle ? "err-title" : undefined}
                  value={($form as Record<string, string>).title ?? ""}
                  oninput={(e) => {
                    ($form as Record<string, string>).title = (e.currentTarget as HTMLInputElement).value;
                  }}
                  placeholder="Enter title..."
                />
                {#if errTitle}<p
                    id="err-title"
                    class="text-sm text-destructive"
                  >
                    {errTitle}
                  </p>{/if}
              </div>
              <div class="grid gap-2">
                <Label for="field-description" class="font-semibold"
                  >Description</Label
                >
                <Textarea
                  id="field-description"
                  name="description"
                  value={($form as Record<string, string>).description ?? ""}
                  oninput={(e) => {
                    ($form as Record<string, string>).description = (e.currentTarget as HTMLTextAreaElement).value;
                  }}
                  rows={3}
                  placeholder="Enter description..."
                />
                {#if errDesc}<p class="text-sm text-destructive">
                    {errDesc}
                  </p>{/if}
              </div>
            </div>

            <!-- Date (datetime) -->
            <div class="grid gap-2 max-w-sm">
              <Label
                for="field-date"
                class="flex items-center gap-2 font-semibold"
              >
                Date
                <Badge variant="destructive" class="text-xs h-5">Required</Badge
                >
              </Label>
              <Input
                id="field-date"
                type="datetime-local"
                name="date"
                required
                aria-invalid={!!errDate}
                value={($form as Record<string, string>).date ?? ""}
                oninput={(e) => {
                  ($form as Record<string, string>).date = (e.currentTarget as HTMLInputElement).value;
                }}
              />
              {#if errDate}<p class="text-sm text-destructive">
                  {errDate}
                </p>{/if}
            </div>

            <!-- Draft (checkbox) -->
            <div
              class="flex items-center space-x-2 rounded-md border p-4 transition-colors hover:bg-accent hover:text-accent-foreground max-w-sm"
            >
              <Checkbox
                id="field-draft"
                name="draft"
                checked={($form as Record<string, boolean>).draft ?? false}
                onCheckedChange={(v) => {
                  ($form as Record<string, boolean>).draft = v as boolean;
                }}
              />
              <Label
                for="field-draft"
                class="text-sm font-semibold cursor-pointer">Draft</Label
              >
            </div>

            <!-- Slug (always present) — defaults to unix timestamp -->
            <div class="grid gap-2 max-w-sm">
              <Label for="slug" class="font-semibold"
                >Slug <span class="text-xs font-normal text-muted-foreground"
                  >(defaults to unix time)</span
                ></Label
              >
              <Input
                id="slug"
                class="font-mono"
                name="slug"
                aria-invalid={!!$errors.slug}
                value={($form as Record<string, string>).slug ?? ""}
                oninput={(e) => {
                  ($form as Record<string, string>).slug = (e.currentTarget as HTMLInputElement).value;
                }}
                placeholder="e.g. 1724412345"
              />
              <p class="text-xs text-muted-foreground">
                Leave as it is or use lowercase letters, numbers and hyphens.
              </p>
              {#if fieldError("slug")}<p class="text-sm text-destructive">
                  {fieldError("slug")}
                </p>{/if}
            </div>
            <TagManager {tags} onTagsChange={handleTagsChange} />
          </div>

          <!-- Content Editor -->
          <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div class="flex flex-wrap items-center gap-3">
                <h3 class="text-lg font-medium">Content</h3>
                <fieldset
                  class="flex rounded-md border border-input"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onclick={switchToRich}
                    disabled={editorMode === "rich"}
                    aria-pressed={editorMode === "rich"}
                    class="gap-1.5 rounded-r-none border-r border-input"
                  >
                    <Type class="h-4 w-4" />
                    <span class="hidden sm:inline">Rich Text</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onclick={switchToMarkdown}
                    disabled={editorMode === "markdown"}
                    aria-pressed={editorMode === "markdown"}
                    class="gap-1.5 rounded-l-none"
                  >
                    <FileCode class="h-4 w-4" />
                    <span class="hidden sm:inline">Markdown</span>
                  </Button>
                </fieldset>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="gap-1.5 shrink-0"
                onclick={() => (contentFullscreen = true)}
                aria-expanded={contentFullscreen}
                aria-controls="editor-pane"
              >
                <Maximize class="h-4 w-4" />
                Fullscreen
              </Button>
            </div>
            <Separator />
            {#if editorMode === "rich" && editor}
              <div
                id="editor-pane"
                class:fixed={contentFullscreen}
                class:inset-0={contentFullscreen}
                class:z-50={contentFullscreen}
                class:bg-background={contentFullscreen}
                class="border rounded-lg {contentFullscreen
                  ? 'flex flex-col h-dvh rounded-none border-0 animate-in fade-in-0 zoom-in-95 duration-200'
                  : ''}"
              >
                {#if contentFullscreen}
                  <div
                    class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background/95 px-4 py-3 sm:px-6 backdrop-blur supports-backdrop-filter:bg-background/60"
                  >
                    <div class="flex min-w-0 items-center gap-2.5">
                      <span class="truncate font-bold text-foreground"
                        >{data.isNew ? "New entry" : currentTitle}</span
                      >
                      <span
                        class="hidden font-mono text-xs text-muted-foreground sm:inline"
                      >
                        {folder
                          ? `${data.collection.path}/${folder}`
                          : data.collection.path}
                      </span>
                    </div>

                    <div
                      class="flex items-center gap-3 text-xs font-medium text-muted-foreground"
                    >
                      <span class="flex items-center gap-1.5">
                        <Type size={13} class="text-primary-500" />
                        <span
                          >{wordCount}
                          {wordCount === 1 ? "word" : "words"}</span
                        >
                      </span>
                      <span class="hidden items-center gap-1.5 sm:flex">
                        <Clock3 size={13} class="text-primary-500" />
                        <span
                          >{readingMinutes === 0
                            ? "–"
                            : `${readingMinutes} min read`}</span
                        >
                      </span>
                    </div>

                    <div class="ml-auto flex min-w-0 items-center gap-2">
                      <SaveStatus {saving} {hasUnsavedChanges} {lastSaved} />

                      <Button
                        type="submit"
                        form="main-entry-form"
                        size="sm"
                        class="gap-1.5"
                        disabled={saving}
                      >
                        <Save class="h-4 w-4" />
                        <span class="hidden sm:inline"
                          >{saving ? "Saving..." : "Save"}</span
                        >
                        <kbd
                          class="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground sm:inline"
                          >⌘S</kbd
                        >
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="gap-1.5"
                        onclick={() => (contentFullscreen = false)}
                      >
                        <Minimize class="h-4 w-4" />
                        <span class="hidden sm:inline">Exit</span>
                        <kbd
                          class="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground sm:inline"
                          >Esc</kbd
                        >
                      </Button>
                    </div>
                  </div>
                {/if}

                <div class="flex min-h-0 flex-1 flex-col">
                  <Edra {editor}>
                    <Edra.UseAI />
                    <Edra.Toolbar
                      class="shrink-0 scrollbar-none overflow-x-scroll border-b p-1.5 {contentFullscreen
                        ? 'border-muted bg-muted/40 py-3 px-4 sm:px-6 justify-center h-max w-full '
                        : 'max-w-full!'}"
                    />
                    <Edra.BubbleMenu />
                    {#if contentFullscreen}
                      <Edra.ToC />
                    {/if}
                    <Edra.Content
                      class="*:outline-none cursor-auto overflow-y-scroll {contentFullscreen
                        ? 'flex-1 min-h-0 w-full max-w-3xl mx-auto px-4 py-12 sm:px-6 sm:py-16'
                        : 'h-72 sm:h-130 px-4 py-4 sm:px-8'}"
                    />
                    <Edra.DragHandle />
                  </Edra>
                </div>

                {#if contentFullscreen}
                  <div
                    class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t bg-background/95 px-4 py-2.5 text-xs text-muted-foreground sm:px-6 backdrop-blur supports-backdrop-filter:bg-background/60"
                  >
                    <div class="flex items-center gap-4">
                      <span>
                        <span class="font-semibold text-foreground"
                          >{charCount}</span
                        > characters
                      </span>
                      <span class="hidden sm:inline">
                        <span class="font-semibold text-foreground"
                          >{wordCount}</span
                        > words
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5 font-mono">
                      <CloudCheck size={13} class="text-emerald-500" />
                      <span
                        >{saving
                          ? "Saving to GitHub…"
                          : hasUnsavedChanges
                            ? "Draft — not saved"
                            : "Synced to repository"}</span
                      >
                    </div>
                  </div>
                {/if}
              </div>
            {:else if editorMode === "markdown"}
              <div
                id="editor-pane"
                class:fixed={contentFullscreen}
                class:inset-0={contentFullscreen}
                class:z-50={contentFullscreen}
                class:bg-background={contentFullscreen}
                class="border rounded-lg {contentFullscreen
                  ? 'flex flex-col h-dvh rounded-none border-0 animate-in fade-in-0 zoom-in-95 duration-200'
                  : ''}"
              >
                {#if contentFullscreen}
                  <div
                    class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background/95 px-4 py-3 sm:px-6 backdrop-blur supports-backdrop-filter:bg-background/60"
                  >
                    <div class="flex min-w-0 items-center gap-2.5">
                      <span class="truncate font-bold text-foreground"
                        >{data.isNew ? "New entry" : currentTitle}</span
                      >
                      <span
                        class="hidden font-mono text-xs text-muted-foreground sm:inline"
                      >
                        {folder
                          ? `${data.collection.path}/${folder}`
                          : data.collection.path}
                      </span>
                    </div>

                    <div
                      class="flex items-center gap-3 text-xs font-medium text-muted-foreground"
                    >
                      <span class="flex items-center gap-1.5">
                        <FileCode size={13} class="text-primary-500" />
                        <span
                          >{wordCount}
                          {wordCount === 1 ? "word" : "words"}</span
                        >
                      </span>
                      <span class="hidden items-center gap-1.5 sm:flex">
                        <Clock3 size={13} class="text-primary-500" />
                        <span
                          >{readingMinutes === 0
                            ? "–"
                            : `${readingMinutes} min read`}</span
                        >
                      </span>
                    </div>

                    <div class="ml-auto flex min-w-0 items-center gap-2">
                      <SaveStatus {saving} {hasUnsavedChanges} {lastSaved} />

                      <Button
                        type="submit"
                        form="main-entry-form"
                        size="sm"
                        class="gap-1.5"
                        disabled={saving}
                      >
                        <Save class="h-4 w-4" />
                        <span class="hidden sm:inline"
                          >{saving ? "Saving..." : "Save"}</span
                        >
                        <kbd
                          class="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground sm:inline"
                          >⌘S</kbd
                        >
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="gap-1.5"
                        onclick={() => (contentFullscreen = false)}
                      >
                        <Minimize class="h-4 w-4" />
                        <span class="hidden sm:inline">Exit</span>
                        <kbd
                          class="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground sm:inline"
                          >Esc</kbd
                        >
                      </Button>
                    </div>
                  </div>
                {/if}

                <div class="flex min-h-0 flex-1 flex-col">
                  <Textarea
                    id="markdown-editor"
                    class="font-mono text-sm flex-1 min-h-0 w-full resize-none border-0 focus-visible:ring-0 px-4 py-4 sm:px-8 {contentFullscreen
                      ? 'max-w-3xl mx-auto w-full'
                      : ''}"
                    value={rawMarkdown}
                    oninput={(e) => {
                      rawMarkdown = (e.currentTarget as HTMLTextAreaElement).value;
                      ($form as Record<string, string>).body = rawMarkdown;
                    }}
                    placeholder="Write markdown..."
                  />
                </div>

                {#if contentFullscreen}
                  <div
                    class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t bg-background/95 px-4 py-2.5 text-xs text-muted-foreground sm:px-6 backdrop-blur supports-backdrop-filter:bg-background/60"
                  >
                    <div class="flex items-center gap-4">
                      <span>
                        <span class="font-semibold text-foreground"
                          >{charCount}</span
                        > characters
                      </span>
                      <span class="hidden sm:inline">
                        <span class="font-semibold text-foreground"
                          >{wordCount}</span
                        > words
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5 font-mono">
                      <CloudCheck size={13} class="text-emerald-500" />
                      <span
                        >{saving
                          ? "Saving to GitHub…"
                          : hasUnsavedChanges
                            ? "Draft — not saved"
                            : "Synced to repository"}</span
                      >
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </CardContent>

        <CardFooter
          class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-6"
        >
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button
              variant="outline"
              type="button"
              onclick={() => goto(collectionUrl())}
            >
              Cancel
            </Button>
            {#if !data.isNew}
              <span class="basis-full text-xs text-muted-foreground sm:basis-auto sm:text-sm">
                Stored at <code class="font-mono break-all">{displayPath}</code>.
              </span>
            {/if}
          </div>

          <div class="flex flex-wrap items-center gap-2 sm:gap-3 sm:w-auto justify-end">
            {#if !data.isNew}
              <Dialog bind:open={moveDialogOpen}>
                <DialogTrigger>
                  {#snippet child({ props })}
                    <Button
                      {...props}
                      variant="outline"
                      size="sm"
                      class="gap-2"
                    >
                      <FolderInput class="h-4 w-4" />
                      Move
                    </Button>
                  {/snippet}
                </DialogTrigger>
                <DialogContent class="sm:max-w-md">
                  <form
                    method="POST"
                    action={`?/move${payloadQuery ? `&${payloadQuery}` : ""}`}
                    class="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>Move Markdown Entry</DialogTitle>
                      <DialogDescription>
                        Move <strong class="text-foreground">{data.entry?.slug}.md</strong> to another folder in this collection.
                      </DialogDescription>
                    </DialogHeader>
                    <div class="space-y-3 py-2">
                      <div class="rounded-xl border bg-muted/40 p-3 text-xs space-y-1">
                        <div class="text-muted-foreground">Current location:</div>
                        <div class="font-mono font-semibold text-foreground truncate">
                          {#if folder}
                            {`${data.collection.path}/${folder}`}
                          {:else}
                            {data.collection.path} (Collection Root)
                          {/if}
                        </div>
                      </div>

                      <div class="space-y-1.5">
                        <Label for="entry-move-dest">Destination Folder</Label>
                        <Input
                          id="entry-move-dest"
                          name="toFolder"
                          bind:value={targetFolderInput}
                          placeholder="Leave empty for collection root, or enter folder name"
                          autocomplete="off"
                        />
                      </div>

                      <div class="space-y-1.5">
                        <Label for="entry-move-slug">Entry Slug</Label>
                        <Input
                          id="entry-move-slug"
                          name="newSlug"
                          bind:value={targetSlugInput}
                          required
                          autocomplete="off"
                        />
                      </div>
                    </div>
                    <DialogFooter class="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onclick={() => (moveDialogOpen = false)}>Cancel</Button>
                      <Button type="submit">Move Entry</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog>

                <DialogTrigger>
                  {#snippet child({ props })}
                    <Button
                      {...props}
                      variant="destructive"
                      size="sm"
                      class="gap-2"
                    >
                      <Trash class="h-4 w-4" />
                      Delete
                    </Button>
                  {/snippet}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete entry</DialogTitle>
                    <DialogDescription>
                      This will permanently delete <strong
                        class="text-foreground">{data.entry?.slug}.md</strong
                      > from the repository. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose>
                      {#snippet child({ props })}
                        <Button {...props} variant="outline">Cancel</Button>
                      {/snippet}
                    </DialogClose>
                    <Button
                      type="submit"
                      form="delete-entry-form"
                      variant="destructive"
                      class="gap-2"
                      disabled={deleting}
                    >
                      <Trash class="h-4 w-4" />
                      {deleting ? "Deleting..." : "Delete permanently"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            {/if}

            <Button type="submit" class="gap-2" disabled={saving}>
              <Save class="h-4 w-4" />
              {saving ? "Saving..." : "Save entry"}
            </Button>
          </div>
        </CardFooter>
      </form>

      {#if !data.isNew}
        <form
          id="delete-entry-form"
          method="POST"
          action={`?/delete${payloadQuery ? `&${payloadQuery}` : ""}`}
          aria-busy={deleting}
          use:formEnhance={() => {
            deleting = true;
            return async ({ update }) => {
              await update();
              deleting = false;
            };
          }}
        ></form>
      {/if}
    </Card>
  </main>
</div>
