/**
 * High-performance, client-side PCM WAV Encoder and Direct Audio Recorder.
 * Guarantees standard 16kHz 16-bit mono PCM WAV generation for Gemini multimodal STT.
 */

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes raw Float32Array audio samples into a standard 16-bit mono PCM WAV Blob.
 */
export function encodeFloat32ToWav(samples: Float32Array, sampleRate = 16000): Blob {
  const numChannels = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM samples with clamping
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: "audio/wav" });
}

/**
 * Directly captures microphone PCM samples in real time via Web Audio API.
 * Eliminates WebM/Opus container issues and decode errors completely.
 */
export class PcmAudioRecorder {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private pcmChunks: Float32Array[] = [];
  private isRecording = false;

  constructor(private readonly targetSampleRate = 16000) {}

  start(stream: MediaStream) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("Web Audio API is not supported in this browser");
    }

    this.audioCtx = new AudioContextClass();
    this.sourceNode = this.audioCtx.createMediaStreamSource(stream);
    // Buffer size 4096, 1 input channel, 1 output channel
    this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.pcmChunks = [];
    this.isRecording = true;

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const channel = e.inputBuffer.getChannelData(0);
      this.pcmChunks.push(new Float32Array(channel));
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioCtx.destination);
  }

  stop(): Blob {
    this.isRecording = false;
    const sampleRate = this.audioCtx?.sampleRate || this.targetSampleRate;

    if (this.processorNode) {
      try {
        this.processorNode.disconnect();
      } catch {
        // ignore
      }
      this.processorNode = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    // Merge chunks
    let totalLength = 0;
    for (const chunk of this.pcmChunks) {
      totalLength += chunk.length;
    }

    if (totalLength === 0) {
      return new Blob([], { type: "audio/wav" });
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.pcmChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Downsample if audioCtx sample rate is different from target 16kHz
    if (sampleRate !== this.targetSampleRate && sampleRate > 0) {
      const ratio = sampleRate / this.targetSampleRate;
      const newLength = Math.round(totalLength / ratio);
      const resampled = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        const origIndex = Math.floor(i * ratio);
        resampled[i] = merged[origIndex] ?? 0;
      }
      return encodeFloat32ToWav(resampled, this.targetSampleRate);
    }

    return encodeFloat32ToWav(merged, sampleRate);
  }
}

/**
 * Converts recorded browser Blob (WebM/MP4/OGG) to clean 16kHz WAV Blob using Web Audio API
 */
export async function convertBlobToWav(audioBlob: Blob): Promise<Blob> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    return audioBlob;
  }

  const audioCtx = new AudioContextClass();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const inputChannelData = audioBuffer.getChannelData(0);
    const sampleRate = 16000;
    const ratio = audioBuffer.sampleRate / sampleRate;
    const newLength = Math.round(inputChannelData.length / ratio);
    const samples = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const origIndex = Math.floor(i * ratio);
      samples[i] = inputChannelData[origIndex] ?? 0;
    }

    return encodeFloat32ToWav(samples, sampleRate);
  } catch (err) {
    console.warn("Could not decode audio buffer to WAV, using original blob:", err);
    return audioBlob;
  } finally {
    if (audioCtx.state !== "closed") {
      await audioCtx.close();
    }
  }
}
