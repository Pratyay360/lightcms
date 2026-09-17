<script lang="ts">
	import { LoaderCircle, Mic, MicOff } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Status = 'idle' | 'listening' | 'transcribing' | 'error';

	interface Props {
		onTranscript: (text: string) => void;
		/** Length of each live audio window in ms. Defaults to 4000. */
		chunkMs?: number;
		class?: string;
		size?: 'icon' | 'icon-sm' | 'icon-lg';
		variant?: 'ghost' | 'outline' | 'secondary';
	}

	let {
		onTranscript,
		chunkMs = 4000,
		class: className = '',
		size = 'icon',
		variant = 'ghost'
	}: Props = $props();

	let status = $state<Status>('idle');
	let pendingChunks = $state(0);
	let doneChunks = $state(0);

	let recorder: MediaRecorder | null = null;
	let stream: MediaStream | null = null;
	let sessionActive = false;
	let chain: Promise<void> = Promise.resolve();
	let chunkErrors = 0;

	const TARGET_SAMPLE_RATE = 16000;

	const supportedMimeTypes = [
		'audio/webm;codecs=opus',
		'audio/webm',
		'audio/mp4',
		'audio/ogg'
	];

	const pickMimeType = (): string => {
		if (typeof MediaRecorder === 'undefined') {
			return '';
		}
		for (const candidate of supportedMimeTypes) {
			if (MediaRecorder.isTypeSupported(candidate)) {
				return candidate;
			}
		}
		return '';
	};

	const stopMediaStream = () => {
		if (stream) {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			stream = null;
		}
	};

	const setError = (message: string) => {
		status = 'error';
		toast.error(message);
		window.setTimeout(() => {
			if (status === 'error') {
				status = 'idle';
			}
		}, 1500);
	};

	const getAudioContext = (): AudioContext | null => {
		const Ctor =
			typeof window !== 'undefined'
				? (window.AudioContext ??
					(window as unknown as { webkitAudioContext?: typeof AudioContext })
						.webkitAudioContext)
				: undefined;
		if (!Ctor) {
			return null;
		}
		return new Ctor();
	};

	const encodeWav = (samples: Float32Array, sampleRate: number): Blob => {
		const buffer = new ArrayBuffer(44 + samples.length * 2);
		const view = new DataView(buffer);
		const writeString = (offset: number, text: string) => {
			for (let i = 0; i < text.length; i += 1) {
				view.setUint8(offset + i, text.charCodeAt(i));
			}
		};
		writeString(0, 'RIFF');
		view.setUint32(4, 36 + samples.length * 2, true);
		writeString(8, 'WAVE');
		writeString(12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, 1, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * 2, true);
		view.setUint16(32, 2, true);
		view.setUint16(34, 16, true);
		writeString(36, 'data');
		view.setUint32(40, samples.length * 2, true);
		for (let i = 0; i < samples.length; i += 1) {
			const value = samples[i] ?? 0;
			const clamped = Math.max(-1, Math.min(1, value));
			const pcm = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
			view.setInt16(44 + i * 2, pcm, true);
		}
		return new Blob([buffer], { type: 'audio/wav' });
	};

	const convertToWavMono16k = async (blob: Blob): Promise<Blob> => {
		const context = getAudioContext();
		if (!context) {
			throw new Error('Audio conversion is not supported in this browser.');
		}
		try {
			const inputBuffer = await blob.arrayBuffer();
			const decoded = await context.decodeAudioData(inputBuffer);
			if (decoded.length === 0) {
				throw new Error('EMPTY');
			}
			const targetLength = Math.max(1, Math.floor(decoded.duration * TARGET_SAMPLE_RATE));
			const offline = new OfflineAudioContext(1, targetLength, TARGET_SAMPLE_RATE);
			const source = offline.createBufferSource();
			source.buffer = decoded;
			source.connect(offline.destination);
			source.start(0);
			const rendered = await offline.startRendering();
			const channel = rendered.getChannelData(0);
			return encodeWav(channel, TARGET_SAMPLE_RATE);
		} finally {
			await context.close().catch(() => undefined);
		}
	};

	const transcribeOneChunk = async (blob: Blob) => {
		if (blob.size === 0) {
			return;
		}
		const wav = await convertToWavMono16k(blob);
		const form = new FormData();
		form.append('audio', wav, 'live-chunk.wav');
		const response = await fetch('/api/stt', { method: 'POST', body: form });
		if (!response.ok) {
			const payload = (await response.json().catch(() => null)) as {
				message?: string;
			} | null;
			// Silent windows come back as 422 with "no text" — not a real error.
			if (response.status === 422) {
				return;
			}
			let message = `STT failed (${response.status}).`;
			if (payload && typeof payload.message === 'string' && payload.message.length > 0) {
				message = payload.message;
			}
			throw new Error(message);
		}
		const data = (await response.json()) as { text?: string };
		const rawText = data.text;
		const text = typeof rawText === 'string' ? rawText.trim() : '';
		if (text.length === 0) {
			return;
		}
		chunkErrors = 0;
		doneChunks += 1;
		onTranscript(text);
	};

	const enqueueChunk = (blob: Blob) => {
		pendingChunks += 1;
		chain = chain
			.then(async () => {
				try {
					await transcribeOneChunk(blob);
				} catch (error) {
					chunkErrors += 1;
					// Toast once per session so a flaky network does not spam.
					if (chunkErrors === 1) {
						if (error instanceof Error && error.message !== 'EMPTY') {
							toast.error(error.message);
						}
					}
				} finally {
					pendingChunks -= 1;
					if (!sessionActive && pendingChunks === 0 && status === 'transcribing') {
						status = 'idle';
					}
				}
			})
			.catch(() => undefined);
	};

	const start = async () => {
		if (status === 'listening' || status === 'transcribing') {
			return;
		}
		if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
			setError('Microphone access is not available in this browser.');
			return;
		}
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mimeType = pickMimeType();
			if (mimeType.length > 0) {
				recorder = new MediaRecorder(stream, { mimeType });
			} else {
				recorder = new MediaRecorder(stream);
			}
			sessionActive = true;
			chain = Promise.resolve();
			chunkErrors = 0;
			doneChunks = 0;
			pendingChunks = 0;
			const fallbackType = recorder.mimeType || 'audio/webm';
			recorder.ondataavailable = (event: BlobEvent) => {
				if (event.data && event.data.size > 0) {
					const typed =
						event.data.type.length > 0
							? event.data
							: new Blob([event.data], { type: fallbackType });
					enqueueChunk(typed);
				}
			};
			recorder.onstop = () => {
				sessionActive = false;
				recorder = null;
				stopMediaStream();
				// The stop event fires after the final ondataavailable, so the
				// queue already holds the tail. Drain it, then go idle.
				chain = chain.then(() => {
					if (pendingChunks === 0 && status !== 'error') {
						status = 'idle';
					}
				});
				if (pendingChunks > 0 && status === 'listening') {
					status = 'transcribing';
				} else if (pendingChunks === 0) {
					status = 'idle';
				}
			};
			recorder.onerror = () => {
				sessionActive = false;
				setError('Live transcription failed.');
			};
			recorder.start(chunkMs);
			status = 'listening';
		} catch (error) {
			sessionActive = false;
			stopMediaStream();
			recorder = null;
			let message = 'Could not start live dictation.';
			if (error instanceof Error && error.name === 'NotAllowedError') {
				message = 'Microphone permission was denied.';
			}
			setError(message);
		}
	};

	const stop = () => {
		if (recorder && recorder.state !== 'inactive') {
			if (status === 'listening') {
				status = 'transcribing';
			}
			try {
				recorder.stop();
			} catch {
				sessionActive = false;
				stopMediaStream();
				status = 'idle';
			}
		} else {
			sessionActive = false;
			stopMediaStream();
			status = 'idle';
		}
	};

	const toggle = () => {
		if (status === 'listening') {
			stop();
		} else if (status === 'idle') {
			void start();
		}
	};

	const isActive = $derived(status === 'listening' || status === 'transcribing');
	const buttonLabel = $derived(status === 'listening' ? 'Stop live dictation' : 'Start live dictation');
	const showLiveBadge = $derived(
		status === 'listening' && (pendingChunks > 0 || doneChunks > 0)
	);

	$effect(() => {
		return () => {
			sessionActive = false;
			if (recorder && recorder.state !== 'inactive') {
				try {
					recorder.stop();
				} catch {
					// Already stopped.
				}
			}
			recorder = null;
			stopMediaStream();
		};
	});
