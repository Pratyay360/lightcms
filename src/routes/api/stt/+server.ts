import { error, json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const getWitToken = (): string => {
  const token = env.WIT_AI_TOKEN;
  if (typeof token === "string" && token.length > 0) {
    return token;
  }
  return "";
};

// Latest documented Wit.ai HTTP API version. Do not use a future date:
// Wit rejects unknown versions and behaviour changes across versions.
const WIT_API_VERSION = "20240304";

const MAX_BYTES = 10 * 1024 * 1024;

// Wit.ai POST /speech only understands these content types.
// Browsers record audio/webm (Chrome) or audio/mp4 (Safari), neither of
// which Wit accepts, so the client converts to WAV before uploading.
// See https://wit.ai/docs/http/20240304/
const UPSTREAM_TYPES: Record<string, string> = {
  "audio/wav": "audio/wav",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/mpeg": "audio/mpeg3",
  "audio/mp3": "audio/mpeg3",
  "audio/mpeg3": "audio/mpeg3",
  "audio/ogg": "audio/ogg",
  "audio/opus": "audio/opus",
  "audio/ulaw": "audio/ulaw",
};

export const POST = async ({ request }: { request: Request }) => {
  const witToken = getWitToken();
  if (!witToken) {
    throw error(503, "STT is not configured on this server.");
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw error(415, "Expected multipart/form-data.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw error(400, "Could not parse multipart body.");
  }

  const audio = form.get("audio");
  if (!(audio instanceof File)) {
    throw error(400, "Missing 'audio' file field.");
  }
  if (audio.size === 0) {
    throw error(400, "Audio payload is empty.");
  }
  if (audio.size > MAX_BYTES) {
    throw error(413, "Audio payload exceeds 10 MB limit.");
  }

  const rawType = audio.type.toLowerCase().split(";")[0]?.trim() ?? "";
  const upstreamType = UPSTREAM_TYPES[rawType];
  if (!upstreamType) {
    throw error(
      415,
      `Unsupported audio format "${rawType || "unknown"}". Please send 16-bit mono WAV (audio/wav).`,
    );
  }

  let witResponse: Response;
  try {
    witResponse = await fetch(`https://api.wit.ai/speech?v=${WIT_API_VERSION}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${witToken}`,
        "Content-Type": upstreamType,
      },
      body: await audio.arrayBuffer(),
    });
  } catch {
    return json({ error: "upstream_failure", message: "Could not reach Wit.ai." }, { status: 502 });
  }

  if (!witResponse.ok) {
    const status = witResponse.status;
    const detail = (await witResponse.text().catch(() => "")).trim().slice(0, 300);
    return json(
      {
        error: "upstream_failure",
        status,
        message: statusTextFor(status, detail),
      },
      { status: 502 },
    );
  }

  const raw = await witResponse.text();
  const text = extractText(raw);
  if (!text) {
    throw error(422, "Transcription returned no text.");
  }

  return json({ text });
};

function statusTextFor(status: number, detail: string): string {
  let base: string;
  if (status === 400) {
    base = "Wit.ai rejected the audio (400). The format must be mono WAV/MP3/OGG.";
  } else if (status === 401) {
    base = "Wit.ai rejected the token (401).";
  } else if (status === 403) {
    base = "Wit.ai forbade the request (403).";
  } else if (status === 429) {
    base = "Wit.ai rate limit reached (429).";
  } else {
    base = `Wit.ai responded ${status}.`;
  }
  if (detail) {
    return `${base} Detail: ${detail}`;
  }
  return base;
}

function textFromObject(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return "";
  }
  const record = data as Record<string, unknown>;
  const text = record["text"];
  if (typeof text === "string" && text.trim()) {
    return text.trim();
  }
  // Pre-2023 Wit responses used `_text`.
  const legacy = record["_text"];
  if (typeof legacy === "string" && legacy.trim()) {
    return legacy.trim();
  }
  return "";
}

function extractText(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return "";
  }
  // Wit can emit chunked/NDJSON (one JSON object per line, e.g. /dictation
  // style streams). The final chunk holds the complete transcript, so scan
  // every line/object and keep the last non-empty text.
  const candidates: string[] = [];
  const lines = trimmed.split(/\r?\n/);
  for (const line of lines) {
    const piece = line.trim();
    if (!piece) {
      continue;
    }
    try {
      const parsed: unknown = JSON.parse(piece);
      const text = textFromObject(parsed);
      if (text) {
        candidates.push(text);
      }
    } catch {
      // Not JSON on this line; ignore and keep scanning.
    }
  }
  if (candidates.length > 0) {
    const last = candidates[candidates.length - 1];
    if (last) {
      return last;
    }
  }
  // Single JSON object spanning multiple lines.
  try {
    return textFromObject(JSON.parse(trimmed));
  } catch {
    return "";
  }
}
