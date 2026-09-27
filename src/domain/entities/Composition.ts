import { TimestampRange } from '../value-objects/TimestampRange';

export interface SubtitleCue {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  textId?: string;
  textEn?: string;
}

export interface SubtitleStyle {
  enabled?: boolean;
  language?: 'id' | 'en' | 'dual';
  fontFamily: string;
  fontSizePt: number;
  textColorHex: string;
  highlightColorHex: string;
  highlightStyle?: 'KARAOKE_WORD' | 'KARAOKE_FILL' | 'BOX_POP' | 'COLOR_ONLY' | 'NONE';
  highlightBgHex?: string;
  position: 'BOTTOM' | 'CENTER' | 'TOP';
  maxWordsPerLine: number;
  allCaps: boolean;
}

export interface TitleOverlay {
  enabled?: boolean;
  text: string;
  durationSeconds: number;
  animation: 'FADE' | 'POP' | 'TYPEWRITER' | 'STATIC';
}

export interface ViralThumbnailCandidate {
  id: string;
  timestampSec: number;
  label: string;
  viralScore: number;
  badge: string;
  reason: string;
}

export interface Composition {
  id: string;
  projectId: string;
  recommendationId: string;
  name: string;
  aspectRatio: '9:16' | '1:1' | '16:9';
  
  // Strict Composition Components
  clipRange: TimestampRange;
  mergedRange?: TimestampRange;
  subtitles: readonly SubtitleCue[];
  subtitleStyle: SubtitleStyle;
  titleOverlay: TitleOverlay;
  generatedTitles: readonly string[];
  thumbnailTimestampSec: number;
  suggestedThumbnailTimestampSec: number;
  viralCandidates?: readonly ViralThumbnailCandidate[];
  
  exportResolution: {
    width: number;
    height: number;
  };
  exportFps: number;
  updatedAt: string;
}
