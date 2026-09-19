import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  mapSpeechRecognitionError,
  processSpeechResults,
  type ISpeechRecognition,
  type SpeechErrorInfo,
  type SpeechRecognitionErrorEvent,
  type SpeechRecognitionEvent,
  type SpeechRecognitionStatus,
} from "./speech-recognition";

export interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript: (finalChunk: string) => void;
  onInterim?: (interimChunk: string) => void;
  onError?: (error: SpeechErrorInfo) => void;
}

export function createSpeechRecognition(options: SpeechRecognitionOptions) {
  let status = $state<SpeechRecognitionStatus>("idle");
  let isSpeaking = $state<boolean>(false);
  let interimTranscript = $state<string>("");
  let errorMessage = $state<string | null>(null);

  const isSupported = isSpeechRecognitionSupported();

  let recognition: ISpeechRecognition | null = null;
  let userWantsListening = false;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;

  const clearRestartTimer = () => {
    if (restartTimer !== null) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
  };

  const getPreferredLanguage = (): string => {
    if (options.lang && options.lang.trim().length > 0) {
      return options.lang.trim();
    }
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
    return "en-US";
  };

  const startSession = () => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      status = "unsupported";
      const err: SpeechErrorInfo = {
        code: "unsupported",
        message: "Speech recognition is not supported in this browser.",
        isFatal: true,
      };
      errorMessage = err.message;
      options.onError?.(err);
      return;
    }

    try {
      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // Ignore abort error
        }
        recognition = null;
      }

      const r = new Ctor();
      r.continuous = options.continuous ?? true;
      r.interimResults = options.interimResults ?? true;
      r.lang = getPreferredLanguage();
      r.maxAlternatives = 1;

      r.onstart = () => {
        status = "listening";
        errorMessage = null;
      };

      r.onspeechstart = () => {
        isSpeaking = true;
      };

      r.onspeechend = () => {
        isSpeaking = false;
      };

      r.onresult = (event: SpeechRecognitionEvent) => {
        const outcome = processSpeechResults(event);

        for (let idx = 0; idx < outcome.finalTranscripts.length; idx += 1) {
          const finalPhrase = outcome.finalTranscripts[idx];
          if (finalPhrase) {
            options.onTranscript(finalPhrase);
          }
        }

        interimTranscript = outcome.interimTranscript;
        if (options.onInterim) {
          options.onInterim(outcome.interimTranscript);
        }
      };

      r.onerror = (event: SpeechRecognitionErrorEvent) => {
        const code = event.error;
        // Silence ('no-speech') or user abort ('aborted') are expected events
        if (code === "no-speech" || code === "aborted") {
          return;
        }

        const errInfo = mapSpeechRecognitionError(code);
        if (errInfo.isFatal) {
          userWantsListening = false;
          status = "error";
          errorMessage = errInfo.message;
          options.onError?.(errInfo);
        } else {
          options.onError?.(errInfo);
        }
      };

      r.onend = () => {
        isSpeaking = false;

        // If there is any trailing unfinalized interim speech, flush it now
        const pendingInterim = interimTranscript.trim();
        if (pendingInterim.length > 0) {
          options.onTranscript(pendingInterim);
          interimTranscript = "";
          if (options.onInterim) {
            options.onInterim("");
          }
        }

        // If user still wants listening and no fatal error occurred, restart session
        if (userWantsListening && status !== "error" && status !== "unsupported") {
          clearRestartTimer();
          restartTimer = setTimeout(() => {
            if (userWantsListening && status !== "error") {
              startSession();
            }
          }, 150);
        } else {
          status = "idle";
        }
      };

      recognition = r;
      r.start();
      status = "listening";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start speech recognition.";
      status = "error";
      errorMessage = message;
      userWantsListening = false;
      options.onError?.({
        code: "start-failed",
        message,
        isFatal: true,
      });
    }
  };

  const start = () => {
    if (status === "listening") {
      return;
    }
    if (!isSupported) {
      status = "unsupported";
      options.onError?.({
        code: "unsupported",
        message: "Speech recognition is not supported in this browser.",
        isFatal: true,
      });
      return;
    }

    userWantsListening = true;
    errorMessage = null;
    startSession();
  };

  const stop = () => {
    userWantsListening = false;
    clearRestartTimer();

    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Ignore
      }
    }

    const pendingInterim = interimTranscript.trim();
    if (pendingInterim.length > 0) {
      options.onTranscript(pendingInterim);
      interimTranscript = "";
      if (options.onInterim) {
        options.onInterim("");
      }
    }

    status = "idle";
    isSpeaking = false;
  };

  const toggle = () => {
    if (status === "listening") {
      stop();
    } else {
      start();
    }
  };

  const destroy = () => {
    userWantsListening = false;
    clearRestartTimer();
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // Ignore
      }
      recognition = null;
    }
    status = "idle";
    isSpeaking = false;
    interimTranscript = "";
  };

  return {
    get status() {
      return status;
    },
    get isListening() {
      return status === "listening";
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
