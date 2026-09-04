<script lang="ts">
	import { FolderPlus, Sparkles } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import { Button } from "$lib/components/ui/button";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";

	interface Props {
		open?: boolean;
		targetPath: string;
		error?: string;
		action?: string;
		title?: string;
		description?: string;
		onSuccess?: () => void;
	}

	let {
		open: dialogOpen = $bindable(false),
		targetPath,
		error = '',
		action = "?/createFolder",
		title = "New Folder",
		description,
		onSuccess,
	}: Props = $props();

	let folderName = $state("");

	$effect(() => {
		if (dialogOpen) {
			folderName = "";
		}
	});
</script>

<Dialog bind:open={dialogOpen}>
	<DialogContent class="max-w-sm">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<Sparkles size={16} class="text-primary-500" />
				{title}
			</DialogTitle>
			<DialogDescription>
				{#if description}
					{description}
				{:else}
					Create a folder inside <span class="font-mono font-medium text-foreground">{targetPath}</span>.
				{/if}
			</DialogDescription>
		</DialogHeader>
		<form
			method="POST"
			{action}
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === "redirect" || result.type === "success") {
						dialogOpen = false;
						onSuccess?.();
					}
				};
			}}
		>
			<div class="grid gap-2 py-4">
				<Label for="create-folder-input">Folder name</Label>
				<Input
					id="create-folder-input"
					name="name"
					placeholder="e.g. tutorials, archive"
					bind:value={folderName}
					required
				/>
				{#if error}
					<p class="text-xs font-semibold text-destructive">{error}</p>
				{/if}
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (false)}>
					Cancel
				</Button>
				<Button type="submit" class="gap-2">
					<FolderPlus size={15} />
					Create folder
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
