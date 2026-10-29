<script lang="ts">
import Check from "@lucide/svelte/icons/check";
import ChevronDown from "@lucide/svelte/icons/chevron-down";
import ChevronRight from "@lucide/svelte/icons/chevron-right";
import Copy from "@lucide/svelte/icons/copy";
import FileCode from "@lucide/svelte/icons/file-code";
import FileText from "@lucide/svelte/icons/file-text";
import Link from "@lucide/svelte/icons/link";
import { toast } from "svelte-sonner";
import { Button } from "$lib/components/ui/button";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

let {
	section = "Get Started",
	title = "Introduction",
	rawMarkdown = "",
}: {
	section: string;
	title: string;
	rawMarkdown?: string;
} = $props();

let copied = $state(false);

async function copyForLlm(): Promise<void> {
	const promptContext = [
		`# Documentation: ${title}`,
		`Section: ${section}`,
		`Source: LightCMS Official Docs`,
		"",
		"Below is the documentation content:",
		"",
		rawMarkdown,
	].join("\n");

	try {
		await navigator.clipboard.writeText(promptContext);
		copied = true;
		toast.success("Copied page markdown for LLM!");
		setTimeout(() => {
			copied = false;
		}, 2000);
	} catch {
		toast.error("Failed to copy to clipboard");
	}
}

async function copyPageLink(): Promise<void> {
	try {
		await navigator.clipboard.writeText(window.location.href);
		toast.success("Page link copied to clipboard!");
	} catch {
		toast.error("Failed to copy link");
	}
}
</script>

<div class="flex items-center justify-between gap-4 py-1">
	<nav aria-label="Breadcrumb" class="flex items-center gap-1.5 font-mono text-xs text-muted-foreground/80">
		<span class="tracking-wide uppercase">{section}</span>
		<ChevronRight size={12} class="text-muted-foreground/40" />
		<span class="font-semibold text-foreground">{title}</span>
	</nav>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button
				variant="outline"
				size="sm"
				class="h-7 gap-1.5 border-border/80 bg-card/60 px-2.5 font-mono text-xs font-semibold shadow-xs hover:border-primary/50 hover:bg-muted/60"
			>
				<FileCode size={13} class="text-primary" />
				<span>LLM</span>
				<ChevronDown size={12} class="text-muted-foreground" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56 font-sans">
			<DropdownMenu.Label class="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
				LLM Actions
			</DropdownMenu.Label>
			<DropdownMenu.Item onclick={copyForLlm} class="gap-2 text-xs">
				{#if copied}
					<Check size={14} class="text-emerald-500" />
					<span class="text-emerald-500 font-semibold">Copied!</span>
				{:else}
					<Copy size={14} class="text-muted-foreground" />
					<span>Copy for LLM (.md)</span>
				{/if}
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={copyPageLink} class="gap-2 text-xs">
				<Link size={14} class="text-muted-foreground" />
				<span>Copy Page Link</span>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
