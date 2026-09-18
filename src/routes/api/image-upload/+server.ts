import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const incoming = await request.formData();
  const source = incoming.get("source");
  if (!(source instanceof File)) {
    return json({ error: "No file uploaded" }, { status: 400 });
  }
  const buffer = await source.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const dataUrl = `data:${source.type};base64,${base64}`;

  try {
    const form = new FormData();
    form.set("key", process.env.CDN_KEY!);
    form.set("source", base64);

    const response = await fetch(process.env.CDN_URL!, {
      method: "POST",
      body: form,
    });

    if (response.ok) {
      const result = (await response.json()) as {
        image?: { url?: string; display_url?: string };
        url?: string;
      };
      const url = result.image?.url ?? result.image?.display_url ?? result.url;
      if (url) {
        return json({ url });
      }
    }

    const text = await response.text();
    throw new Error(`CDN upload failed (${response.status}): ${text}`);
  } catch (cause) {
    console.warn("External CDN upload failed, falling back to data URL:", cause);
  }

  return json({ url: dataUrl });
};
