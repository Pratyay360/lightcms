<script lang="ts">
	import Captions from '@lucide/svelte/icons/captions';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import Fullscreen from '@lucide/svelte/icons/fullscreen';
	import AlignCenter from '@lucide/svelte/icons/text-align-center';
	import AlignRight from '@lucide/svelte/icons/text-align-end';
	import AlignLeft from '@lucide/svelte/icons/text-align-start';
	import Trash from '@lucide/svelte/icons/trash-2';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils.js';
	import strings from '../../../strings.js';

	interface Props {
		align: string | null;
		opened: boolean;
		resizing: boolean;
		onAlign: (align: string) => void;
		onCaption: () => void;
		onDuplicate: () => void;
		onFullscreen: () => void;
		onDelete: () => void;
	}

	let {
		align,
		opened = $bindable(false),
		resizing,
		onAlign,
		onCaption,
		onDuplicate,
		onFullscreen,
		onDelete,
	}: Props = $props();
</script>

<div
	class={cn(
		'absolute -top-2 left-[calc(50%-3rem)] z-50! flex items-center gap-1 rounded-md border bg-background/50 p-1 opacity-0 backdrop-blur-sm transition-opacity',
		!resizing && 'group-hover:opacity-100',
		opened && 'opacity-100'
	)}
>
	<Button
		variant="ghost"
		size="icon-xs"
		class={cn(align === 'left' && 'bg-muted')}
		onclick={() => onAlign('left')}
		title={strings.extension.media.alignLeft}
	>
		<AlignLeft />
	</Button>
	<Button
		variant="ghost"
		size="icon-xs"
		class={cn(align === 'center' && 'bg-muted')}
		onclick={() => onAlign('center')}
		title={strings.extension.media.alignCenter}
	>
		<AlignCenter />
	</Button>
	<Button
		variant="ghost"
		size="icon-xs"
		class={cn(align === 'right' && 'bg-muted')}
		onclick={() => onAlign('right')}
		title={strings.extension.media.alignRight}
	>
		<AlignRight />
	</Button>
	<DropdownMenu.Root bind:open={opened}>
		<DropdownMenu.Trigger
			class={buttonVariants({ variant: 'ghost', size: 'icon-xs' })}
			title={strings.extension.media.moreOptions}
		>
			<EllipsisVertical />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="mt-1 overflow-auto text-sm">
			<DropdownMenu.Item onclick={onCaption}>
				<Captions />
				{strings.extension.media.caption}
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={onDuplicate}>
				<CopyIcon />
				{strings.extension.media.duplicate}
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={onFullscreen}>
				<Fullscreen />
				{strings.extension.media.fullscreen}
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={onDelete} class="text-destructive">
				<Trash />
				{strings.extension.media.delete}
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
