import { describe, expect, it } from "vite-plus/test";
import { isWitConfigured, parseWitDictationResponse } from "./wit.js";

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

  describe("isWitConfigured", () => {
    it("returns boolean reflecting token availability", () => {
      const configured = isWitConfigured();
      expect(typeof configured).toBe("boolean");
    });
  });
});
