class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(0);
    this.port.onmessage = (event) => {
      if (event.data === "flush") {
        this.port.postMessage({ type: "audio", samples: this.buffer });
        this.buffer = new Float32Array(0);
      }
    };
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

    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
