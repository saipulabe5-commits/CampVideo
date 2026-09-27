/**
 * AudioExtractionService.ts
 * Browser-native audio extraction from video files or Blob URLs
 * Uses Web Audio API to decode video audio and export a 16kHz mono WAV for AI transcription.
 */

export interface ExtractedAudioResult {
  wavBlob: Blob;
  base64Wav: string;
  durationSeconds: number;
  hasAudio: boolean;
  sampleRate: number;
}

export class AudioExtractionService {
  /**
   * Decodes audio from a video/audio File, Blob, or URL and returns an optimized 16kHz mono WAV.
   */
  public static async extractAudioWav(source: File | Blob | string): Promise<ExtractedAudioResult> {
    let arrayBuffer: ArrayBuffer;

    if (typeof source === 'string') {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Gagal mengambil data video dari URL: ${response.statusText}`);
      }
      arrayBuffer = await response.arrayBuffer();
    } else {
      arrayBuffer = await source.arrayBuffer();
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API tidak didukung pada browser ini.');
    }

    const audioCtx = new AudioContextClass();
    let audioBuffer: AudioBuffer;

    try {
      // Decode the audio track from the media container
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } catch (err) {
      console.warn('decodeAudioData gagal atau file tidak memiliki track audio:', err);
      return {
        wavBlob: new Blob([], { type: 'audio/wav' }),
        base64Wav: '',
        durationSeconds: 0,
        hasAudio: false,
        sampleRate: 16000,
      };
    } finally {
      if (audioCtx.state !== 'closed') {
        await audioCtx.close().catch(() => {});
      }
    }

    const duration = audioBuffer.duration;
    if (audioBuffer.numberOfChannels === 0 || duration <= 0) {
      return {
        wavBlob: new Blob([], { type: 'audio/wav' }),
        base64Wav: '',
        durationSeconds: 0,
        hasAudio: false,
        sampleRate: 16000,
      };
    }

    // Check if there is actual non-silent sound
    const channel0 = audioBuffer.getChannelData(0);
    let maxAmp = 0;
    const probeStep = Math.max(1, Math.floor(channel0.length / 500));
    for (let i = 0; i < channel0.length; i += probeStep) {
      const absVal = Math.abs(channel0[i]);
      if (absVal > maxAmp) maxAmp = absVal;
    }

    const hasAudio = maxAmp > 0.002;

    // Resample to 16kHz mono using OfflineAudioContext for efficient network transfer and optimal STT
    const targetSampleRate = 16000;
    const targetLength = Math.max(1, Math.ceil(duration * targetSampleRate));
    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);

    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(offlineCtx.destination);
    sourceNode.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const pcmSamples = renderedBuffer.getChannelData(0);

    // Encode to 16-bit PCM WAV
    const wavBytes = AudioExtractionService.encodeWav(pcmSamples, targetSampleRate);
    const wavBlob = new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
    const base64Wav = await AudioExtractionService.blobToBase64(wavBlob);

    return {
      wavBlob,
      base64Wav,
      durationSeconds: duration,
      hasAudio,
      sampleRate: targetSampleRate,
    };
  }

  /**
   * Encodes float samples (-1.0 to 1.0) into a standard 16-bit mono PCM WAV file.
   */
  private static encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
    const numSamples = samples.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    AudioExtractionService.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    AudioExtractionService.writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    AudioExtractionService.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)

    // "data" sub-chunk
    AudioExtractionService.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Write 16-bit PCM samples
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Uint8Array(buffer);
  }

  private static writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
