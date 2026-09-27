import { TranscriptSegment } from '../../domain/entities/Knowledge';

export interface TranscriptionProgress {
  processedSeconds: number;
  totalSeconds: number;
  percent: number;
}

export interface ITranscriptionProvider {
  readonly id: string;
  readonly name: string;
  readonly isOfflineReady: boolean;
  transcribe(
    audioFilePath: string, 
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<readonly TranscriptSegment[]>;
}
