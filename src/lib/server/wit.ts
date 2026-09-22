import "dotenv/config";

const WIT_API_VERSION = "20240304";
const WIT_DICTATION_URL = `https://api.wit.ai/dictation?v=${WIT_API_VERSION}`;
const WIT_SPEECH_URL = `https://api.wit.ai/speech?v=${WIT_API_VERSION}`;

export interface WitTranscriptionResult {
  text: string;
  isFinal: boolean;
  raw?: unknown;
}

/**
 * Check whether Wit.ai is configured with an API token.
 */
export function isWitConfigured(): boolean {
  const token = getWitToken();
  return Boolean(token && token.trim().length > 0);
}

/**
 * Retrieve configured Wit.ai tokens in priority order (Client token for speech, then Server token).
 */
export function getWitTokens(): string[] {
  const tokens: string[] = [];
  const clientToken = process.env.WIT_AI_CLIENT_TOKEN!;
  const serverToken = process.env.WIT_AI_TOKEN!;

  if (clientToken && clientToken.length > 0) {
    tokens.push(clientToken);
  }
  if (serverToken && serverToken.length > 0 && !tokens.includes(serverToken)) {
    tokens.push(serverToken);
  }

  return tokens;
}

/**
 * Retrieve the configured Wit.ai token from environment variables.
 */
export function getWitToken(): string | null {
  const tokens = getWitTokens();
  return tokens.length > 0 ? tokens[0] : null;
}

/**
 * Transcribe binary audio data using the Wit.ai Speech API.
 * Falls back across endpoints and available client/server tokens with timeout protection.
 */
export async function transcribeAudioWithWit(
  audioData: ArrayBuffer | Uint8Array,
  contentType: string = "audio/wav",
): Promise<WitTranscriptionResult> {
  const tokens = process.env.WIT_AI_TOKEN!;

  const normalizedContentType = contentType.trim() || "audio/wav";
  let lastError: Error | null = null;

  for (const token of tokens) {
    // 1. Try standard /speech endpoint with timeout
    try {
      const speechResponse = await fetch(WIT_SPEECH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": normalizedContentType,
          Accept: "application/json",
        },
        body: audioData,
        signal: AbortSignal.timeout(15000),
      });

      if (speechResponse.ok) {
        const responseText = await speechResponse.text();
        const parsed = parseWitDictationResponse(responseText);
        if (parsed.text.length > 0) {
          return parsed;
        }
      } else if (speechResponse.status === 401) {
        lastError = new Error(`Wit.ai authentication failed (401 Unauthorized)`);
        continue;
      } else {
        const errorBody = await speechResponse.text();
        lastError = new Error(
          `Wit.ai speech API failed with status ${speechResponse.status}: ${errorBody}`,
        );
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // 2. Try streaming /dictation endpoint with timeout
    try {
      const dictationResponse = await fetch(WIT_DICTATION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": normalizedContentType,
          Accept: "application/json",
        },
        body: audioData,
        signal: AbortSignal.timeout(15000),
      });

      if (dictationResponse.ok) {
        const responseText = await dictationResponse.text();
        const parsed = parseWitDictationResponse(responseText);
        if (parsed.text.length > 0) {
          return parsed;
        }
      } else if (dictationResponse.status === 401) {
        lastError = new Error(`Wit.ai authentication failed (401 Unauthorized)`);
        continue;
      } else {
        const errorBody = await dictationResponse.text();
        lastError = new Error(
          `Wit.ai dictation API failed with status ${dictationResponse.status}: ${errorBody}`,
        );
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (lastError) {
    throw lastError;
  }

  return {
    text: "",
    isFinal: false,
  };
}

/**
 * Parse Wit.ai dictation response, which may consist of multiple JSON lines.
 */
export function parseWitDictationResponse(responseText: string): WitTranscriptionResult {
  const lines = responseText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let finalTranscript = "";
  let interimTranscript = "";
  let lastPayload: unknown = null;

  for (const line of lines) {
    try {
      const payload = JSON.parse(line) as {
        text?: string;
        is_final?: boolean;
        type?: string;
        error?: string;
      };

      lastPayload = payload;

      if (payload.error) {
        throw new Error(payload.error);
      }

      if (typeof payload.text === "string" && payload.text.trim().length > 0) {
        const isExplicitlyPartial =
          payload.is_final === false || payload.type === "PARTIAL_TRANSCRIPTION";
        if (
          payload.is_final ||
          payload.type === "FINAL_TRANSCRIPTION" ||
          (!isExplicitlyPartial && lines.length === 1)
        ) {
          finalTranscript = payload.text.trim();
        } else {
          interimTranscript = payload.text.trim();
        }
      }
    } catch {
      // Continue parsing next lines if an individual line fails
    }
  }

  if (finalTranscript.length > 0) {
    return {
      text: finalTranscript,
      isFinal: true,
      raw: lastPayload,
    };
  }

  if (interimTranscript.length > 0) {
    return {
      text: interimTranscript,
      isFinal: false,
      raw: lastPayload,
    };
  }

  return {
    text: "",
    isFinal: false,
    raw: lastPayload,
  };
}
