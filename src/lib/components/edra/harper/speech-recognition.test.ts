import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  getSupportedAudioMimeType,
  isSpeechRecognitionSupported,
  normalizeLanguageCode,
} from "./speech-recognition.js";

describe("speech-recognition utilities", () => {
  describe("normalizeLanguageCode", () => {
    it("returns undefined for empty or undefined input", () => {
      expect(normalizeLanguageCode()).toBeUndefined();
      expect(normalizeLanguageCode("")).toBeUndefined();
      expect(normalizeLanguageCode("   ")).toBeUndefined();
    });

    it("normalizes locale strings to 2-letter codes", () => {
      expect(normalizeLanguageCode("en-US")).toBe("en");
      expect(normalizeLanguageCode("en_GB")).toBe("en");
      expect(normalizeLanguageCode("es-ES")).toBe("es");
      expect(normalizeLanguageCode("FR")).toBe("fr");
      expect(normalizeLanguageCode("de")).toBe("de");
    });
  });

  describe("isSpeechRecognitionSupported", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns false when window is undefined", () => {
      vi.stubGlobal("window", undefined);
      expect(isSpeechRecognitionSupported()).toBe(false);
    });

    it("returns true when getUserMedia and MediaRecorder are available", () => {
      vi.stubGlobal("window", {});
      vi.stubGlobal("navigator", {
        mediaDevices: { getUserMedia: () => Promise.resolve() },
      });
      vi.stubGlobal("MediaRecorder", class {});
      expect(isSpeechRecognitionSupported()).toBe(true);
    });

    it("returns false when MediaRecorder is missing", () => {
      vi.stubGlobal("window", {});
      vi.stubGlobal("navigator", {
        mediaDevices: { getUserMedia: () => Promise.resolve() },
      });
      vi.stubGlobal("MediaRecorder", undefined);
      expect(isSpeechRecognitionSupported()).toBe(false);
    });
  });

  describe("getSupportedAudioMimeType", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns empty string when MediaRecorder is undefined", () => {
      vi.stubGlobal("MediaRecorder", undefined);
      expect(getSupportedAudioMimeType()).toBe("");
    });

    it("returns the first supported mime type", () => {
      vi.stubGlobal("MediaRecorder", {
        isTypeSupported: (type: string) => type.includes("webm"),
      });
      expect(getSupportedAudioMimeType()).toBe("audio/webm;codecs=opus");
    });
  });
});
