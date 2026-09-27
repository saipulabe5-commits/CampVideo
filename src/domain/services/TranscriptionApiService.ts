/**
 * TranscriptionApiService.ts
 * Client service to communicate with /api/transcribe and /api/analyze
 */

import { AudioExtractionService } from './AudioExtractionService';
import { SubtitleCue } from '../entities/Composition';

export interface TranscriptionResponse {
  success: boolean;
  hasSpeech: boolean;
  detectedLanguage?: string;
  summary?: string;
  transcripts: SubtitleCue[];
  errorMessage?: string;
}

export class TranscriptionApiService {
  /**
   * Transcribes speech directly from a video file or audio URL using backend Gemini proxy.
   */
  public static async transcribeVideoAudio(
    source: File | Blob | string,
    projectName: string,
    onProgress?: (step: string) => void
  ): Promise<TranscriptionResponse> {
    try {
      onProgress?.('Mengekstrak audio dari video...');
      const extracted = await AudioExtractionService.extractAudioWav(source);

      if (!extracted.hasAudio || extracted.durationSeconds <= 0) {
        return {
          success: false,
          hasSpeech: false,
          transcripts: [],
          errorMessage: 'Video ini tidak memiliki track audio atau suaranya terlalu hening / tidak terdengar.',
        };
      }

      onProgress?.('Mengirim audio ke Google Gemini AI untuk transkripsi...');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioBase64: extracted.base64Wav,
          mimeType: 'audio/wav',
          projectName,
          duration: extracted.durationSeconds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Gagal memproses audio.');
      }

      const rawTranscripts = result.transcripts || [];
      const subtitleCues: SubtitleCue[] = rawTranscripts.map((t: { id?: string; startSeconds: number; endSeconds: number; text: string }, idx: number) => ({
        id: t.id || `cue-ai-${idx + 1}`,
        startSeconds: Number(t.startSeconds) || 0,
        endSeconds: Number(t.endSeconds) || 2.0,
        text: (t.text || '').trim(),
      }));

      return {
        success: true,
        hasSpeech: result.hasSpeech !== false && subtitleCues.length > 0,
        detectedLanguage: result.detectedLanguage || 'id',
        summary: result.summary,
        transcripts: subtitleCues,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mentranskrip audio.';
      console.error('Transcription error:', err);
      return {
        success: false,
        hasSpeech: false,
        transcripts: [],
        errorMessage: msg,
      };
    }
  }
}
