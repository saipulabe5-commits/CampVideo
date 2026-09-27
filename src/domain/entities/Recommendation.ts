import { TimestampRange } from '../value-objects/TimestampRange';
import { ConfidenceScore } from '../value-objects/ConfidenceScore';

export type RecommendationType = 'Performance' | 'Storytelling' | 'Short Hook';

export type CampaignGoal = 
  | 'DIRECT_CONVERSION'
  | 'PROBLEM_AWARENESS'
  | 'VIRAL_DISRUPTION'
  | 'PROOF_AND_VALIDATION'
  | 'FEATURE_DEEP_DIVE';

export interface Recommendation {
  id: string;
  projectId: string;
  title: string;
  recommendationType: RecommendationType;
  campaignGoal: CampaignGoal;
  hookStrategy: string;
  startTime: number;
  endTime: number;
  duration: number;
  selectedRange: TimestampRange;
  
  // Mandatory Explainability contract
  reason: string;
  evidence: string;
  confidence: ConfidenceScore;
  
  // Knowledge Links (traceability back to knowledge entities)
  linkedHookId?: string;
  linkedProblemId?: string;
  linkedSolutionId?: string;
  linkedCtaId?: string;
  
  suggestedAspectRatio: '9:16' | '1:1' | '16:9';
  createdAt: string;
}
