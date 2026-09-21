// eslint-disable-next-line vite-plus/prefer-vite-plus-imports
import { describe, expect, it } from 'vitest';
import {
  mapSpeechRecognitionError,
  processSpeechResults,
  type SpeechRecognitionEvent,
} from "./speech-recognition";

describe("processSpeechResults", () => {
  it("extracts interim transcript without final transcripts when isFinal is false", () => {
    const mockEvent: SpeechRecognitionEvent = {
      resultIndex: 0,
      results: [
        {
          isFinal: false,
          length: 1,
          0: { transcript: "hello world", confidence: 0.9 },
          item: () => ({ transcript: "hello world", confidence: 0.9 }),
        },
      ] as any,
    } as SpeechRecognitionEvent;

    const outcome = processSpeechResults(mockEvent);
    expect(outcome.finalTranscripts).toEqual([]);
    expect(outcome.interimTranscript).toBe("hello world");
  });

  it("extracts finalized transcripts when isFinal is true", () => {
    const mockEvent: SpeechRecognitionEvent = {
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          length: 1,
          0: { transcript: "  hello world  ", confidence: 0.95 },
          item: () => ({ transcript: "  hello world  ", confidence: 0.95 }),
        },
      ] as any,
    } as SpeechRecognitionEvent;

    const outcome = processSpeechResults(mockEvent);
    expect(outcome.finalTranscripts).toEqual(["hello world"]);
    expect(outcome.interimTranscript).toBe("");
  });

  it("processes mixed final and interim results from resultIndex", () => {
    const mockEvent: SpeechRecognitionEvent = {
      resultIndex: 1,
      results: [
        {
          isFinal: true,
          length: 1,
          0: { transcript: "first sentence", confidence: 0.95 },
          item: () => ({ transcript: "first sentence", confidence: 0.95 }),
        },
        {
          isFinal: true,
          length: 1,
          0: { transcript: "second sentence", confidence: 0.9 },
          item: () => ({ transcript: "second sentence", confidence: 0.9 }),
        },
        {
          isFinal: false,
          length: 1,
          0: { transcript: "third part", confidence: 0.8 },
          item: () => ({ transcript: "third part", confidence: 0.8 }),
        },
      ] as any,
    } as SpeechRecognitionEvent;

    const outcome = processSpeechResults(mockEvent);
    // Since resultIndex was 1, only results from index 1 onwards should be processed
    expect(outcome.finalTranscripts).toEqual(["second sentence"]);
    expect(outcome.interimTranscript).toBe("third part");
  });

  it("ignores empty or whitespace-only final transcripts", () => {
    const mockEvent: SpeechRecognitionEvent = {
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          length: 1,
          0: { transcript: "   ", confidence: 0.5 },
          item: () => ({ transcript: "   ", confidence: 0.5 }),
        },
      ] as any,
    } as SpeechRecognitionEvent;

    const outcome = processSpeechResults(mockEvent);
    expect(outcome.finalTranscripts).toEqual([]);
    expect(outcome.interimTranscript).toBe("");
  });
});

describe("mapSpeechRecognitionError", () => {
  it("identifies permission denied as fatal", () => {
    const err = mapSpeechRecognitionError("not-allowed");
    expect(err.isFatal).toBe(true);
    expect(err.message).toContain("Microphone access was denied");
  });

  it("identifies no microphone as fatal", () => {
    const err = mapSpeechRecognitionError("audio-capture");
    expect(err.isFatal).toBe(true);
    expect(err.message).toContain("No microphone was found");
  });

  it("treats no-speech as non-fatal", () => {
    const err = mapSpeechRecognitionError("no-speech");
    expect(err.isFatal).toBe(false);
  });

  it("treats aborted as non-fatal", () => {
    const err = mapSpeechRecognitionError("aborted");
    expect(err.isFatal).toBe(false);
  });

  it("treats network error as non-fatal", () => {
    const err = mapSpeechRecognitionError("network");
    expect(err.isFatal).toBe(false);
    expect(err.message).toContain("network");
  });
});
