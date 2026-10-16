import { createOpenAI } from "@ai-sdk/openai";
import { transcribe } from "ai";

export interface TranscribeAiSdkOptions {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  language?: string;
  prompt?: string;
  temperature?: number;
}

export interface AiSdkTranscriptionResult {
  text: string;
  model: string;
  isFinal: boolean;
  language?: string;
  durationInSeconds?: number;
}

export interface ResolvedSpeechConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
}

function normalizeOptionalString(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeSpeechEndpoint(value?: string): string | undefined {
  const trimmed = normalizeOptionalString(value);
  if (!trimmed) {
    return undefined;
  }

  const url = trimmed.replace(/\/+$/, "");
  return url.replace(/\/audio\/transcriptions$/i, "").replace(/\/transcriptions$/i, "");
}

/**
 * Resolves a vendor-neutral OpenAI-compatible speech config.
 *
 * Requires both an API key (`options.apiKey` / `SPEECH_API_KEY` /
 * `OPEN_AI_APIKEY`) and a model (`options.model` / `SPEECH_MODEL`). When
 * either is missing the config is unresolved so the dispatcher can fall back
 * to Wit.ai. Returns null in that case.
 */
export function resolveSpeechConfig(options?: TranscribeAiSdkOptions): ResolvedSpeechConfig | null {
  const apiKey =
    normalizeOptionalString(options?.apiKey) ??
    normalizeOptionalString(process.env.SPEECH_API_KEY) ??
    normalizeOptionalString(process.env.OPEN_AI_APIKEY);

  const model =
    normalizeOptionalString(options?.model) ?? normalizeOptionalString(process.env.SPEECH_MODEL);

  if (!apiKey || !model) {
    return null;
  }

  const baseURL =
    normalizeSpeechEndpoint(options?.endpoint) ??
    normalizeSpeechEndpoint(process.env.SPEECH_ENDPOINT);

  return {
    apiKey,
    baseURL,
    model,
  };
}

export function isAiSdkSpeechConfigured(): boolean {
  return resolveSpeechConfig() !== null;
}

export async function transcribeWithAiSdk(
  audio: Uint8Array | Buffer | ArrayBuffer,
  options?: TranscribeAiSdkOptions,
): Promise<AiSdkTranscriptionResult> {
  const config = resolveSpeechConfig(options);
  if (!config) {
    throw new Error(
      "OpenAI-compatible speech is not configured. Please set SPEECH_API_KEY and SPEECH_MODEL.",
    );
  }

  const byteLength = audio instanceof ArrayBuffer ? audio.byteLength : audio.length;
  if (byteLength === 0) {
    return {
      text: "",
      model: config.model,
      isFinal: true,
    };
  }

  const openai = createOpenAI({
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  });

  const providerOptions: Record<string, string | number> = {};
  if (options?.language) {
    providerOptions.language = options.language;
  }
  if (options?.prompt) {
    providerOptions.prompt = options.prompt;
  }
  if (typeof options?.temperature === "number") {
    providerOptions.temperature = options.temperature;
  }

  const audioPayload = audio instanceof ArrayBuffer ? new Uint8Array(audio) : audio;

  const result = await transcribe({
    model: openai.transcription(config.model),
    audio: audioPayload,
    providerOptions: {
      openai: providerOptions,
    },
  });

  return {
    text: result.text.trim(),
    model: config.model,
    isFinal: true,
    language: result.language,
    durationInSeconds: result.durationInSeconds,
  };
}
