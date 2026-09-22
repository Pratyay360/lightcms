// eslint-disable-next-line vite-plus/prefer-vite-plus-imports
import { describe, expect, it } from "vitest";
import {
  encodeWav,
  mapSpeechRecognitionError,
  parseWitResponse,
  processSpeechResults,
  type SpeechRecognitionEvent,
} from "./speech-recognition.js";

describe("encodeWav", () => {
  it("encodes float samples into valid 16-bit mono 16kHz PCM WAV buffer", () => {
    const sampleRate = 16000;
    const sampleCount = 1000;
    const samples = new Float32Array(sampleCount);

    for (let i = 0; i < sampleCount; i += 1) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }

    const wavBytes = encodeWav(samples, sampleRate);
    const expectedByteLength = 44 + sampleCount * 2;
    expect(wavBytes.length).toBe(expectedByteLength);

    // Verify RIFF header
    const view = new DataView(wavBytes.buffer);
    const riff = String.fromCharCode(wavBytes[0]!, wavBytes[1]!, wavBytes[2]!, wavBytes[3]!);
    expect(riff).toBe("RIFF");

    const wave = String.fromCharCode(wavBytes[8]!, wavBytes[9]!, wavBytes[10]!, wavBytes[11]!);
    expect(wave).toBe("WAVE");

    const fmt = String.fromCharCode(wavBytes[12]!, wavBytes[13]!, wavBytes[14]!, wavBytes[15]!);
    expect(fmt).toBe("fmt ");

    // Verify audio format is 1 (PCM)
    expect(view.getUint16(20, true)).toBe(1);
    // Verify mono channel count
    expect(view.getUint16(22, true)).toBe(1);
    // Verify sample rate
    expect(view.getUint32(24, true)).toBe(sampleRate);
    // Verify 16 bits per sample
    expect(view.getUint16(34, true)).toBe(16);

    const dataHeader = String.fromCharCode(
      wavBytes[36]!,
      wavBytes[37]!,
      wavBytes[38]!,
      wavBytes[39]!,
    );
    expect(dataHeader).toBe("data");
    expect(view.getUint32(40, true)).toBe(sampleCount * 2);
  });
});

describe("parseWitResponse", () => {
  it("parses single JSON final transcription", () => {
    const raw = JSON.stringify({
      text: "hello from wit",
      is_final: true,
      type: "FINAL_TRANSCRIPTION",
    });

    const result = parseWitResponse(raw);
    expect(result.text).toBe("hello from wit");
    expect(result.isFinal).toBe(true);
  });

  it("extracts final transcript from newline-delimited stream chunks", () => {
    const raw = [
      JSON.stringify({
        text: "hello",
        is_final: false,
        type: "PARTIAL_TRANSCRIPTION",
      }),
      JSON.stringify({
        text: "hello world",
        is_final: false,
        type: "PARTIAL_TRANSCRIPTION",
      }),
      JSON.stringify({
        text: "hello world today",
        is_final: true,
        type: "FINAL_TRANSCRIPTION",
      }),
    ].join("\n");

    const result = parseWitResponse(raw);
    expect(result.text).toBe("hello world today");
    expect(result.isFinal).toBe(true);
  });

  it("returns interim transcript when no final transcription is present", () => {
    const raw = JSON.stringify({
      text: "testing partial input",
      is_final: false,
      type: "PARTIAL_TRANSCRIPTION",
    });

    const result = parseWitResponse(raw);
    expect(result.text).toBe("testing partial input");
    expect(result.isFinal).toBe(false);
  });

  it("handles empty or blank payload gracefully", () => {
    const result = parseWitResponse("   \n  ");
    expect(result.text).toBe("");
    expect(result.isFinal).toBe(false);
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

  it("identifies wit-not-configured gracefully", () => {
    const err = mapSpeechRecognitionError("wit-not-configured");
    expect(err.isFatal).toBe(false);
    expect(err.message).toContain("WIT_AI_TOKEN");
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

describe("processSpeechResults", () => {
  it("extracts interim transcript without final transcripts when isFinal is false", () => {
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          isFinal: false,
          length: 1,
          0: { transcript: "hello world", confidence: 0.9 },
          item: () => ({ transcript: "hello world", confidence: 0.9 }),
        },
      ],
    } as unknown as SpeechRecognitionEvent;

    const outcome = processSpeechResults(mockEvent);
    expect(outcome.finalTranscripts).toEqual([]);
    expect(outcome.interimTranscript).toBe("hello world");
  });

  it("extracts finalized transcripts when isFinal is true", () => {
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          length: 1,
          0: { transcript: "  hello world  ", confidence: 0.95 },
          item: () => ({ transcript: "  hello world  ", confidence: 0.95 }),
        },
      ],
    } as unknown as SpeechRecognitionEvent;

    const outcome = processSpeechResults(mockEvent);
    expect(outcome.finalTranscripts).toEqual(["hello world"]);
    expect(outcome.interimTranscript).toBe("");
  });
});
