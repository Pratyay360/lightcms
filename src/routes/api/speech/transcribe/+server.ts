import { json } from "@sveltejs/kit";
import { transcribeAudioWithWit } from "$lib/server/wit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const contentTypeHeader = request.headers.get("content-type") || "";

  let audioBuffer: ArrayBuffer;
  let audioContentType = "audio/wav";

  if (contentTypeHeader.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("audio") || formData.get("file");

    if (!(file instanceof Blob)) {
      return json(
        {
          error: "No audio file found in form data payload.",
          code: "missing-audio",
        },
        { status: 400 },
      );
    }

    if (file.type && file.type.length > 0) {
      audioContentType = file.type;
    }
    audioBuffer = await file.arrayBuffer();
  } else {
    if (contentTypeHeader.length > 0) {
      audioContentType = contentTypeHeader.split(";")[0].trim();
    }
    audioBuffer = await request.arrayBuffer();
  }

  if (audioBuffer.byteLength === 0) {
    return json({ error: "Audio payload is empty.", code: "empty-audio" }, { status: 400 });
  }

  try {
    const result = await transcribeAudioWithWit(audioBuffer, audioContentType);
    return json({
      text: result.text,
      isFinal: result.isFinal,
    });
  } catch (error) {
    console.error("[Speech Transcribe Error]:", error);
    const message =
      error instanceof Error ? error.message : "Failed to transcribe audio with Wit.ai.";
    return json(
      {
        error: message,
        code: "transcription-failed",
      },
      { status: 500 },
    );
  }
};
