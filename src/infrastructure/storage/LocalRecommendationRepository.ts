import { IRecommendationRepository } from '../../application/ports/IRecommendationRepository';
import { Recommendation } from '../../domain/entities/Recommendation';
import { createConfidenceScore } from '../../domain/value-objects/ConfidenceScore';

const RECOMMENDATIONS_PREFIX = 'aicampaign_recommendations_';

export class LocalRecommendationRepository implements IRecommendationRepository {
  public async getByProjectId(projectId: string): Promise<readonly Recommendation[]> {
    const raw = localStorage.getItem(`${RECOMMENDATIONS_PREFIX}${projectId}`);
    if (!raw) {
      if (projectId === 'proj-acme-launch-2026') {
        const seedRecommendations: readonly Recommendation[] = [
          {
            id: 'rec-1',
            projectId,
            title: 'Kenapa Harus Minum Air? Tutorial Hidrasi Anak Sehat',
            recommendationType: 'Performance',
            campaignGoal: 'DIRECT_CONVERSION',
            hookStrategy: 'Sapaan Ceria "Hai Teman-teman!" (0-2s) + Tanya Jawab Manfaat Hidrasi Air (3-6s) + Ajakan Minum (7-10s)',
            startTime: 0.0,
            endTime: 10.0,
            duration: 10.0,
            selectedRange: { startSeconds: 0.0, endSeconds: 10.0 },
            reason: 'Format video edukasi anak lengkap dari pembuka sapaan ceria, demonstrasi memegang gelas air, hingga ajakan jempol hidup sehat. Sangat disukai audiens parenting dan edukasi anak di TikTok/Shorts.',
            evidence: 'Hook pembuka ramah anak dengan confidence 0.98, didukung aksi visual minum air dan ajakan positif di detik 7.8-10.0s.',
            confidence: createConfidenceScore(0.98),
            linkedHookId: 'hk-1',
            linkedProblemId: 'pr-1',
            linkedSolutionId: 'sol-1',
            linkedCtaId: 'cta-1',
            suggestedAspectRatio: '9:16',
            createdAt: '2026-09-26T10:00:00.000Z',
          },
          {
            id: 'rec-2',
            projectId,
            title: 'Rahasia Tubuh Tetap Terhidrasi & Bugar Setiap Hari',
            recommendationType: 'Storytelling',
            campaignGoal: 'PROBLEM_AWARENESS',
            hookStrategy: 'Pertanyaan Langsung "Kenapa harus minum air?" + Penjelasan Edukasi "Air membantu tubuh tetap terhidrasi"',
            startTime: 1.8,
            endTime: 6.2,
            duration: 4.4,
            selectedRange: { startSeconds: 1.8, endSeconds: 6.2 },
            reason: 'Klip edukasi kilat dengan retensi tinggi tanpa basa-basi, langsung membahas esensi pentingnya air putih bagi tubuh manusia.',
            evidence: 'Pertanyaan rasa ingin tahu (curiosity hook) yang langsung terjawab dengan bukti visual memegang gelas air.',
            confidence: createConfidenceScore(0.95),
            linkedHookId: 'hk-1',
            linkedProblemId: 'pr-1',
            linkedSolutionId: 'sol-1',
            suggestedAspectRatio: '9:16',
            createdAt: '2026-09-26T10:02:00.000Z',
          },
          {
            id: 'rec-3',
            projectId,
            title: 'Yuk Minum Air Sekarang! Aksi Jempol Ceria',
            recommendationType: 'Short Hook',
            campaignGoal: 'VIRAL_DISRUPTION',
            hookStrategy: 'Aksi Minum Air Segar + Acungan Jempol Positif "Yuk, minum air!"',
            startTime: 4.5,
            endTime: 10.0,
            duration: 5.5,
            selectedRange: { startSeconds: 4.5, endSeconds: 10.0 },
            reason: 'Klip ajakan berdurasi singkat yang fokus pada pembentukan kebiasaan baik minum air teratur dengan ekspresi ramah dan jempol.',
            evidence: 'Ekspresi ceria anak dan gestur jempol menghasilkan engagement tinggi dan mudah dibagikan (shareable).',
            confidence: createConfidenceScore(0.96),
            linkedHookId: 'hk-2',
            suggestedAspectRatio: '9:16',
            createdAt: '2026-09-26T10:05:00.000Z',
          },
        ];
        this.saveMany(seedRecommendations);
        return seedRecommendations;
      }
      return [];
    }
    try {
      return JSON.parse(raw) as readonly Recommendation[];
    } catch {
      return [];
    }
  }

  public async getById(id: string): Promise<Recommendation | null> {
    return null;
  }

  public async saveMany(recommendations: readonly Recommendation[]): Promise<void> {
    if (recommendations.length === 0) return;
    const projectId = recommendations[0].projectId;
    localStorage.setItem(`${RECOMMENDATIONS_PREFIX}${projectId}`, JSON.stringify(recommendations));
  }

  public async deleteByProjectId(projectId: string): Promise<void> {
    localStorage.removeItem(`${RECOMMENDATIONS_PREFIX}${projectId}`);
  }
}
