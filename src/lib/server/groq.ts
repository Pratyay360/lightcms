import { Groq, toFile } from "groq-sdk";

export interface GroqTranscriptionResult {
  text: string;
  isFinal: boolean;
}

export interface TranscribeAudioOptions {
  contentType?: string;
  language?: string;
  prompt?: string;
  temperature?: number;
}

export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY;
}

export function isGroqConfigured(): boolean {
  const key = getGroqApiKey();
  if (!key) {
    return false;
  }
  return key.trim().length > 0;
}

export function getAudioExtension(contentType?: string): string {
  if (!contentType) {
    return "webm";
  }
  const cleanType = contentType.split(";")[0].trim().toLowerCase();
  switch (cleanType) {
    case "audio/mp4":
    case "audio/m4a":
    case "audio/x-m4a":
      return "m4a";
    case "audio/wav":
    case "audio/x-wav":
    case "audio/wave":
      return "wav";
    case "audio/ogg":
    case "application/ogg":
      return "ogg";
    case "audio/mpeg":
    case "audio/mp3":
      return "mp3";
    case "audio/flac":
      return "flac";
    default:
      return "webm";
  }
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

export async function transcribeAudioWithGroq(
  audioData: ArrayBuffer | Uint8Array | Buffer,
  options?: TranscribeAudioOptions,
): Promise<GroqTranscriptionResult> {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured on the server. Please set GROQ_API_KEY.");
  }

  let buffer: Buffer;
  if (Buffer.isBuffer(audioData)) {
    buffer = audioData;
  } else if (audioData instanceof Uint8Array) {
    buffer = Buffer.from(audioData.buffer, audioData.byteOffset, audioData.byteLength);
  } else {
    buffer = Buffer.from(audioData);
  }

  if (buffer.length === 0) {
    return { text: "", isFinal: true };
  }

  const ext = getAudioExtension(options?.contentType);
  const file = await toFile(buffer, `audio.${ext}`, {
    type: options?.contentType ?? `audio/${ext}`,
  });

  const client = new Groq({ apiKey });
  const normalizedLang = normalizeLanguageCode(options?.language);

  try {
    const result = await client.audio.transcriptions.create({
      model: "whisper-large-v3-turbo",
      file,
      ...(normalizedLang ? { language: normalizedLang } : {}),
      ...(options?.prompt ? { prompt: options.prompt } : {}),
      ...(typeof options?.temperature === "number" ? { temperature: options.temperature } : {}),
    });

    const text = typeof result?.text === "string" ? result.text.trim() : "";
    return { text, isFinal: true };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Groq transcription failed");
  }
}
