<script lang="ts">
	import { WandSparkles } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { cn } from '$lib/utils.js';
	import { commands } from '../../commands/index.js';
	import MicButton from '../../harper/MicButton.svelte';
	import { addAIHighlight, getEditor } from '../../tiptap/index.js';
	import { useAiEnabled } from '../hooks/useAiEnabled.svelte.js';
	import { useCommandState } from '../hooks/useCommandState.svelte.js';
	import Tooltip from './Tooltip.svelte';
	import Colors from './tools/Colors.svelte';
	import Export from './tools/Export.svelte';

	interface Props {
		class?: string;
	}
	const { class: className }: Props = $props();

	const editor = getEditor();

	const isAiEnabled = useAiEnabled(editor);
	const { isActive, isClickable } = useCommandState(editor);
	const commandsKeys = Object.keys(commands);

	const insertTranscript = (text: string) => {
		const clean = text.trim();
		if (clean.length === 0) {
			return;
		}
		// Streaming finals arrive chunk by chunk ("hello", "world").
		// Trail with a space so consecutive chunks do not join together.
		editor.chain().focus().insertContent(`${clean} `).run();
	};
</script>

<div class={cn('flex h-full w-fit items-center gap-2', className)}>
	<Tooltip tooltip="Dictate (live speech to text)">
		<MicButton onTranscript={insertTranscript} />
	</Tooltip>
	{#if isAiEnabled()}
		<Tooltip tooltip="Use AI">
			<Button
				onmousedown={(e) => {
					e.preventDefault();
					addAIHighlight(editor);
				}}
				variant="ghost"
				size="icon"
			>
				<WandSparkles />
			</Button>
		</Tooltip>
	{/if}
	{#each commandsKeys as key (key)}
		{@const group = commands[key]}
		{#each group as command, idx (idx)}
			{@const Icon = command.icon}
			<Tooltip tooltip={command.tooltip} shortCut={command.shortCut ?? ''}>
				<Button
					variant="ghost"
					size="icon"
					class={cn(isActive(command) && 'bg-muted text-primary')}
					disabled={!isClickable(command)}
					onclick={() => {
						command.onClick?.(editor);
					}}
				>
					<Icon />
				</Button>
			</Tooltip>
		{/each}
		<Separator orientation="vertical" class="h-6!" />
	{/each}
	<Colors />
	<Export />
</div>
