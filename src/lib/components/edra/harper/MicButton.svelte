<script lang="ts">
	import { Loader2Icon, Mic, MicAudioLines, MicOff } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { type ButtonSize, type ButtonVariant, buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import Tooltip from '../shadcn/components/Tooltip.svelte';
	import { createSpeechRecognition } from './speech-recognition.svelte.js';

	interface Props {
		onTranscript: (text: string) => void;
		onInterim?: (text: string) => void;
		lang?: string;
		class?: string;
		size?: ButtonSize;
		variant?: ButtonVariant;
		tooltip?: string;
	}

	let {
		onTranscript,
		onInterim,
		lang,
		class: className = '',
		size = 'icon',
		variant = 'ghost',
		tooltip = 'Dictate (live speech to text)'
	}: Props = $props();

	const speech = createSpeechRecognition({
		get lang() {
			return lang;
		},
		onTranscript(finalChunk) {
			onTranscript(finalChunk);
		},
		onInterim(interimChunk) {
			if (onInterim) {
				onInterim(interimChunk);
			}
		},
		onError(err) {
			toast.error(err.message);
		},
	});

	$effect(() => {
		return () => {
			speech.destroy();
		};
	});

	const activeLang = $derived(
		lang ?? (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US')
	);

	const buttonAriaLabel = $derived(
		speech.isTranscribing
			? 'Transcribing audio with Groq...'
			: speech.isListening
				? 'Stop dictation'
				: 'Start dictation'
	);

	const handleClick = () => {
		if (!speech.isSupported) {
			toast.error('Speech recognition is not supported in this browser.');
			return;
		}
		if (speech.isTranscribing) {
			return;
		}
		speech.toggle();
	};
</script>

<div class="relative inline-flex items-center">
	{#if speech.isListening || speech.isTranscribing}
		<button
			type="button"
			onclick={handleClick}
			disabled={speech.isTranscribing}
			class={cn(
				buttonVariants({ variant, size }),
				'relative text-red-500 hover:text-red-600 dark:text-red-400',
				className
			)}
			aria-label={buttonAriaLabel}
			aria-pressed={true}
			data-state="active"
		>
			{#if speech.isTranscribing}
				<Loader2Icon class="size-4 animate-spin text-primary" />
			{:else if speech.isSpeaking}
				<MicAudioLines class="size-4 animate-pulse" />
			{:else}
				<MicOff class="size-4" />
			{/if}
			{#if !speech.isTranscribing}
				<span class="absolute -top-0.5 -right-0.5 flex size-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
					<span class="relative inline-flex size-2 rounded-full bg-red-500"></span>
				</span>
			{/if}
		</button>

		<section
			class="absolute top-full left-0 z-50 mt-2 w-64 rounded-lg border border-border bg-popover/95 p-3 text-xs text-popover-foreground shadow-lg backdrop-blur-sm transition-all"
			aria-live="polite"
		>
			<div class="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
				<div class="flex items-center gap-1.5 font-medium">
					{#if speech.isTranscribing}
						<Loader2Icon class="size-3.5 animate-spin text-primary" />
						<span>Transcribing…</span>
					{:else}
						<span class="relative flex size-2">
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
							<span class="relative inline-flex size-2 rounded-full bg-red-500"></span>
						</span>
						<span>{speech.isSpeaking ? 'Speaking…' : 'Listening…'}</span>
					{/if}
				</div>
				<span class="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
					{activeLang}
				</span>
			</div>

			{#if speech.interimTranscript.length > 0}
				<div class="mt-2 max-h-24 overflow-y-auto rounded-md border border-border/40 bg-muted/60 p-2 font-mono text-xs italic text-foreground">
					&ldquo;{speech.interimTranscript}&rdquo;
				</div>
			{:else if speech.isTranscribing}
				<p class="mt-2 leading-relaxed text-muted-foreground">
					Sending audio to Groq Whisper…
				</p>
			{:else}
				<p class="mt-2 leading-relaxed text-muted-foreground">
					Speak into your microphone…
				</p>
			{/if}

			<div class="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
				<span class="font-medium text-muted-foreground">Groq Whisper</span>
				<button
					type="button"
					onclick={() => speech.stop()}
					disabled={speech.isTranscribing}
					class="rounded px-1.5 py-0.5 font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
				>
					Stop
				</button>
			</div>
		</section>
	{:else}
		<Tooltip tooltip={speech.isSupported ? tooltip : 'Speech recognition not supported in this browser'}>
			<button
				type="button"
				onclick={handleClick}
				disabled={!speech.isSupported}
				class={cn(
					buttonVariants({ variant, size }),
					!speech.isSupported && 'cursor-not-allowed opacity-40',
					className
				)}
				aria-label={buttonAriaLabel}
				aria-pressed={false}
				data-state="idle"
			>
				<Mic class="size-4" />
			</button>
		</Tooltip>
	{/if}
</div>