</script>

<div class="relative inline-flex items-start gap-2">
	<button
		type="button"
		onclick={toggle}
		class="relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground {className}"
		aria-label={buttonLabel}
		aria-pressed={isActive}
		disabled={status === 'transcribing'}
		data-status={status}
		data-mode="server-live"
		data-size={size}
		data-variant={variant}
	>
		{#if status === 'transcribing'}
			<LoaderCircle class="size-4 animate-spin" />
		{:else if status === 'listening'}
			<MicOff class="size-4 text-red-500" />
		{:else}
			<Mic class="size-4" />
		{/if}
		{#if status === 'listening'}
			<span class="absolute -top-1 -right-1 size-2 animate-pulse rounded-full bg-red-500"></span>
		{/if}
	</button>
	{#if showLiveBadge}
		<div
			class="absolute top-full left-0 z-50 mt-2 w-56 rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground shadow-md"
			aria-live="polite"
		>
			<p class="flex items-center gap-1 font-medium">
				<span class="size-1.5 animate-pulse rounded-full bg-red-500"></span>
				Live via server…
			</p>
			<p class="mt-1 leading-relaxed opacity-80">
				{#if pendingChunks > 0}
					Transcribing audio…
				{:else}
					{doneChunks} {doneChunks === 1 ? 'segment' : 'segments'} transcribed
				{/if}
			</p>
		</div>
	{/if}
</div>
