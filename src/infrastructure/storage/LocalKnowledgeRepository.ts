import { IKnowledgeRepository } from '../../application/ports/IKnowledgeRepository';
import { KnowledgeDatabase } from '../../domain/entities/Knowledge';
import { createConfidenceScore } from '../../domain/value-objects/ConfidenceScore';

const KNOWLEDGE_PREFIX = 'aicampaign_knowledge_';

export class LocalKnowledgeRepository implements IKnowledgeRepository {
  public async getByProjectId(projectId: string): Promise<KnowledgeDatabase | null> {
    const raw = localStorage.getItem(`${KNOWLEDGE_PREFIX}${projectId}`);
    if (!raw) {
      if (projectId === 'proj-acme-launch-2026') {
        // Provide rich, structured seed knowledge database for the foundational workspace
        const seedKnowledge: KnowledgeDatabase = {
          id: `kb-${projectId}`,
          projectId,
          videoId: 'vid-keynote-4k.mp4',
          analyzedAt: '2026-09-26T09:40:00.000Z',
          modelIdentifier: 'Local Faster-Whisper + Clean Domain Extractor',
          transcripts: [
            {
              id: 'tr-1',
              range: { startSeconds: 0.0, endSeconds: 28.5 },
              text: 'Legacy video editing has hit a wall. Teams spend 14 hours per week chopping timelines instead of strategizing campaign angles. We built an AI engine that understands narrative structure from day zero.',
              speaker: 'Sarah Lin (Chief Product Officer)',
              words: [],
            },
            {
              id: 'tr-2',
              range: { startSeconds: 28.5, endSeconds: 65.0 },
              text: 'Instead of having a video editor watch a 45-minute recording three times, our local knowledge extractor decomposes speech into hooks, core problems, validation evidence, and high-impact calls to action.',
              speaker: 'Sarah Lin (Chief Product Officer)',
              words: [],
            },
            {
              id: 'tr-3',
              range: { startSeconds: 65.0, endSeconds: 110.0 },
              text: 'Here is the kicker: All rendering happens locally on your Apple Silicon or NVIDIA GPU using FFmpeg. No massive 10GB video files ever leave your desktop. Everything stays offline and encrypted in your local project database.',
              speaker: 'Sarah Lin (Chief Product Officer)',
              words: [],
            },
          ],
          scenes: [
            {
              id: 'sc-1',
              range: { startSeconds: 0.0, endSeconds: 18.0 },
              visualSummary: 'Sarah Lin standing on main keynote stage with dark industrial background graphics.',
              keyAction: 'Opens presentation with industry pain metrics.',
              shotType: 'WIDE',
            },
            {
              id: 'sc-2',
              range: { startSeconds: 18.0, endSeconds: 65.0 },
              visualSummary: 'Split screen showcasing old timeline vs AI Campaign Understanding graph.',
              keyAction: 'Demonstrates 90% timeline compression.',
              shotType: 'MEDIUM',
            },
          ],
          hooks: [
            {
              id: 'hk-1',
              range: { startSeconds: 0.0, endSeconds: 12.0 },
              content: 'Legacy video editing has hit a wall: 14 hours wasted every week.',
              confidence: createConfidenceScore(0.96),
              sourceQuote: 'Legacy video editing has hit a wall. Teams spend 14 hours per week chopping timelines...',
              hookType: 'CONTRARIAN',
              retentionPotential: 'EXEMPLARY',
            },
            {
              id: 'hk-2',
              range: { startSeconds: 65.0, endSeconds: 78.0 },
              content: 'Never upload a 10GB video to the cloud again: 100% local GPU rendering.',
              confidence: createConfidenceScore(0.92),
              sourceQuote: 'Here is the kicker: All rendering happens locally on your Apple Silicon or NVIDIA GPU...',
              hookType: 'BOLD_CLAIM',
              retentionPotential: 'EXEMPLARY',
            },
          ],
          problems: [
            {
              id: 'pr-1',
              range: { startSeconds: 8.0, endSeconds: 28.0 },
              content: 'Manual timeline scrubbing consumes over 60% of creative campaign cycles.',
              confidence: createConfidenceScore(0.94),
              sourceQuote: 'Teams spend 14 hours per week chopping timelines instead of strategizing campaign angles.',
              painSeverity: 'CRITICAL',
            },
          ],
          solutions: [
            {
              id: 'sol-1',
              range: { startSeconds: 28.5, endSeconds: 58.0 },
              content: 'Single-pass offline knowledge extraction into deterministic short video recommendations.',
              confidence: createConfidenceScore(0.95),
              sourceQuote: 'Our local knowledge extractor decomposes speech into hooks, core problems, validation evidence...',
              mechanism: 'Offline semantic parsing + zero-cloud FFmpeg composition',
            },
          ],
          benefits: [
            {
              id: 'ben-1',
              range: { startSeconds: 38.0, endSeconds: 65.0 },
              content: '10x turnaround speed on campaign derivatives with zero cloud egress cost.',
              confidence: createConfidenceScore(0.91),
              sourceQuote: 'Transform 45-minute recordings into campaign-ready shorts without traditional timeline friction.',
              impactDimension: 'PRODUCTIVITY',
            },
          ],
          offers: [
            {
              id: 'off-1',
              range: { startSeconds: 95.0, endSeconds: 110.0 },
              content: 'Full offline local runtime desktop build with zero subscription telemetry.',
              confidence: createConfidenceScore(0.88),
              sourceQuote: 'Everything stays offline and encrypted in your local project database.',
              guarantee: 'Zero telemetry local database guarantee',
            },
          ],
          callsToAction: [
            {
              id: 'cta-1',
              range: { startSeconds: 105.0, endSeconds: 110.0 },
              content: 'Download the local desktop build and initialize your first project.',
              confidence: createConfidenceScore(0.89),
              sourceQuote: 'Download the desktop app today.',
              actionType: 'VISIT_URL',
            },
          ],
          evidence: [
            {
              id: 'ev-1',
              range: { startSeconds: 8.0, endSeconds: 16.0 },
              evidenceType: 'DATA_STATISTIC',
              statement: '14 hours per week lost to manual timeline scrubbing across marketing teams.',
              verifiability: 'CITED_METRIC',
            },
            {
              id: 'ev-2',
              range: { startSeconds: 70.0, endSeconds: 85.0 },
              evidenceType: 'DEMO',
              statement: 'FFmpeg hardware acceleration delivers sub-15 second 4K short export on Apple Silicon.',
              verifiability: 'DIRECT_DEMO',
            },
          ],
          reasons: [
            {
              id: 'rs-1',
              range: { startSeconds: 30.0, endSeconds: 45.0 },
              content: 'AI should only understand; algorithms compose and local FFmpeg renders.',
              confidence: createConfidenceScore(0.95),
              sourceQuote: 'Understand instead of traditional manual editing.',
            },
          ],
          emotions: [
            {
              id: 'em-1',
              range: { startSeconds: 0.0, endSeconds: 15.0 },
              primaryEmotion: 'FRUSTRATION',
              intensityScore: 0.85,
            },
            {
              id: 'em-2',
              range: { startSeconds: 65.0, endSeconds: 90.0 },
              primaryEmotion: 'RELIEF',
              intensityScore: 0.92,
            },
          ],
          keywords: [
            { keyword: 'Local First', occurrences: [12.4, 66.8, 92.1], relevanceScore: 0.98 },
            { keyword: 'Knowledge Database', occurrences: [34.0, 52.3], relevanceScore: 0.94 },
            { keyword: 'FFmpeg Render', occurrences: [71.5, 88.0], relevanceScore: 0.90 },
            { keyword: 'Campaign Angles', occurrences: [18.2, 44.1], relevanceScore: 0.89 },
          ],
        };
        this.save(seedKnowledge);
        return seedKnowledge;
      }
      return null;
    }
    try {
      return JSON.parse(raw) as KnowledgeDatabase;
    } catch {
      return null;
    }
  }

  public async save(knowledge: KnowledgeDatabase): Promise<void> {
    localStorage.setItem(`${KNOWLEDGE_PREFIX}${knowledge.projectId}`, JSON.stringify(knowledge));
  }

  public async deleteByProjectId(projectId: string): Promise<void> {
    localStorage.removeItem(`${KNOWLEDGE_PREFIX}${projectId}`);
  }
}
