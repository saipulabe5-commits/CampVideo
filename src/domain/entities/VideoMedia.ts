export interface VideoMedia {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  audioCodec: string;
  audioChannels: number;
  sampleRateHz: number;
  bitrateKbps: number;
  previewUrl?: string;
  ingestedAt: string;
}
