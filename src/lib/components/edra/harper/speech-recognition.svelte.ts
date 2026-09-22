import {
  encodeWav,
  isSpeechRecognitionSupported,
  mapSpeechRecognitionError,
  type SpeechErrorInfo,
  type SpeechRecognitionStatus,
} from "./speech-recognition.js";

export interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript: (finalChunk: string) => void;
  onInterim?: (interimChunk: string) => void;
  onError?: (error: SpeechErrorInfo) => void;
}

const TARGET_SAMPLE_RATE = 16000;
const SPEECH_VOLUME_THRESHOLD = 0.015;

function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number,
): Float32Array {
  if (inputSampleRate === targetSampleRate) {
    return buffer;
  }

  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let sum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      const sample = buffer[i];
      if (typeof sample === "number") {
        sum += sample;
        count += 1;
      }
    }

    if (count > 0) {
      result[offsetResult] = sum / count;
    } else {
      result[offsetResult] = 0;
    }

    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

export function createSpeechRecognition(options: SpeechRecognitionOptions) {
  let status = $state<SpeechRecognitionStatus>("idle");
  let isSpeaking = $state<boolean>(false);
  let interimTranscript = $state<string>("");
  let errorMessage = $state<string | null>(null);

  const isSupported = isSpeechRecognitionSupported();

  let mediaStream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let audioWorklet: AudioWorkletNode | null = null;
  let mediaSource: MediaStreamAudioSourceNode | null = null;
  let recordedChunks: Float32Array[] = [];
  let interimTimer: ReturnType<typeof setInterval> | null = null;
  let isTranscribing = false;
  let inputSampleRate = TARGET_SAMPLE_RATE;

  const cleanupAudioPipeline = () => {
    if (interimTimer !== null) {
      clearInterval(interimTimer);
      interimTimer = null;
    }

    if (audioWorklet) {
      // Flush any remaining audio data before disconnecting
      audioWorklet.port.postMessage("flush");
      audioWorklet.port.onmessage = null;
      audioWorklet.disconnect();
      audioWorklet = null;
    }

    if (mediaSource) {
      mediaSource.disconnect();
      mediaSource = null;
    }

    if (audioContext && audioContext.state !== "closed") {
      void audioContext.close();
      audioContext = null;
    }

    if (mediaStream) {
      const tracks = mediaStream.getTracks();
      for (const track of tracks) {
        track.stop();
      }
      mediaStream = null;
    }

    isSpeaking = false;
  };

  const getConsolidatedAudio = (): Float32Array | null => {
    if (recordedChunks.length === 0) {
      return null;
    }

    let totalLength = 0;
    for (const chunk of recordedChunks) {
      totalLength += chunk.length;
    }

    if (totalLength === 0) {
      return null;
    }

    const consolidated = new Float32Array(totalLength);
    let currentOffset = 0;

    for (const chunk of recordedChunks) {
      consolidated.set(chunk, currentOffset);
      currentOffset += chunk.length;
    }

    return consolidated;
  };

  const sendAudioToWit = async (
    audioSamples: Float32Array,
    sampleRate: number,
  ): Promise<string> => {
    const downsampled = downsampleBuffer(audioSamples, sampleRate, TARGET_SAMPLE_RATE);
    const wavBytes = encodeWav(downsampled, TARGET_SAMPLE_RATE);

    const response = await fetch("/api/speech/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "audio/wav",
      },
      body: new Blob([wavBytes.buffer as ArrayBuffer], { type: "audio/wav" }),
    });

    if (!response.ok) {
      const errorJson = (await response.json().catch(() => null)) as {
        error?: string;
        code?: string;
      } | null;

      const message =
        errorJson && errorJson.error
          ? errorJson.error
          : `Transcription failed with HTTP status ${response.status}`;

      throw new Error(message);
    }

    const data = (await response.json()) as { text?: string };
    if (typeof data.text === "string") {
      return data.text.trim();
    }

    return "";
  };

  const start = async () => {
    if (status === "listening" || status === "transcribing") {
      return;
    }

    if (!isSupported) {
      status = "unsupported";
      const err = mapSpeechRecognitionError("Speech recognition is not supported in this browser.");
      errorMessage = err.message;
      options.onError?.(err);
      return;
    }

    errorMessage = null;
    recordedChunks = [];
    interimTranscript = "";

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStream = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContext = ctx;
      inputSampleRate = ctx.sampleRate;

      await ctx.audioWorklet.addModule("/audio-processor.js");

      const source = ctx.createMediaStreamSource(stream);
      mediaSource = source;

      const worklet = new AudioWorkletNode(ctx, "audio-processor");
      audioWorklet = worklet;

      worklet.port.onmessage = (event: MessageEvent) => {
        const data = event.data as { type: string; samples: Float32Array } | undefined;
        if (data?.type === "audio" && data.samples.length > 0) {
          const chunkCopy = new Float32Array(data.samples.length);
          chunkCopy.set(data.samples);
          recordedChunks.push(chunkCopy);

          let sumSquares = 0;
          for (let i = 0; i < data.samples.length; i += 1) {
            const sample = data.samples[i];
            if (typeof sample === "number") {
              sumSquares += sample * sample;
            }
          }
          const rms = Math.sqrt(sumSquares / data.samples.length);
          isSpeaking = rms > SPEECH_VOLUME_THRESHOLD;
        }
      };

      source.connect(worklet);
      worklet.connect(ctx.destination);

      status = "listening";
      interimTimer = setInterval(() => {
        if (!isSpeaking || isTranscribing || recordedChunks.length === 0) {
          return;
        }

        const consolidated = getConsolidatedAudio();
        if (!consolidated || consolidated.length < TARGET_SAMPLE_RATE) {
          return;
        }

        isTranscribing = true;

        sendAudioToWit(consolidated, inputSampleRate)
          .then((partialText) => {
            if (partialText.length > 0) {
              interimTranscript = partialText;
              options.onInterim?.(partialText);
            }
          })
          .catch(() => {
            // Ignore interim errors silently to keep listening fluid
          })
          .finally(() => {
            isTranscribing = false;
          });
      }, 3500);
    } catch (error) {
      cleanupAudioPipeline();
      status = "error";
      const mapped = mapSpeechRecognitionError(error);
      errorMessage = mapped.message;
      options.onError?.(mapped);
    }
  };

  const stop = async () => {
    if (status !== "listening") {
      return;
    }

    const consolidated = getConsolidatedAudio();
    const sampleRate = audioContext ? audioContext.sampleRate : TARGET_SAMPLE_RATE;

    cleanupAudioPipeline();

    if (!consolidated || consolidated.length === 0) {
      status = "idle";
      interimTranscript = "";
      return;
    }

    status = "transcribing";

    try {
      const finalTranscript = await sendAudioToWit(consolidated, sampleRate);
      if (finalTranscript.length > 0) {
        options.onTranscript(finalTranscript);
      }
      interimTranscript = "";
      status = "idle";
    } catch (error) {
      status = "error";
      const mapped = mapSpeechRecognitionError(error);
      errorMessage = mapped.message;
      options.onError?.(mapped);
    } finally {
      recordedChunks = [];
      if (status !== "error") {
        status = "idle";
      }
    }
  };

  const toggle = () => {
    if (status === "listening") {
      void stop();
    } else {
      void start();
    }
  };

  const destroy = () => {
    cleanupAudioPipeline();
    recordedChunks = [];
    status = "idle";
    isSpeaking = false;
    interimTranscript = "";
    errorMessage = null;
  };

  return {
    get status() {
      return status;
    },
    get isListening() {
      return status === "listening" || status === "transcribing";
    },
    get isSpeaking() {
      return isSpeaking;
    },
    get interimTranscript() {
      return interimTranscript;
    },
    get errorMessage() {
      return errorMessage;
    },
    get isSupported() {
      return isSupported;
    },
    start,
    stop,
    toggle,
    destroy,
  };
}
