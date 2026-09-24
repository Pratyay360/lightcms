import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  getAudioExtension,
  getGroqApiKey,
  isGroqConfigured,
  normalizeLanguageCode,
  transcribeAudioWithGroq,
} from "./groq.js";

describe("Groq server module", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isGroqConfigured", () => {
    it("returns false when GROQ_API_KEY is not set", () => {
      delete process.env.GROQ_API_KEY;
      expect(isGroqConfigured()).toBe(false);
    });

    it("returns false when GROQ_API_KEY is empty whitespace", () => {
      process.env.GROQ_API_KEY = "   ";
      expect(isGroqConfigured()).toBe(false);
    });

    it("returns true when GROQ_API_KEY is set", () => {
      process.env.GROQ_API_KEY = "test-key";
      expect(isGroqConfigured()).toBe(true);
    });
  });

  describe("getGroqApiKey", () => {
    it("returns undefined when GROQ_API_KEY is not set", () => {
      delete process.env.GROQ_API_KEY;
      expect(getGroqApiKey()).toBeUndefined();
    });

    it("returns the API key when GROQ_API_KEY is set", () => {
      process.env.GROQ_API_KEY = "test-key";
      expect(getGroqApiKey()).toBe("test-key");
    });
  });

  describe("getAudioExtension", () => {
    it("returns webm by default when contentType is undefined", () => {
      expect(getAudioExtension()).toBe("webm");
    });

    it("returns webm for audio/webm with codecs", () => {
      expect(getAudioExtension("audio/webm;codecs=opus")).toBe("webm");
    });

    it("returns m4a for audio/mp4", () => {
      expect(getAudioExtension("audio/mp4")).toBe("m4a");
    });

    it("returns wav for audio/wav", () => {
      expect(getAudioExtension("audio/wav")).toBe("wav");
    });

    it("returns ogg for audio/ogg", () => {
      expect(getAudioExtension("audio/ogg;codecs=opus")).toBe("ogg");
    });

    it("returns mp3 for audio/mpeg", () => {
      expect(getAudioExtension("audio/mpeg")).toBe("mp3");
    });

    it("returns flac for audio/flac", () => {
      expect(getAudioExtension("audio/flac")).toBe("flac");
    });
  });

  describe("normalizeLanguageCode", () => {
    it("returns undefined when lang is undefined or empty", () => {
      expect(normalizeLanguageCode(undefined)).toBeUndefined();
      expect(normalizeLanguageCode("")).toBeUndefined();
      expect(normalizeLanguageCode("   ")).toBeUndefined();
    });

    it("normalizes locale to 2-letter language code", () => {
      expect(normalizeLanguageCode("en-US")).toBe("en");
      expect(normalizeLanguageCode("fr_FR")).toBe("fr");
      expect(normalizeLanguageCode("ES")).toBe("es");
      expect(normalizeLanguageCode("de-DE")).toBe("de");
    });
  });

  describe("transcribeAudioWithGroq", () => {
    it("throws when GROQ_API_KEY is missing", async () => {
      delete process.env.GROQ_API_KEY;
      await expect(transcribeAudioWithGroq(new Uint8Array([1, 2, 3]))).rejects.toThrow(
        "GROQ_API_KEY is not configured",
      );
    });

    it("returns empty text for empty buffer", async () => {
      process.env.GROQ_API_KEY = "test-key";
      const result = await transcribeAudioWithGroq(new Uint8Array([]));
      expect(result).toEqual({ text: "", isFinal: true });
    });
  });
});
