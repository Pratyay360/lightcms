import { createOpenAI } from "@ai-sdk/openai";
import { ORPCError, os, type } from "@orpc/server";
import { streamText } from "ai";
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

export const router = {
  ai: {
    generateContent,
  },
  cms: cmsRouter,
};
