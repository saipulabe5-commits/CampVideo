import { TimestampRange } from '../value-objects/TimestampRange';
import { ConfidenceScore } from '../value-objects/ConfidenceScore';

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptSegment {
  id: string;
  range: TimestampRange;
  text: string;
  speaker?: string;
  words: readonly TranscriptWord[];
}

export interface SceneSegment {
  id: string;
  range: TimestampRange;
  visualSummary: string;
  keyAction: string;
  shotType: 'WIDE' | 'MEDIUM' | 'CLOSEUP' | 'B_ROLL' | 'GRAPHIC';
}

export interface SemanticConcept {
  id: string;
  range: TimestampRange;
  content: string;
  confidence: ConfidenceScore;
  sourceQuote: string;
}

export interface HookConcept extends SemanticConcept {
  hookType: 'CURIOSITY' | 'CONTRARIAN' | 'PAIN_POINT' | 'BOLD_CLAIM' | 'STORY_OPENER';
  retentionPotential: 'HIGH' | 'EXEMPLARY';
}

export interface ProblemConcept extends SemanticConcept {
  painSeverity: 'HIGH' | 'CRITICAL' | 'MODERATE';
}

export interface SolutionConcept extends SemanticConcept {
  mechanism: string;
}

export interface BenefitConcept extends SemanticConcept {
  impactDimension: 'FINANCIAL' | 'PRODUCTIVITY' | 'STRATEGIC' | 'EMOTIONAL';
}

export interface OfferConcept extends SemanticConcept {
  guarantee?: string;
  urgency?: string;
}

export interface CTAConcept extends SemanticConcept {
  actionType: 'SUBSCRIBE' | 'REGISTER' | 'PURCHASE' | 'VISIT_URL' | 'COMMENT';
}

export interface EvidenceItem {
  id: string;
  range: TimestampRange;
  evidenceType: 'DATA_STATISTIC' | 'CASE_STUDY' | 'DEMO' | 'TESTIMONIAL' | 'EXPERT_QUOTE';
  statement: string;
  verifiability: 'DIRECT_DEMO' | 'CITED_METRIC' | 'ANECDOTE';
}

export interface EmotionAnchor {
  id: string;
  range: TimestampRange;
  primaryEmotion: 'URGENCY' | 'RELIEF' | 'ASPIRATION' | 'FRUSTRATION' | 'TRUST';
  intensityScore: number; // 0.0 to 1.0
}

export interface KeywordAnchor {
  keyword: string;
  occurrences: readonly number[]; // array of timestamp seconds
  relevanceScore: number;
}

export interface KnowledgeDatabase {
  id: string;
  projectId: string;
  videoId: string;
  analyzedAt: string;
  modelIdentifier: string;
  
  // Strict 12 Knowledge Components
  transcripts: readonly TranscriptSegment[];
  scenes: readonly SceneSegment[];
  hooks: readonly HookConcept[];
  problems: readonly ProblemConcept[];
  solutions: readonly SolutionConcept[];
  benefits: readonly BenefitConcept[];
  offers: readonly OfferConcept[];
  callsToAction: readonly CTAConcept[];
  evidence: readonly EvidenceItem[];
  reasons: readonly SemanticConcept[];
  emotions: readonly EmotionAnchor[];
  keywords: readonly KeywordAnchor[];
}
