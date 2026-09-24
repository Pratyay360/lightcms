export type GroqTranscriptionResult = {
  text: string;
  isFinal: boolean;
};

export type SpeechRecognitionError = {
  message: string;
};

export type SpeechRecognitionHandler = (text: string, isFinal: boolean) => void;
export type SpeechRecognitionInterimHandler = (text: string) => void;
export type SpeechRecognitionErrorHandler = (err: SpeechRecognitionError) => void;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const hasMediaDevices =
    typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";
  const hasMediaRecorder = typeof MediaRecorder !== "undefined";
  return hasMediaDevices && hasMediaRecorder;
}

export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }
  const candidateTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

export function normalizeLanguageCode(lang?: string): string | undefined {
  if (!lang) {
    return undefined;
  }
  const trimmed = lang.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parts = trimmed.split(/[-_]/);
  const primary = parts[0]?.toLowerCase();
  if (primary && primary.length >= 2 && primary.length <= 3) {
    return primary;
  }
  return undefined;
}
