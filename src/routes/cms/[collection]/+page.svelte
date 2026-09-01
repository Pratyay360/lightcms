<script lang="ts">
	import {
		ArrowLeft,
		ChevronRight,
		File,
		FileText,
		Folder,
		FolderOpen,
		FolderPlus,
		Home,
    LoaderCircle,
		Plus,
		Sparkles,
		Trash,
		TriangleAlert
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import { goto, invalidateAll } from "$app/navigation";
	import { CreateFolderDialog } from "$lib/components/custom";
	import { Button } from "$lib/components/ui/button";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import { createLightCmsClient } from "$lib/orpc-client";
	import { buildEntryUrl, buildFolderUrl, buildPayloadQuery, withFolder } from "$lib/utils/cms-url";
	import type { PageData } from "./$types";

	let { data, form }: { data: PageData; form?: { folderError?: string } | null } = $props();

	const folderError = $derived(form?.folderError);

	const collection = $derived(data.collection);
	const folders = $derived(data.folders );
	const entries = $derived(data.entries);
	const query = $derived(data.query);
	const selection = $derived(data.selection);
	const primaryField = $derived(data.primaryField);
	const folder = $derived(data.folder ?? "");
	const segments = $derived(folder ? folder.split("/") : []);
	const isRoot = $derived(folder === "");
	const currentPath = $derived(isRoot ? collection.path : `${collection.path}/${folder}`);

	function folderUrl(folderPath: string) {
		return buildFolderUrl(collection.name, query, folderPath);
	}

	function entryUrl(entry: { slug: string }) {
		return buildEntryUrl(collection.name, query, entry.slug, folder);
	}

	function newEntryUrl() {
		return buildEntryUrl(collection.name, query, "new", folder);
	}

	let createFolderOpen = $state(false);

	function openCreateFolder() {
		createFolderOpen = true;
	}

	const folderPayloadQuery = $derived(buildPayloadQuery(query, folder));
	const createFolderAction = $derived(`?/createFolder${folderPayloadQuery ? `&${folderPayloadQuery}` : ""}`);
	let deleteDialogOpen = $state(false);
	let deleteTarget: { name: string; path: string } | null = $state(null);
	let deleting = $state(false);
	let deleteError: string | null = $state(null);

	function openDeleteDialog(entry: { name: string; path: string }) {
		deleteTarget = entry;
		deleteError = null;
		deleteDialogOpen = true;
	}

	function closeDeleteDialog() {
		deleteDialogOpen = false;
	}

	async function confirmDeleteFolder() {
		if (!deleteTarget) return;
		if (!selection?.installationId || !selection?.repository) {
			deleteError = "Missing repository selection. Please re-select your repository.";
			toast.error(deleteError);
			return;
		}
		const targetPath = deleteTarget.path;
		const targetName = deleteTarget.name;
		deleting = true;
		deleteError = null;
		try {
			const client = createLightCmsClient();
			await client.cms.deleteFolder({
				installationId: selection.installationId,
				repository: selection.repository,
				branch: selection.branch ?? undefined,
				directoryPath: targetPath,
			});
			toast.success(`Deleted folder "${targetName}"`);
			deleteDialogOpen = false;
			deleteTarget = null;
			const currentFolderPath = `${collection.path}/${folder}`;
			if (targetPath && currentFolderPath === targetPath) {
				const parent = folder.split("/").slice(0, -1).join("/");
				const params = withFolder(query, parent);
				await goto(`/cms/${encodeURIComponent(collection.name)}?${params}`, { invalidateAll: true });
			} else {
				await invalidateAll();
			}
		} catch (cause) {
			throw new Error(`Error ${cause}`);
		} finally {
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>{collection.label ?? collection.name} | LightCMS</title>
</svelte:head>

<section class="space-y-8">
	<header class="flex flex-col gap-6 border-b border-border/50 pb-6 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<a
					href={`/cms?${query}`}
					class="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary-500 transition-colors bg-muted/50 hover:bg-muted border px-2.5 py-1.5 rounded-lg"
				>
					<ArrowLeft size={14} /> Dashboard
				</a>
			</div>
			<div class="space-y-1">
				<h1 class="text-3xl font-black tracking-tight text-foreground">
					{collection.label ?? collection.name}
				</h1>
				<p class="font-mono text-xs text-muted-foreground flex items-center gap-1">
					<FileText size={12} class="text-primary-500" />
					<span>Path:</span>
					<span class="text-foreground">
						{isRoot ? collection.path : `${collection.path}/${folder}`}
					</span>
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2 shrink-0">
			{#if !isRoot}
				<Button
					type="button"
					variant="ghost"
					class="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
					onclick={() => openDeleteDialog({ name: segments[segments.length - 1] ?? folder, path: currentPath })}
				>
					<Trash size={16} /> Delete Folder
				</Button>
			{/if}
			<Button type="button" variant="outline" class="gap-2" onclick={openCreateFolder}>
				<FolderPlus size={16} /> New Folder
			</Button>
			<a
				href={newEntryUrl()}
				class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-xs hover:opacity-90 active:scale-[0.98] transition-all"
			>
				<Plus size={16} /> New Entry
			</a>
		</div>
	</header>

	<!-- Breadcrumb -->
	<nav aria-label="Breadcrumb" class="flex items-center gap-1 text-xs font-semibold">
		<a
			href={folderUrl("")}
			class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			aria-current={isRoot ? "page" : undefined}
		>
			<Home size={13} />
			<span class="font-mono">{collection.path}</span>
		</a>
		{#each segments as segment, index (segment)}
			<ChevronRight size={13} class="text-muted-foreground/50" />
			{#if index === segments.length - 1}
				<span class="inline-flex items-center gap-1 rounded-md px-2 py-1 bg-primary/10 text-primary">
					<FolderOpen size={13} />
					<span class="font-mono">{segment}</span>
				</span>
			{:else}
				<a
					href={folderUrl(segments.slice(0, index + 1).join("/"))}
					class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<span class="font-mono">{segment}</span>
				</a>
			{/if}
		{/each}
	</nav>

	{#if folderError && (folders.length > 0 || entries.length > 0)}
		<div class="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-semibold text-destructive flex items-center gap-2">
			<TriangleAlert size={14} />
			<span>{folderError}</span>
		</div>
	{/if}
	{#if deleteError}
		<div class="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-semibold text-destructive flex items-center gap-2">
			<TriangleAlert size={14} />
			<span>{deleteError}</span>
		</div>
	{/if}

	{#if folders.length === 0 && entries.length === 0}
		<div class="rounded-2xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto shadow-xs">
			<div class="grid size-14 place-items-center rounded-2xl bg-primary-500/10 text-primary-500 shadow-inner">
				<LoaderCircle size={26} />
			</div>
			<h3 class="mt-5 text-xl font-bold text-foreground">
				{isRoot ? `Setup ${collection.label ?? collection.name}` : "This folder is empty"}
			</h3>
			<p class="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
				{isRoot
					? `Start your workspace on GitHub by initializing the ${collection.path}/ directory, organizing folders, or creating your first entry.`
					: "Create a subfolder to organize your posts, or start writing an entry."}
			</p>
			{#if folderError}
				<div class="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2 text-xs font-semibold text-destructive">
					{folderError}
				</div>
			{/if}
			<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
				{#if isRoot}
					<form method="POST" action="?/initialize" use:enhance>
						<Button type="submit" variant="outline" class="gap-2 text-xs font-semibold">
							<Sparkles size={14} class="text-primary-500" /> Initialize Structure
						</Button>
					</form>
				{/if}
				<Button type="button" variant="outline" class="gap-2 text-xs font-semibold" onclick={openCreateFolder}>
					<FolderPlus size={14} /> New Folder
				</Button>
				<a
					href={newEntryUrl()}
					class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-90 transition-all"
				>
					<Plus size={14} /> Create entry
				</a>
			</div>
		</div>
	{:else}
		<!-- Folders -->
		{#if folders.length > 0}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each folders as folderEntry}
					<div
						class="group relative rounded-2xl border border-border bg-card p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary-500/40"
					>
						<a
							href={folderUrl(`${folder ? `${folder}/` : ''}${folderEntry.name}`)}
							class="flex items-center gap-4 min-w-0 flex-1"
							aria-label={`Open folder ${folderEntry.name}`}
						>
							<div
								class="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-500/10 text-primary-500 transition-all duration-300 group-hover:bg-primary-500 group-hover:text-white"
							>
								<Folder size={20} />
							</div>
							<div class="min-w-0 flex-1">
								<h3 class="text-sm font-extrabold text-foreground truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
									{folderEntry.name}
								</h3>
								<p class="mt-0.5 font-mono text-[10px] text-muted-foreground truncate">
									{folderEntry.path}
								</p>
							</div>
						</a>
						<div class="flex items-center gap-1 shrink-0">
							<Button
								variant="ghost"
								size="icon"
								class="size-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:opacity-100 opacity-60 transition-colors"
								onclick={() => openDeleteDialog(folderEntry)}
								aria-label={`Delete folder ${folderEntry.name}`}
							>
								<Trash size={14} />
							</Button>
							<ChevronRight
								size={16}
								class="shrink-0 text-muted-foreground transition-all group-hover:text-primary-500 group-hover:translate-x-0.5 pointer-events-none"
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Entries -->
		{#if entries.length > 0}
			<div class="flex items-center gap-2">
				<File size={13} class="text-muted-foreground" />
				<span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
					{entries.length} {entries.length === 1 ? "entry" : "entries"}
				</span>
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each entries as entry}
					<a
						href={entryUrl(entry)}
						class="group rounded-2xl border border-border bg-card flex flex-col justify-between p-5 transition-all duration-350 hover:-translate-y-1 hover:shadow-xl hover:border-primary-500/40"
					>
						<div class="space-y-3">
							<h3 class="text-base font-extrabold text-foreground group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
								{String(entry.frontMatter?.[primaryField] ?? entry.slug)}
							</h3>
							<p class="font-mono text-[10px] text-muted-foreground bg-muted border px-2 py-0.5 rounded inline-block max-w-full truncate">
								{entry.slug}
							</p>
						</div>

						<div class="mt-5 flex items-center justify-between border-t border-border/50 pt-3 text-[10px] text-muted-foreground">
							<span class="truncate font-mono">{entry.path.split('/').pop()}</span>
							<ChevronRight size={14} class="text-muted-foreground group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</section>

<CreateFolderDialog
	bind:open={createFolderOpen}
	targetPath={currentPath}
	error={folderError}
	action={createFolderAction}
/>

<Dialog bind:open={deleteDialogOpen}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2 text-destructive">
				<Trash size={16} />
				Delete folder
			</DialogTitle>
			<DialogDescription>
				{#if deleteTarget}
					This will permanently delete <span class="font-mono font-semibold text-foreground">{deleteTarget.path}</span> and all its contents from the repository. This action cannot be undone.
				{:else}
					Delete this folder and all its contents?
				{/if}
			</DialogDescription>
		</DialogHeader>
		{#if deleteError}
			<div class="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive flex items-center gap-2">
				<TriangleAlert size={14} />
				<span>{deleteError}</span>
			</div>
		{/if}
		<DialogFooter>
			<Button type="button" variant="outline" onclick={closeDeleteDialog} disabled={deleting}>
				Cancel
			</Button>
			<Button type="button" variant="destructive" class="gap-2" onclick={confirmDeleteFolder} disabled={deleting}>
				{#if deleting}
        <LoaderCircle />
					Deleting...
				{:else}
					<Trash size={14} />
					Delete permanently
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
