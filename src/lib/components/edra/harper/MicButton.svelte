<script lang="ts">
	import { LoaderCircle, Mic, MicOff } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	interface SpeechRecognitionEventMap {
		result: SpeechRecognitionEvent;
		error: SpeechRecognitionErrorEvent;
		end: Event;
	}
	interface SpeechRecognition {
		continuous: boolean;
		interimResults: boolean;
		lang: string;
		onresult: ((e: SpeechRecognitionEvent) => void) | null;
		onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
		onend: (() => void) | null;
		start(): void;
		stop(): void;
		readonly error: string;
	}
	interface SpeechRecognitionEvent {
		readonly resultIndex: number;
		readonly results: SpeechRecognitionResultSet;
	}
	interface SpeechRecognitionResultSet {
		readonly length: number;
		item(index: number): SpeechRecognitionResult;
		[index: number]: SpeechRecognitionResult;
	}
	interface SpeechRecognitionResult {
		readonly isFinal: boolean;
		item(index: number): SpeechRecognitionAlternative;
		[index: number]: SpeechRecognitionAlternative;
	}
	interface SpeechRecognitionAlternative {
		readonly transcript: string;
		readonly confidence: number;
	}
	interface SpeechRecognitionErrorEvent extends Event {
		readonly error: string;
	}
	type Status = 'idle' | 'listening' | 'error';
	interface Props {
		onTranscript: (text: string) => void;
		chunkMs?: number;
		class?: string;
		size?: 'icon' | 'icon-sm' | 'icon-lg';
		variant?: 'ghost' | 'outline' | 'secondary';
	}

	let { onTranscript, chunkMs = 4000, class: className = '', size = 'icon', variant = 'ghost' }: Props = $props();

	let status = $state<Status>('idle');
	let recognition: SpeechRecognition | null = null;
	let finalText = '';

	const getRecognition = (): SpeechRecognition | null => {
		const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
		if (!Ctor) return null;
		const r = new Ctor();
		r.continuous = true;
		r.interimResults = true;
		r.lang = 'en-US';
		return r;
	};

	const setError = (message: string) => {
		status = 'error';
		toast.error(message);
		setTimeout(() => { if (status === 'error') status = 'idle'; }, 1500);
	};

	const start = () => {
		if (status !== 'idle') return;
		const r = getRecognition();
		if (!r) { setError('Speech recognition is not supported in this browser.'); return; }

		recognition = r;
		finalText = '';

		r.onresult = (e: SpeechRecognitionEvent) => {
			let interim = '';
			for (let i = e.resultIndex; i < e.results.length; i++) {
				if (e.results[i].isFinal) {
					finalText += e.results[i][0].transcript;
				} else {
					interim += e.results[i][0].transcript;
				}
			}
			const display = finalText + interim;
			if (display.trim()) onTranscript(display.trim());
		};

		r.onerror = (_e: SpeechRecognitionErrorEvent) => {
			if (r.error === 'no-speech' || r.error === 'aborted') return;
			setError('Live transcription failed.');
			cleanup();
		};

		r.onend = () => {
			if (status === 'listening') {
				try { r.stop(); } catch {}
				cleanup();
			}
		};

		try { r.start(); } catch { setError('Could not start live dictation.'); return; }
		status = 'listening';
	};

	const stop = () => {
		if (status !== 'listening' || !recognition) return;
		try { recognition.stop(); } catch {}
		cleanup();
	};

	const cleanup = () => {
		finalText = '';
		recognition = null;
		status = 'idle';
	};

	const toggle = () => { if (status === 'listening') stop(); else if (status === 'idle') void start(); };
	const isActive = $derived(status === 'listening');
	const buttonLabel = $derived(status === 'listening' ? 'Stop live dictation' : 'Start live dictation');
	const showLiveBadge = $derived(isActive);

	$effect(() => () => {
		if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
		status = 'idle';
	});
</script>

<div class="relative inline-flex items-start gap-2">
	<button type="button" onclick={toggle} aria-label={buttonLabel} aria-pressed={isActive} disabled={status === 'error'}
		class="relative inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground {className}">
		{#if status === 'listening'}<MicOff class="size-4 text-red-500" />
		{:else}<Mic class="size-4" />{/if}
		{#if status === 'listening'}<span class="absolute -top-1 -right-1 size-2 animate-pulse rounded-full bg-red-500"></span>{/if}
	</button>
	{#if showLiveBadge}
		<div class="absolute top-full left-0 z-50 mt-2 w-56 rounded-md border bg-popover p-2 text-xs shadow-md">
			<p class="flex items-center gap-1 font-medium"><span class="size-1.5 animate-pulse rounded-full bg-red-500"></span>Live dictation</p>
			<p class="mt-1 opacity-80">Speaking… (Web Speech API)</p>
		</div>
	{/if}
</div>