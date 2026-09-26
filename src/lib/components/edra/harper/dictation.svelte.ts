import { toast } from "svelte-sonner";
import {
  type DictationPhase,
  isDictationStopEvent,
  isDictationToggleEvent,
} from "./speech-recognition.js";
import {
  createSpeechRecognition,
  type SpeechRecognitionInstance,
} from "./speech-recognition.svelte.js";

export type TranscriptSink = (text: string) => void;

export interface DictationController {
  readonly engine: SpeechRecognitionInstance;
  readonly interimTranscript: string;
  readonly isActive: boolean;
  readonly isCapturing: boolean;
  readonly isListening: boolean;
  readonly isSpeaking: boolean;
  readonly isSupported: boolean;
  readonly pendingCount: number;
  readonly phase: DictationPhase;
  setLang(lang: string | undefined): void;
  setSink(sink: TranscriptSink): () => void;
  start(): void;
  stop(): void;
  toggle(): void;
  shutdown(): void;
}

let lang: string | undefined;
let sink: TranscriptSink | null = null;

const engine = createSpeechRecognition({
  get lang() {
    return lang;
  },
  onTranscript(text) {
    if (!sink) {
      return;
    }
    sink(text);
  },
  onError(err) {
    toast.error(err.message);
  },
});

function isActivePhase(phase: DictationPhase): boolean {
  return phase !== "idle";
}

export const dictation: DictationController = {
  get engine() {
    return engine;
  },
  get interimTranscript() {
    return engine.interimTranscript;
  },
  get isActive() {
    return isActivePhase(engine.phase);
  },
  get isCapturing() {
    return engine.isCapturing;
  },
  get isListening() {
    return engine.isListening;
  },
  get isSpeaking() {
    return engine.isSpeaking;
  },
  get isSupported() {
    return engine.isSupported;
  },
  get pendingCount() {
    return engine.pendingCount;
  },
  get phase() {
    return engine.phase;
  },
  setLang(next) {
    lang = next;
  },
  setSink(next) {
    sink = next;
    return () => {
      if (sink === next) {
        sink = null;
      }
    };
  },
  start() {
    void engine.start();
  },
  stop() {
    void engine.stop();
  },
  toggle() {
    engine.toggle();
  },
  shutdown() {
    engine.destroy();
  },
};

export {
  DICTATION_TOGGLE_CODE,
  formatDictationShortcut,
  isDictationToggleEvent,
} from "./speech-recognition.js";

export function handleDictationKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.repeat) {
    return;
  }

  if (isDictationStopEvent(event) && dictation.isActive) {
    event.preventDefault();
    dictation.stop();
    return;
  }

  if (isDictationToggleEvent(event)) {
    event.preventDefault();
    dictation.toggle();
  }
}
