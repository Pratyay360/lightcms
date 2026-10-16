import { SPEECH_PROVIDERS, type SpeechProvider } from "$lib/speech-providers";
import { transcribeWithAiSdk } from "./speech-ai-sdk.js";
import { isWitAiConfigured, transcribeAudioWithWitAi } from "./wit-ai.js";

export type { SpeechProvider };

export interface TranscribeSpeechOptions {
  provider?: SpeechProvider;
  endpoint?: string;
  apiKey?: string;
  model?: string;
  contentType?: string;
  language?: string;
  prompt?: string;
  temperature?: number;
}

export interface SpeechTranscriptionResult {
  text: string;
  provider: SpeechProvider;
  model?: string;
  isFinal: boolean;
  language?: string;
  durationInSeconds?: number;
}

export function isSpeechProviderConfigured(provider: SpeechProvider): boolean {
  if (provider === SPEECH_PROVIDERS.wit) {
    return isWitAiConfigured();
  }
  return Boolean(process.env.SPEECH_API_KEY?.trim());
}

/**
 * The OpenAI-compatible backend is chosen whenever an API key is configured,
 * i.e. `SPEECH_API_KEY` is set.
 */
export function getDefaultSpeechProvider(): SpeechProvider | null {
  if (process.env.SPEECH_API_KEY?.trim()) {
    return SPEECH_PROVIDERS.openaiCompatible;
  }
  if (isWitAiConfigured()) {
    return SPEECH_PROVIDERS.wit;
  }
  return null;
}

export function isSpeechTranscriptionConfigured(): {
  configured: boolean;
  openaiCompatible: boolean;
  wit: boolean;
  defaultProvider: SpeechProvider | null;
} {
  const openaiCompatible = Boolean(process.env.SPEECH_API_KEY?.trim());
  const wit = isWitAiConfigured();

  return {
    configured: openaiCompatible || wit,
    openaiCompatible,
    wit,
    defaultProvider: getDefaultSpeechProvider(),
  };
}

export async function transcribeAudio(
  audio: Uint8Array | Buffer | ArrayBuffer,
  options?: TranscribeSpeechOptions,
): Promise<SpeechTranscriptionResult> {
  const requested = options?.provider;
  const targetProvider =
    requested && isSpeechProviderConfigured(requested) ? requested : getDefaultSpeechProvider();

  if (!targetProvider) {
    throw new Error(
      "No speech transcription provider is configured. Please set SPEECH_API_KEY (OpenAI-compatible) or WIT_AI_TOKEN (Wit.ai).",
    );
  }

  if (targetProvider === SPEECH_PROVIDERS.wit) {
    const witResult = await transcribeAudioWithWitAi(audio, {
      contentType: options?.contentType,
      language: options?.language,
      prompt: options?.prompt,
      temperature: options?.temperature,
    });
    return {
      text: witResult.text,
      provider: SPEECH_PROVIDERS.wit,
      isFinal: witResult.isFinal,
    };
  }

  const result = await transcribeWithAiSdk(audio, {
    endpoint: options?.endpoint,
    apiKey: options?.apiKey,
    model: options?.model,
    language: options?.language,
    prompt: options?.prompt,
    temperature: options?.temperature,
  });

  return {
    text: result.text,
    provider: SPEECH_PROVIDERS.openaiCompatible,
    model: result.model,
    isFinal: result.isFinal,
    language: result.language,
    durationInSeconds: result.durationInSeconds,
  };
}
