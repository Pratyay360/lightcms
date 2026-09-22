class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(0);
    this.flushThreshold = 4096; // Send data when buffer reaches this size

    this.port.onmessage = (event) => {
      if (event.data === "flush") {
        this.flushBuffer();
      }
    };
  }

  flushBuffer() {
    if (this.buffer.length > 0) {
      this.port.postMessage({ type: "audio", samples: this.buffer });
      this.buffer = new Float32Array(0);
    }
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    const channelData = input[0];
    if (!channelData) {
      return true;
    }

    const newBuffer = new Float32Array(this.buffer.length + channelData.length);
    newBuffer.set(this.buffer, 0);
    newBuffer.set(channelData, this.buffer.length);
    this.buffer = newBuffer;

    // Automatically flush when buffer reaches threshold
    if (this.buffer.length >= this.flushThreshold) {
      this.flushBuffer();
    }

    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
