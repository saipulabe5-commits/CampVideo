import { VideoMedia } from '../../domain/entities/VideoMedia';
import { Composition } from '../../domain/entities/Composition';

export interface RenderProgress {
  fps: number;
  frame: number;
  percent: number;
  bitrateKbps: number;
  remainingTimeSec: number;
}

export interface IMediaEngine {
  readonly id: string;
  probeVideo(filePath: string): Promise<VideoMedia>;
  extractAudio(videoFilePath: string, outputWavPath: string): Promise<void>;
  renderComposition(
    sourceVideo: VideoMedia,
    composition: Composition,
    outputPath: string,
    onProgress?: (progress: RenderProgress) => void
  ): Promise<string>;
}
