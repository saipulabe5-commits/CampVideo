import { KnowledgeDatabase } from '../entities/Knowledge';
import { Recommendation } from '../entities/Recommendation';
import { Project } from '../entities/Project';

export interface AnalysisReportData {
  projectName: string;
  projectId: string;
  generatedAt: string;
  sourceVideoId: string;
  summary: {
    totalHooks: number;
    totalProblems: number;
    totalSolutions: number;
    totalEvidence: number;
    totalRecommendations: number;
  };
  hook: {
    primaryHook: string;
    hookType: string;
    confidence: number;
    sourceQuote: string;
    timestamp: string;
  } | null;
  problem: {
    description: string;
    painSeverity: string;
    sourceQuote: string;
    timestamp: string;
  } | null;
  solution: {
    description: string;
    mechanism: string;
    sourceQuote: string;
    timestamp: string;
  } | null;
  benefit: {
    description: string;
    impactDimension: string;
    sourceQuote: string;
    timestamp: string;
  } | null;
  offer: {
    description: string;
    guarantee: string;
    timestamp: string;
  } | null;
  cta: {
    callToAction: string;
    actionType: string;
    timestamp: string;
  } | null;
  recommendations: readonly {
    title: string;
    recommendationType: string;
    duration: number;
    startTime: number;
    endTime: number;
    reason: string;
    evidence: string;
    confidence: number;
  }[];
}

export class AnalysisReportFormatter {
  public static build(
    project: Project,
    knowledge: KnowledgeDatabase | null,
    recommendations: readonly Recommendation[]
  ): AnalysisReportData {
    const primaryHook = knowledge?.hooks[0] ?? null;
    const primaryProblem = knowledge?.problems[0] ?? null;
    const primarySolution = knowledge?.solutions[0] ?? null;
    const primaryBenefit = knowledge?.benefits[0] ?? null;
    const primaryOffer = knowledge?.offers[0] ?? null;
    const primaryCta = knowledge?.callsToAction[0] ?? null;

    return {
      projectName: project.name,
      projectId: project.id,
      generatedAt: new Date().toISOString(),
      sourceVideoId: knowledge?.videoId || project.sourceVideoId || 'unknown_media',
      summary: {
        totalHooks: knowledge?.hooks.length ?? 0,
        totalProblems: knowledge?.problems.length ?? 0,
        totalSolutions: knowledge?.solutions.length ?? 0,
        totalEvidence: knowledge?.evidence.length ?? 0,
        totalRecommendations: recommendations.length,
      },
      hook: primaryHook
        ? {
            primaryHook: primaryHook.content,
            hookType: primaryHook.hookType,
            confidence: primaryHook.confidence?.value ?? 0,
            sourceQuote: primaryHook.sourceQuote,
            timestamp: primaryHook.range
              ? `${(primaryHook.range.startSeconds ?? 0).toFixed(1)}s - ${(primaryHook.range.endSeconds ?? 0).toFixed(1)}s`
              : '0.0s - 0.0s',
          }
        : null,
      problem: primaryProblem
        ? {
            description: primaryProblem.content,
            painSeverity: primaryProblem.painSeverity,
            sourceQuote: primaryProblem.sourceQuote,
            timestamp: primaryProblem.range
              ? `${(primaryProblem.range.startSeconds ?? 0).toFixed(1)}s - ${(primaryProblem.range.endSeconds ?? 0).toFixed(1)}s`
              : '0.0s - 0.0s',
          }
        : null,
      solution: primarySolution
        ? {
            description: primarySolution.content,
            mechanism: primarySolution.mechanism,
            sourceQuote: primarySolution.sourceQuote,
            timestamp: primarySolution.range
              ? `${(primarySolution.range.startSeconds ?? 0).toFixed(1)}s - ${(primarySolution.range.endSeconds ?? 0).toFixed(1)}s`
              : '0.0s - 0.0s',
          }
        : null,
      benefit: primaryBenefit
        ? {
            description: primaryBenefit.content,
            impactDimension: primaryBenefit.impactDimension,
            sourceQuote: primaryBenefit.sourceQuote,
            timestamp: primaryBenefit.range
              ? `${(primaryBenefit.range.startSeconds ?? 0).toFixed(1)}s - ${(primaryBenefit.range.endSeconds ?? 0).toFixed(1)}s`
              : '0.0s - 0.0s',
          }
        : null,
      offer: primaryOffer
        ? {
            description: primaryOffer.content,
            guarantee: primaryOffer.guarantee || 'None specified',
            timestamp: primaryOffer.range
              ? `${(primaryOffer.range.startSeconds ?? 0).toFixed(1)}s - ${(primaryOffer.range.endSeconds ?? 0).toFixed(1)}s`
              : '0.0s - 0.0s',
          }
        : null,
      cta: primaryCta
        ? {
            callToAction: primaryCta.content,
            actionType: primaryCta.actionType,
            timestamp: primaryCta.range
              ? `${(primaryCta.range.startSeconds ?? 0).toFixed(1)}s - ${(primaryCta.range.endSeconds ?? 0).toFixed(1)}s`
              : '0.0s - 0.0s',
          }
        : null,
      recommendations: recommendations.map((rec) => ({
        title: rec.title,
        recommendationType: rec.recommendationType,
        duration: rec.duration,
        startTime: rec.startTime,
        endTime: rec.endTime,
        reason: rec.reason,
        evidence: rec.evidence,
        confidence: rec.confidence.value,
      })),
    };
  }

  public static toJson(report: AnalysisReportData): string {
    return JSON.stringify(report, null, 2);
  }
}
