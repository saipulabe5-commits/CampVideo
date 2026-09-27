import { ICompositionRepository } from '../../application/ports/ICompositionRepository';
import { Composition } from '../../domain/entities/Composition';

const COMPOSITION_PREFIX = 'aicampaign_compositions_';

export class LocalCompositionRepository implements ICompositionRepository {
  public async getByProjectId(projectId: string): Promise<readonly Composition[]> {
    const raw = localStorage.getItem(`${COMPOSITION_PREFIX}${projectId}`);
    if (!raw) {
      if (projectId === 'proj-acme-launch-2026') {
        const seedComposition: Composition = {
          id: 'comp-1',
          projectId,
          recommendationId: 'rec-1',
          name: 'Kenapa Harus Minum Air (9:16 Shorts)',
          aspectRatio: '9:16',
          clipRange: { startSeconds: 0.0, endSeconds: 10.0 },
          subtitles: [
            { id: 'sub-1', startSeconds: 0.0, endSeconds: 1.8, text: 'Hai teman-teman!', textId: 'Hai teman-teman!', textEn: 'Hi friends!' },
            { id: 'sub-2', startSeconds: 1.8, endSeconds: 3.8, text: 'Kenapa harus minum air?', textId: 'Kenapa harus minum air?', textEn: 'Why should we drink water?' },
            { id: 'sub-3', startSeconds: 3.8, endSeconds: 6.2, text: 'Air membantu tubuh tetap terhidrasi.', textId: 'Air membantu tubuh tetap terhidrasi.', textEn: 'Water helps keep the body hydrated.' },
            { id: 'sub-4', startSeconds: 7.8, endSeconds: 9.9, text: 'Yuk, minum air!', textId: 'Yuk, minum air!', textEn: 'Come on, let’s drink water!' },
          ],
          subtitleStyle: {
            enabled: true,
            language: 'id',
            fontFamily: 'Plus Jakarta Sans',
            fontSizePt: 22,
            textColorHex: '#FFFFFF',
            highlightColorHex: '#EAB308',
            position: 'BOTTOM',
            maxWordsPerLine: 5,
            allCaps: true,
          },
          titleOverlay: {
            text: 'KENAPA HARUS MINUM AIR? YUK MINUM AIR!',
            durationSeconds: 3.5,
            animation: 'POP',
          },
          generatedTitles: [
            'KENAPA HARUS MINUM AIR? YUK MINUM AIR!',
            'MANFAAT MINUM AIR UNTUK TUBUH',
            'TUTORIAL ADAB MINUM ANAK HEBAT',
            'AIR MEMBANTU TUBUH TETAP TERHIDRASI',
            'TIPS SEHAT & SEGAR SETIAP HARI',
          ],
          thumbnailTimestampSec: 1.2,
          suggestedThumbnailTimestampSec: 1.2,
          exportResolution: { width: 1080, height: 1920 },
          exportFps: 60,
          updatedAt: '2026-09-26T10:15:00.000Z',
        };
        // Save directly to localStorage without calling this.save to prevent recursive stack overflow
        localStorage.setItem(`${COMPOSITION_PREFIX}${projectId}`, JSON.stringify([seedComposition]));
        return [seedComposition];
      }
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as readonly Composition[]) : [];
    } catch {
      return [];
    }
  }

  public async getById(id: string): Promise<Composition | null> {
    return null;
  }

  public async save(composition: Composition): Promise<void> {
    const raw = localStorage.getItem(`${COMPOSITION_PREFIX}${composition.projectId}`);
    let current: Composition[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          current = parsed;
        }
      } catch {
        current = [];
      }
    }
    const index = current.findIndex((c) => c.id === composition.id);
    let next: Composition[];
    if (index >= 0) {
      next = [...current];
      next[index] = { ...composition, updatedAt: new Date().toISOString() };
    } else {
      next = [composition, ...current];
    }
    localStorage.setItem(`${COMPOSITION_PREFIX}${composition.projectId}`, JSON.stringify(next));
  }

  public async delete(id: string): Promise<void> {
    // Delete logic
  }
}
