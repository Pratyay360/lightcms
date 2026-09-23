import { createOpenAI } from "@ai-sdk/openai";
import { ORPCError, os, type } from "@orpc/server";
import { streamText } from "ai";
import { isGroqConfigured, transcribeAudioWithGroq } from "$lib/server/groq";
import { cmsRouter } from "./cms-router";

const generateContent = os.input(type<{ prompt: string }>()).handler(async ({ input, signal }) => {
  const prompt = input.prompt?.trim();
  if (!prompt) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Enter a prompt before generating content.",
    });
  }

  const apiKey = process.env.OPEN_AI_APIKEY!;
  const baseURL = process.env.OPEN_AI_ENDPOINT!;
  const modelName = process.env.OPEN_AI_MODEL!;

  const openai = createOpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  const result = streamText({
    model: openai(modelName),
    prompt,
    abortSignal: signal,
  });

  return (async function* () {
    for await (const chunk of result.textStream) yield chunk;
  })();
});

const transcribeSpeech = os
  .input(
    type<{
      audio: string;
      contentType?: string;
      language?: string;
      prompt?: string;
    }>(),
  )
  .handler(async ({ input }) => {
    const { audio, contentType, language, prompt } = input;
    if (!audio) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Audio data is required for transcription.",
      });
    }

    const audioBuffer = Buffer.from(audio, "base64");
    if (audioBuffer.length === 0) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Audio data is empty.",
      });
    }

    try {
      const result = await transcribeAudioWithGroq(audioBuffer, {
        contentType,
        language,
        prompt,
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Groq transcription failed";
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message,
      });
    }
  });

export const router = {
  ai: {
    generateContent,
  },
  speech: {
    transcribe: transcribeSpeech,
    isConfigured: os.handler(async () => {
      return { configured: isGroqConfigured() };
    }),
  },
  cms: cmsRouter,
};
