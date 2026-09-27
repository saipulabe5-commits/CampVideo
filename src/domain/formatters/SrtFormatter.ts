import { SubtitleCue } from '../entities/Composition';
import { SubtitleTranslationService } from '../services/SubtitleTranslationService';

function formatSrtTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const hh = hrs.toString().padStart(2, '0');
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  const mmm = millis.toString().padStart(3, '0');

  return `${hh}:${mm}:${ss},${mmm}`;
}

export class SrtFormatter {
  public static format(
    cues: readonly SubtitleCue[], 
    offsetSeconds = 0, 
    lang: 'id' | 'en' | 'dual' = 'id'
  ): string {
    return cues
      .map((cue, index) => {
        const start = Math.max(0, cue.startSeconds - offsetSeconds);
        const end = Math.max(0, cue.endSeconds - offsetSeconds);
        const seq = index + 1;
        const timing = `${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(end)}`;
        const text = SubtitleTranslationService.getDisplayText(cue, lang);
        return `${seq}\n${timing}\n${text}\n`;
      })
      .join('\n');
  }
}
