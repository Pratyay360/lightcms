<script lang="ts">
	import { LoaderCircle, Mic, MicOff } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Status = 'idle' | 'listening' | 'transcribing' | 'error';
	interface Props {
		onTranscript: (text: string) => void;
		chunkMs?: number;
		class?: string;
		size?: 'icon' | 'icon-sm' | 'icon-lg';
		variant?: 'ghost' | 'outline' | 'secondary';
	}

	let { onTranscript, chunkMs = 4000, class: className = '', size = 'icon', variant = 'ghost' }: Props = $props();

	let status = $state<Status>('idle');
	let pendingChunks = $state(0);
	let doneChunks = $state(0);

	let recorder: MediaRecorder | null = null;
	let stream: MediaStream | null = null;
	let sessionActive = false;
	let chain: Promise<void> = Promise.resolve();
	let chunkErrors = 0;

	const TARGET_SAMPLE_RATE = 16000;

	const pickMimeType = () => {
		if (typeof MediaRecorder === 'undefined') return '';
		for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']) {
			if (MediaRecorder.isTypeSupported(t)) return t;
		}
		return '';
	};

	const stopMediaStream = () => {
		stream?.getTracks().forEach(t => t.stop());
		stream = null;
	};

	const setError = (message: string) => {
		status = 'error';
		toast.error(message);
		setTimeout(() => { if (status === 'error') status = 'idle'; }, 1500);
	};

	const encodeWav = (samples: Float32Array, sampleRate: number): Blob => {
		const buffer = new ArrayBuffer(44 + samples.length * 2);
		const view = new DataView(buffer);
		const write = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
		write(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true);
		write(8, 'WAVE'); write(12, 'fmt '); view.setUint32(16, 16, true);
		view.setUint16(20, 1, true); view.setUint16(22, 1, true);
		view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
		view.setUint16(32, 2, true); view.setUint16(34, 16, true);
		write(36, 'data'); view.setUint32(40, samples.length * 2, true);
		for (let i = 0; i < samples.length; i++) {
			const clamped = Math.max(-1, Math.min(1, samples[i]?? 0));
			view.setInt16(44 + i * 2, clamped < 0? clamped * 0x8000 : clamped * 0x7fff, true);
		}
		return new Blob([buffer], { type: 'audio/wav' });
	};

	const convertToWavMono16k = async (blob: Blob): Promise<Blob> => {
		const Ctor = (window.AudioContext?? (window as any).webkitAudioContext) as typeof AudioContext;
		const ctx = new Ctor();
		try {
			const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
			if (decoded.length === 0) throw new Error('EMPTY');
			const targetLength = Math.max(1, Math.floor(decoded.duration * TARGET_SAMPLE_RATE));
			const offline = new OfflineAudioContext(1, targetLength, TARGET_SAMPLE_RATE);
			const src = offline.createBufferSource();
			src.buffer = decoded; src.connect(offline.destination); src.start(0);
			const rendered = await offline.startRendering();
			return encodeWav(rendered.getChannelData(0), TARGET_SAMPLE_RATE);
		} finally {
			await ctx.close().catch(() => {});
		}
	};

	const transcribeOneChunk = async (blob: Blob) => {
		if (blob.size === 0) return;
		const wav = await convertToWavMono16k(blob);
		const form = new FormData();
		form.append('audio', wav, 'live-chunk.wav');
		const res = await fetch('/api/stt', { method: 'POST', body: form });
		if (!res.ok) {
			if (res.status === 422) return; // silent chunk
			const p = await res.json().catch(() => null) as any;
			throw new Error(p?.message || `STT failed (${res.status})`);
		}
		const { text } = await res.json() as { text?: string };
		if (!text?.trim()) return;
		chunkErrors = 0; doneChunks += 1;
		onTranscript(text.trim());
	};

	const enqueueChunk = (blob: Blob) => {
		pendingChunks += 1;
		chain = chain.then(async () => {
			try { await transcribeOneChunk(blob); }
			catch (e) {
				chunkErrors += 1;
				if (chunkErrors === 1 && e instanceof Error && e.message!== 'EMPTY') toast.error(e.message);
			} finally {
				pendingChunks -= 1;
				if (!sessionActive && pendingChunks === 0 && status === 'transcribing') status = 'idle';
			}
		}).catch(() => {});
	};

	const start = async () => {
		if (status!== 'idle') return;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mimeType = pickMimeType();
			recorder = mimeType? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
			sessionActive = true; chain = Promise.resolve(); chunkErrors = 0; doneChunks = 0; pendingChunks = 0;
			const fallbackType = recorder.mimeType || 'audio/webm';
			recorder.ondataavailable = (e: BlobEvent) => {
				if (e.data.size > 0) {
					const typed = e.data.type? e.data : new Blob([e.data], { type: fallbackType });
					enqueueChunk(typed);
				}
			};
			recorder.onstop = () => {
				sessionActive = false; recorder = null; stopMediaStream();
				chain = chain.then(() => { if (pendingChunks === 0) status = 'idle'; });
				status = pendingChunks > 0? 'transcribing' : 'idle';
			};
			recorder.onerror = () => { sessionActive = false; setError('Live transcription failed.'); };
			recorder.start(chunkMs);
			status = 'listening';
		} catch (e) {
			sessionActive = false; stopMediaStream(); recorder = null;
			setError((e as Error)?.name === 'NotAllowedError'? 'Microphone permission was denied.' : 'Could not start live dictation.');
		}
	};

	const stop = () => {
		if (recorder?.state!== 'inactive') {
			if (status === 'listening') status = 'transcribing';
			try { recorder?.stop(); } catch { sessionActive = false; stopMediaStream(); status = 'idle'; }
		} else { sessionActive = false; stopMediaStream(); status = 'idle'; }
	};

	const toggle = () => { if (status === 'listening') stop(); else if (status === 'idle') void start(); };
	const isActive = $derived(status === 'listening' || status === 'transcribing');
	const buttonLabel = $derived(status === 'listening'? 'Stop live dictation' : 'Start live dictation');
	const showLiveBadge = $derived(status === 'listening' && (pendingChunks > 0 || doneChunks > 0));

	$effect(() => () => {
		sessionActive = false;
		try { if (recorder?.state!== 'inactive') recorder?.stop(); } catch {}
		recorder = null; stopMediaStream();
	});
</script>

<div class="relative inline-flex items-start gap-2">
	<button type="button" onclick={toggle} aria-label={buttonLabel} aria-pressed={isActive} disabled={status === 'transcribing'}
		class="relative inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground {className}">
		{#if status === 'transcribing'}<LoaderCircle class="size-4 animate-spin" />
		{:else if status === 'listening'}<MicOff class="size-4 text-red-500" />
		{:else}<Mic class="size-4" />{/if}
		{#if status === 'listening'}<span class="absolute -top-1 -right-1 size-2 animate-pulse rounded-full bg-red-500"></span>{/if}
	</button>
	{#if showLiveBadge}
		<div class="absolute top-full left-0 z-50 mt-2 w-56 rounded-md border bg-popover p-2 text-xs shadow-md">
			<p class="flex items-center gap-1 font-medium"><span class="size-1.5 animate-pulse rounded-full bg-red-500"></span>Live via server…</p>
			<p class="mt-1 opacity-80">{pendingChunks > 0? 'Transcribing audio…' : `${doneChunks} ${doneChunks === 1? 'segment' : 'segments'} transcribed`}</p>
		</div>
	{/if}
</div>
