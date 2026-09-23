import { afterEach, describe, expect, it } from "vitest";
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
    const originalWindow = globalThis.window;
    const originalNavigator = globalThis.navigator;
    const originalMediaRecorder = globalThis.MediaRecorder;

    afterEach(() => {
      globalThis.window = originalWindow;
      globalThis.navigator = originalNavigator;
      globalThis.MediaRecorder = originalMediaRecorder;
    });

    it("returns false when window is undefined", () => {
      // @ts-expect-error testing environment
      delete globalThis.window;
      expect(isSpeechRecognitionSupported()).toBe(false);
    });

    it("returns true when getUserMedia and MediaRecorder are available", () => {
      // @ts-expect-error mocking
      globalThis.window = {};
      // @ts-expect-error mocking
      globalThis.navigator = {
        mediaDevices: {
          getUserMedia: () => Promise.resolve(),
        },
      };
      // @ts-expect-error mocking
      globalThis.MediaRecorder = class {};

      expect(isSpeechRecognitionSupported()).toBe(true);
    });

    it("returns false when MediaRecorder is missing", () => {
      // @ts-expect-error mocking
      globalThis.window = {};
      // @ts-expect-error mocking
      globalThis.navigator = {
        mediaDevices: {
          getUserMedia: () => Promise.resolve(),
        },
      };
      // @ts-expect-error mocking
      delete globalThis.MediaRecorder;

      expect(isSpeechRecognitionSupported()).toBe(false);
    });
  });

  describe("getSupportedAudioMimeType", () => {
    const originalMediaRecorder = globalThis.MediaRecorder;

    afterEach(() => {
      globalThis.MediaRecorder = originalMediaRecorder;
    });

    it("returns empty string when MediaRecorder is undefined", () => {
      // @ts-expect-error mocking
      delete globalThis.MediaRecorder;
      expect(getSupportedAudioMimeType()).toBe("");
    });

    it("returns the first supported mime type", () => {
      // @ts-expect-error mocking
      globalThis.MediaRecorder = {
        isTypeSupported: (type: string) => type.includes("webm"),
      };
      expect(getSupportedAudioMimeType()).toBe("audio/webm;codecs=opus");
    });
  });
});
