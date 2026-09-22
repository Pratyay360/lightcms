// eslint-disable-next-line vite-plus/prefer-vite-plus-imports
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getWitTokens, isWitConfigured, parseWitDictationResponse } from "./wit.js";

describe("Wit server module", () => {
  describe("parseWitDictationResponse", () => {
    it("parses single JSON payload with final transcription", () => {
      const response = JSON.stringify({
        text: "hello world",
        is_final: true,
        type: "FINAL_TRANSCRIPTION",
      });

      const parsed = parseWitDictationResponse(response);
      expect(parsed.text).toBe("hello world");
      expect(parsed.isFinal).toBe(true);
    });

    it("parses legacy _text field if present", () => {
      const response = JSON.stringify({
        _text: "legacy speech result",
        is_final: true,
      });

      const parsed = parseWitDictationResponse(response);
      expect(parsed.text).toBe("legacy speech result");
      expect(parsed.isFinal).toBe(true);
    });

    it("parses multiline streaming payload and picks the final transcription", () => {
      const multiline = [
        JSON.stringify({
          text: "good",
          is_final: false,
          type: "PARTIAL_TRANSCRIPTION",
        }),
        JSON.stringify({
          text: "good morning",
          is_final: false,
          type: "PARTIAL_TRANSCRIPTION",
        }),
        JSON.stringify({
          text: "good morning everyone",
          is_final: true,
          type: "FINAL_TRANSCRIPTION",
        }),
      ].join("\n");

      const parsed = parseWitDictationResponse(multiline);
      expect(parsed.text).toBe("good morning everyone");
      expect(parsed.isFinal).toBe(true);
    });

    it("extracts interim text when final transcription has not yet arrived", () => {
      const multiline = [
        JSON.stringify({
          text: "still speaking",
          is_final: false,
          type: "PARTIAL_TRANSCRIPTION",
        }),
      ].join("\n");

      const parsed = parseWitDictationResponse(multiline);
      expect(parsed.text).toBe("still speaking");
      expect(parsed.isFinal).toBe(false);
    });

    it("handles empty or whitespace-only response string", () => {
      const parsed = parseWitDictationResponse("   \n   ");
      expect(parsed.text).toBe("");
      expect(parsed.isFinal).toBe(false);
    });
  });

  describe("getWitTokens", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      delete process.env.WIT_AI_CLIENT_TOKEN;
      delete process.env.WIT_AI_TOKEN;
      delete process.env.WIT_TOKEN;
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("returns empty array when no token is set", () => {
      expect(getWitTokens()).toEqual([]);
      expect(isWitConfigured()).toBe(false);
    });

    it("returns array with sanitized client and server tokens without quotes or spaces", () => {
      process.env.WIT_AI_CLIENT_TOKEN = ' "CLIENT_ABC" ';
      process.env.WIT_AI_TOKEN = " SERVER_123 ";

      const tokens = getWitTokens();
      expect(tokens).toEqual(["CLIENT_ABC", "SERVER_123"]);
      expect(isWitConfigured()).toBe(true);
    });

    it("falls back to WIT_TOKEN if WIT_AI_TOKEN is not set", () => {
      process.env.WIT_TOKEN = "FALLBACK_TOKEN";

      const tokens = getWitTokens();
      expect(tokens).toEqual(["FALLBACK_TOKEN"]);
      expect(isWitConfigured()).toBe(true);
    });
  });
});
