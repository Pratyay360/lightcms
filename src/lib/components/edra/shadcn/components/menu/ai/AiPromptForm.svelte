<script lang="ts">
	import { Send } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import MicButton from '../../../../harper/MicButton.svelte';

	interface Props {
		value: string;
		onSubmit: () => void;
		inputRef?: HTMLTextAreaElement | null;
	}

	let {
		value = $bindable(''),
		onSubmit,
		inputRef = $bindable(null),
	}: Props = $props();

	function autogrow(event: Event) {
		const target = event.currentTarget as HTMLTextAreaElement;
		target.style.height = `${target.scrollHeight}px`;
	}

	$effect(() => {
		if (value === '' && inputRef) {
			inputRef.style.height = 'auto';
		}
	});

	const appendTranscript = (text: string) => {
		value = `${value}${value && !value.endsWith(' ') ? ' ' : ''}${text}`.trimStart();
		inputRef?.focus();
	};
</script>

<form
	class="flex items-start px-3 py-3"
	onsubmit={(event) => {
		event.preventDefault();
		onSubmit();
	}}
>
	<textarea
		bind:value
		bind:this={inputRef}
		oninput={autogrow}
		rows={1}
		placeholder="Ask AI anything..."
		class="h-auto max-h-40 w-full resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground outline-hidden"
	></textarea>
	<MicButton onTranscript={appendTranscript} class="text-muted-foreground hover:text-foreground" />
	<Button type="submit" size="icon-lg" class="rounded-full"><Send /></Button>
</form>
