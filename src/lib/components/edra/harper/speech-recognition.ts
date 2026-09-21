export type SpeechRecognitionStatus = "idle" | "listening" | "error" | "unsupported";

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
 * Resolves the browser SpeechRecognition constructor (standard or webkit prefixed).
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
 * Checks whether speech recognition is supported in the current environment.
 */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export interface SpeechErrorInfo {
  code: string;
  message: string;
  isFatal: boolean;
}

/**
 * Maps SpeechRecognition error codes to actionable, human-friendly messages.
 */
export function mapSpeechRecognitionError(error: string): SpeechErrorInfo {
  switch (error) {
    case "not-allowed":
      return {
        code: error,
        message:
          "Microphone access was denied. Please allow microphone permissions in your browser.",
        isFatal: true,
      };
    case "audio-capture":
      return {
        code: error,
        message: "No microphone was found or microphone is not accessible.",
        isFatal: true,
      };
    case "service-not-allowed":
      return {
        code: error,
        message: "Speech recognition service is not permitted by your browser or device.",
        isFatal: true,
      };
    case "network":
      return {
        code: error,
        message:
          "Speech recognition network error occurred. Please check your internet connection.",
        isFatal: false,
      };
    case "language-not-supported":
      return {
        code: error,
        message: "Selected language is not supported for speech recognition.",
        isFatal: true,
      };
    case "bad-grammar":
      return {
        code: error,
        message: "Speech recognition grammar error occurred.",
        isFatal: false,
      };
    case "no-speech":
      return {
        code: error,
        message: "No speech was detected.",
        isFatal: false,
      };
    case "aborted":
      return {
        code: error,
        message: "Speech recognition was stopped.",
        isFatal: false,
      };
    default:
      return {
        code: error,
        message: "Live speech recognition encountered an error.",
        isFatal: false,
      };
  }
}

export interface ProcessResultOutcome {
  finalTranscripts: string[];
  interimTranscript: string;
}

/**
 * Pure function to extract finalized transcript chunks and current interim transcript
 * from a SpeechRecognitionEvent.
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
