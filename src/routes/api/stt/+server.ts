import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";

export const prerender = false;

const WIT_API_VERSION = "20240304";
const MAX_BYTES = 10 * 1024 * 1024;

const UPSTREAM_TYPES: Record<string, string> = {
  "audio/wav": "audio/wav",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/vnd.wave": "audio/wav",
  "audio/mpeg": "audio/mpeg3",
  "audio/mp3": "audio/mpeg3",
  "audio/mpeg3": "audio/mpeg3",
  "audio/ogg": "audio/ogg",
  "audio/opus": "audio/ogg",
  "audio/webm": "audio/ogg", // your frontend sends webm -> convert to wav, but we accept ogg as fallback
  "audio/ulaw": "audio/ulaw",
  "audio/x-mulaw": "audio/ulaw",
};

export const POST: RequestHandler = async ({ request }) => {
  // FIX 1: Use SvelteKit env, not process.env
  const token = (env.WIT_AI_TOKEN || env.WIT_TOKEN || "").trim();
  if (!token) {
    return json({ message: "WIT_AI_TOKEN not set on server" }, { status: 503 });
  }

  // FIX 2: form can be null
  const form = await request.formData().catch(() => null);
  if (!form) {
    return json({ message: "Expected multipart/form-data" }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof File)) return json({ message: "Missing 'audio' field" }, { status: 400 });
  if (audio.size === 0) return json({ message: "Empty audio" }, { status: 400 });
  if (audio.size > MAX_BYTES) return json({ message: "Audio >10MB" }, { status: 413 });

  const rawType = (audio.type || "audio/wav").toLowerCase().split(";")[0]!.trim();
  const upstreamType = UPSTREAM_TYPES[rawType] ?? "audio/wav";

  const witRes = await fetch(`https://api.wit.ai/speech?v=${WIT_API_VERSION}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": upstreamType,
      Accept: "application/json",
    },
    body: await audio.arrayBuffer(),
  }).catch(() => null);

  if (!witRes) return json({ message: "Could not reach Wit.ai" }, { status: 502 });
  if (!witRes.ok) {
    const detail = (await witRes.text().catch(() => "")).slice(0, 500);
    return json({ message: `Wit.ai ${witRes.status}: ${detail}` }, { status: 502 });
  }

  const raw = await witRes.text();
  let lastText = "";
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const j = JSON.parse(trimmed) as any;
      if (j.text?.trim()) lastText = j.text.trim();
      else if (j._text?.trim()) lastText = j._text.trim();
    } catch {}
  }
  if (!lastText) {
    try {
      lastText = (JSON.parse(raw).text || "").trim();
    } catch {}
  }

  if (!lastText) return json({ message: "no text", raw: raw.slice(0, 200) }, { status: 422 });
  return json({ text: lastText });
};
