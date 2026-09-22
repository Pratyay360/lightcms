export type SpeechRecognitionStatus =
  | "idle"
  | "listening"
  | "transcribing"
  | "error"
  | "unsupported";

export interface SpeechErrorInfo {
  code: string;
  message: string;
  isFatal: boolean;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type SpeechRecognitionConstructor = new () => ISpeechRecognition;

/**
 * Checks whether audio recording and speech recognition are supported in the current environment.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hasMediaDevices = Boolean(
    navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function",
  );
  const hasAudioContext = Boolean(
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext,
  );

  if (hasMediaDevices && hasAudioContext) {
    return true;
  }

  return getSpeechRecognitionConstructor() !== null;
}

/**
 * Resolves the browser Web Speech API constructor if available.
 */
export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const globalWin = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  if (typeof globalWin.SpeechRecognition !== "undefined") {
    return globalWin.SpeechRecognition;
  }
  if (typeof globalWin.webkitSpeechRecognition !== "undefined") {
    return globalWin.webkitSpeechRecognition;
  }
  return null;
}

/**
 * Encodes 32-bit float audio samples into a 16-bit mono PCM RIFF WAV buffer.
 */
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  // "RIFF" chunk descriptor
  writeAsciiString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);
  writeAsciiString(view, 8, "WAVE");

  // "fmt " sub-chunk
  writeAsciiString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, 1, true); // AudioFormat: 1 = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeAsciiString(view, 36, "data");
  view.setUint32(40, dataByteLength, true);

  // Write 16-bit signed PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const rawSample = samples[i] ?? 0;
    const clamped = Math.max(-1, Math.min(1, rawSample));
    let int16Sample = 0;
    if (clamped < 0) {
      int16Sample = Math.round(clamped * 0x8000);
    } else {
      int16Sample = Math.round(clamped * 0x7fff);
    }
    view.setInt16(offset, int16Sample, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function writeAsciiString(view: DataView, offset: number, stringValue: string): void {
  for (let i = 0; i < stringValue.length; i += 1) {
    view.setUint8(offset + i, stringValue.charCodeAt(i));
  }
}

export interface WitParseResult {
  text: string;
  isFinal: boolean;
}

/**
 * Parses single or streaming JSON responses from Wit.ai dictation and speech APIs.
 */
export function parseWitResponse(rawResponse: string): WitParseResult {
  const trimmed = rawResponse.trim();
  if (trimmed.length === 0) {
    return { text: "", isFinal: false };
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let finalTranscript = "";
  let interimTranscript = "";

  for (const line of lines) {
    try {
      const payload = JSON.parse(line) as {
        text?: string;
        is_final?: boolean;
        type?: string;
        error?: string;
      };

      if (payload.error) {
        throw new Error(payload.error);
      }

      if (typeof payload.text === "string") {
        const text = payload.text.trim();
        if (text.length > 0) {
          if (payload.is_final === true || payload.type === "FINAL_TRANSCRIPTION") {
            finalTranscript = text;
          } else {
            interimTranscript = text;
          }
        }
      }
    } catch {
      // Continue parsing remaining lines
    }
  }

  if (finalTranscript.length > 0) {
    return { text: finalTranscript, isFinal: true };
  }

  if (interimTranscript.length > 0) {
    return { text: interimTranscript, isFinal: false };
  }

  return { text: "", isFinal: false };
}

/**
 * Maps speech recognition and recording error codes to human-readable information.
 */
export function mapSpeechRecognitionError(error: unknown): SpeechErrorInfo {
  const errorString =
    typeof error === "string" ? error : error instanceof Error ? error.message : "unknown";

  const normalized = errorString.toLowerCase();

  if (
    normalized.includes("not-allowed") ||
    normalized.includes("permission denied") ||
    normalized.includes("permission_denied")
  ) {
    return {
      code: "not-allowed",
      message: "Microphone access was denied. Please allow microphone permissions in your browser.",
      isFatal: true,
    };
  }

  if (
    normalized.includes("audio-capture") ||
    normalized.includes("notfounderror") ||
    normalized.includes("device not found")
  ) {
    return {
      code: "audio-capture",
      message: "No microphone was found or microphone is not accessible.",
      isFatal: true,
    };
  }

  if (normalized.includes("service-not-allowed")) {
    return {
      code: "service-not-allowed",
      message: "Speech recognition service is not permitted by your browser or device.",
      isFatal: true,
    };
  }

  if (normalized.includes("network") || normalized.includes("fetch failed")) {
    return {
      code: "network",
      message: "Speech recognition network error occurred. Please check your internet connection.",
      isFatal: false,
    };
  }

  if (normalized.includes("wit-not-configured")) {
    return {
      code: "wit-not-configured",
      message: "Wit.ai speech recognition token (WIT_AI_TOKEN) is not configured on the server.",
      isFatal: false,
    };
  }

  if (normalized.includes("no-speech")) {
    return {
      code: "no-speech",
      message: "No speech was detected.",
      isFatal: false,
    };
  }

  if (normalized.includes("aborted")) {
    return {
      code: "aborted",
      message: "Speech recognition was stopped.",
      isFatal: false,
    };
  }

  return {
    code: errorString,
    message: "Live speech recognition encountered an error.",
    isFatal: false,
  };
}

export interface ProcessResultOutcome {
  finalTranscripts: string[];
  interimTranscript: string;
}

/**
 * Pure function to extract finalized transcript chunks and current interim transcript
 * from a Web Speech SpeechRecognitionEvent.
 */
export function processSpeechResults(event: SpeechRecognitionEvent): ProcessResultOutcome {
  const finalTranscripts: string[] = [];
  let interimTranscript = "";

  const total = event.results.length;
  for (let i = event.resultIndex; i < total; i += 1) {
    const result = event.results[i];
    if (!result || result.length === 0) {
      continue;
    }
    const alternative = result[0];
    if (!alternative) {
      continue;
    }
    const text = alternative.transcript;
    if (result.isFinal) {
      const clean = text.trim();
      if (clean.length > 0) {
        finalTranscripts.push(clean);
      }
    } else {
      interimTranscript += text;
    }
  }

  return {
    finalTranscripts,
    interimTranscript: interimTranscript.trim(),
  };
}
