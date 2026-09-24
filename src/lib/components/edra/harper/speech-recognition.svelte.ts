import { createLightCmsClient } from "$lib/orpc-client";
import {
  getSupportedAudioMimeType,
  isSpeechRecognitionSupported,
  normalizeLanguageCode,
  type GroqTranscriptionResult,
  type SpeechRecognitionError,
} from "./speech-recognition.js";

export interface SpeechRecognitionOptions {
  lang?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onInterim?: (text: string) => void;
  onError?: (err: SpeechRecognitionError) => void;
}

export interface SpeechRecognitionInstance {
  readonly isListening: boolean;
  readonly isSpeaking: boolean;
  readonly isSupported: boolean;
  readonly isTranscribing: boolean;
  readonly interimTranscript: string;
  toggle(): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): void;
}

export function createSpeechRecognition(
  options: SpeechRecognitionOptions,
): SpeechRecognitionInstance {
  let isListening = $state(false);
  let isSpeaking = $state(false);
  let isTranscribing = $state(false);
  let isSupported = $state(isSpeechRecognitionSupported());
  let interimTranscript = $state("");

  let mediaRecorder: MediaRecorder | null = null;
  let audioStream: MediaStream | null = null;
  let audioChunks: Blob[] = [];
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let animationFrameId: number | null = null;

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(",");
        const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  function cleanupAudioContext() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (audioContext) {
      try {
        void audioContext.close();
      } catch {
        // Ignore cleanup errors
      }
      audioContext = null;
      analyser = null;
    }
  }

  async function sendToTranscription(audioBlob: Blob, mimeType: string) {
    try {
      interimTranscript = "Transcribing with Groq...";
      options.onInterim?.(interimTranscript);

      const base64Audio = await blobToBase64(audioBlob);
      if (!base64Audio) {
        return;
      }

      const client = createLightCmsClient();
      const response = await client.speech.transcribe({
        audio: base64Audio,
        contentType: mimeType,
        language: normalizeLanguageCode(options.lang),
      });

      let transcribedText = "";
      if (
        response &&
        typeof (response as AsyncIterable<GroqTranscriptionResult>)[Symbol.asyncIterator] ===
          "function"
      ) {
        for await (const chunk of response as AsyncIterable<GroqTranscriptionResult>) {
          if (chunk.text) {
            transcribedText += chunk.text;
          }
        }
      } else if (response && typeof response === "object" && "text" in response) {
        transcribedText = String(response.text ?? "");
      }

      const cleanText = transcribedText.trim();
      if (cleanText.length > 0) {
        options.onTranscript(cleanText, true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to transcribe audio with Groq.";
      options.onError?.({ message });
    } finally {
      interimTranscript = "";
      isTranscribing = false;
    }
  }

  async function startListening() {
    if (!isSupported) {
      options.onError?.({ message: "Speech recognition is not supported in this browser." });
      return;
    }

    if (isListening || isTranscribing) {
      return;
    }

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser.");
      }

      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioContext = new AudioCtx();
          const source = audioContext.createMediaStreamSource(audioStream);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.4;
          source.connect(analyser);

          const freqData = new Uint8Array(analyser.frequencyBinCount);
          const monitorVolume = () => {
            if (!isListening) {
              return;
            }
            analyser?.getByteFrequencyData(freqData);
            let sum = 0;
            for (let i = 0; i < freqData.length; i += 1) {
              sum += freqData[i] ?? 0;
            }
            const average = sum / freqData.length;
            isSpeaking = average > 12;
            animationFrameId = requestAnimationFrame(monitorVolume);
          };
          animationFrameId = requestAnimationFrame(monitorVolume);
        }
      } catch {
        // Fall back gracefully if audio analysis fails
      }

      audioChunks = [];
      const supportedMime = getSupportedAudioMimeType();
      const recorderOptions: MediaRecorderOptions = {};
      if (supportedMime.length > 0) {
        recorderOptions.mimeType = supportedMime;
      }

      mediaRecorder = new MediaRecorder(audioStream, recorderOptions);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordedMimeType = mediaRecorder?.mimeType || supportedMime || "audio/webm";
        const audioBlob = new Blob(audioChunks, { type: recordedMimeType });
        audioChunks = [];
        if (audioBlob.size > 0) {
          await sendToTranscription(audioBlob, recordedMimeType);
        } else {
          isTranscribing = false;
        }
      };

      mediaRecorder.start(250);
      isListening = true;
    } catch (err) {
      destroy();
      const message = err instanceof Error ? err.message : "Failed to access microphone.";
      options.onError?.({ message });
    }
  }

  async function stopListening() {
    if (!isListening) {
      return;
    }

    isListening = false;
    isSpeaking = false;
    isTranscribing = true;

    cleanupAudioContext();

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    if (audioStream) {
      for (const track of audioStream.getTracks()) {
        track.stop();
      }
      audioStream = null;
    }
  }

  function toggle(): void {
    if (!isSupported) {
      options.onError?.({ message: "Speech recognition is not supported in this browser." });
      return;
    }
    if (isTranscribing) {
      return;
    }
    if (isListening) {
      void stopListening();
    } else {
      void startListening();
    }
  }

  function destroy(): void {
    cleanupAudioContext();
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        mediaRecorder.stop();
      } catch {
        // Ignore errors during destroy
      }
    }
    mediaRecorder = null;
    if (audioStream) {
      for (const track of audioStream.getTracks()) {
        track.stop();
      }
      audioStream = null;
    }
    audioChunks = [];
    isListening = false;
    isSpeaking = false;
    isTranscribing = false;
    interimTranscript = "";
  }

  return {
    get isListening() {
      return isListening;
    },
    get isSpeaking() {
      return isSpeaking;
    },
    get isSupported() {
      return isSupported;
    },
    get isTranscribing() {
      return isTranscribing;
    },
    get interimTranscript() {
      return interimTranscript;
    },
    toggle,
    start: startListening,
    stop: stopListening,
    destroy,
  };
}
