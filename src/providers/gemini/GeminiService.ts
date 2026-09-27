import { GoogleGenAI } from '@google/genai';
import { 
  KnowledgeDatabase, 
  TranscriptSegment, 
  HookConcept, 
  ProblemConcept, 
  SolutionConcept, 
  BenefitConcept, 
  CTAConcept, 
  OfferConcept, 
  EmotionAnchor, 
  KeywordAnchor, 
  SceneSegment 
} from '../../domain/entities/Knowledge';
import { TryBuzzerMetadata } from '../../domain/entities/Project';
import { createConfidenceScore } from '../../domain/value-objects/ConfidenceScore';
import { createTimestampRange } from '../../domain/value-objects/TimestampRange';

export class GeminiService {
  public static async testKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: 'Google Gemini API Key tidak boleh kosong.' };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Ping test. Reply with word OK',
      });

      if (response.text) {
        return { success: true, message: 'Google Gemini API Key valid & terhubung live!' };
      }
      return { success: false, message: 'Tidak ada respon dari Gemini.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi ke Gemini gagal';
      return { success: false, message: `Error Gemini: ${msg}` };
    }
  }

  public static async extractCampaignKnowledge(
    apiKey: string,
    model: string = 'gemini-2.5-flash',
    projectId: string,
    campaignContext: {
      projectName: string;
      description: string;
      videoDurationSeconds: number;
      trybuzzer?: TryBuzzerMetadata;
      existingTranscripts?: readonly TranscriptSegment[];
    }
  ): Promise<{ knowledge: KnowledgeDatabase; rawResponse: string }> {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const brief = campaignContext.trybuzzer;
    const duration = campaignContext.videoDurationSeconds || 60;

    const transcriptExcerpt = campaignContext.existingTranscripts && campaignContext.existingTranscripts.length > 0
      ? campaignContext.existingTranscripts.map((t) => `[${(t?.range?.startSeconds ?? 0).toFixed(1)}s - ${(t?.range?.endSeconds ?? 0).toFixed(1)}s] ${t.speaker || 'Host'}: ${t.text}`).join('\n')
      : `Video Campaign "${campaignContext.projectName}". Total duration: ${duration.toFixed(0)}s. TikTok Bounty submission.`;

    const systemInstruction = `You are a world-class AI Video Campaign Strategist and TryBuzzer TikTok Bounty Specialist.
Analyze the video campaign and transcript to extract a complete 12-factor knowledge matrix for viral short-form editing.

MANDATORY RULES:
1. HOOK DURATION: Every hook MUST be STRICTLY between 0.0s and 7.0s (startSeconds: 0.0, endSeconds <= 7.0).
2. CLIP DURATION: Recommend clip lengths between 15s and 60s (TryBuzzer Rule C requires minimum 15s).
3. RETURN JSON ONLY: Match the exact schema with keys "summary", "hooks", "problems", "solutions", "benefits", "callsToAction", "emotions", "keywords", "sceneCuts".`;

    const prompt = `
CAMPAIGN CONTEXT:
- Name: ${campaignContext.projectName}
- Description: ${campaignContext.description}
- Video Total Duration: ${duration.toFixed(1)}s
${brief ? `- Brand Target: ${brief.brandName || 'Official Campaign'}
- Objective: ${brief.objectiveFocus || 'TikTok Conversion'}
- Required Hashtags: ${(brief.requiredHashtags || []).join(' ')}` : ''}

TRANSCRIPT:
${transcriptExcerpt}

Respond with a JSON object:
{
  "summary": "Brief 2-sentence summary",
  "hooks": [{ "id": "hk-gem-1", "content": "Viral hook opener text", "hookType": "CURIOSITY", "startSeconds": 0.0, "endSeconds": 6.5, "confidenceScore": 0.95 }],
  "problems": [{ "id": "prob-gem-1", "content": "Core customer pain", "startSeconds": 6.5, "endSeconds": 14.0, "confidenceScore": 0.92, "painSeverity": "CRITICAL" }],
  "solutions": [{ "id": "sol-gem-1", "content": "Product mechanism", "mechanism": "Active formula", "startSeconds": 14.0, "endSeconds": 24.0, "confidenceScore": 0.94 }],
  "benefits": [{ "id": "ben-gem-1", "content": "User benefit", "impactDimension": "EMOTIONAL", "startSeconds": 20.0, "endSeconds": 28.0, "confidenceScore": 0.91 }],
  "callsToAction": [{ "id": "cta-gem-1", "content": "Check keranjang kuning sekarang!", "actionType": "PURCHASE", "startSeconds": 24.0, "endSeconds": 28.5, "confidenceScore": 0.98 }],
  "emotions": [{ "id": "emo-gem-1", "primaryEmotion": "ASPIRATION", "startSeconds": 0.0, "endSeconds": 12.0, "intensityScore": 0.9 }],
  "keywords": ["cave", "parfum", "trybuzzer", "fyp"],
  "sceneCuts": [0.0, 6.8, 14.2, 22.0, 28.5]
}
`;

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const contentStr = response.text || '{}';
    const parsed = JSON.parse(contentStr);

    const hooks: readonly HookConcept[] = (parsed.hooks || []).map((h: any, idx: number) => {
      const start = Math.max(0, Number(h.startSeconds) || 0);
      const end = Math.min(7.0, Number(h.endSeconds) || 6.5);
      return {
        id: h.id || `hk-gem-${idx + 1}`,
        content: h.content || h.text || 'Gemini Opening Hook',
        sourceQuote: h.content || h.text || 'Gemini Opening Hook',
        hookType: (h.hookType as any) || 'CURIOSITY',
        retentionPotential: 'EXEMPLARY',
        range: createTimestampRange(start, Math.max(start + 1.0, end)),
        confidence: createConfidenceScore(h.confidenceScore || 0.96),
      };
    });

    const problems: readonly ProblemConcept[] = (parsed.problems || []).map((p: any, idx: number) => {
      const start = Number(p.startSeconds) || 6.5;
      const end = Number(p.endSeconds) || 14.0;
      return {
        id: p.id || `prob-gem-${idx + 1}`,
        content: p.content || p.statement || 'Pain point statement',
        sourceQuote: p.content || p.statement || 'Pain point statement',
        painSeverity: (p.painSeverity as any) || 'CRITICAL',
        range: createTimestampRange(start, end),
        confidence: createConfidenceScore(p.confidenceScore || 0.92),
      };
    });

    const solutions: readonly SolutionConcept[] = (parsed.solutions || []).map((s: any, idx: number) => {
      const start = Number(s.startSeconds) || 14.0;
      const end = Number(s.endSeconds) || 24.0;
      return {
        id: s.id || `sol-gem-${idx + 1}`,
        content: s.content || s.description || 'Solution mechanism',
        sourceQuote: s.content || s.description || 'Solution mechanism',
        mechanism: s.mechanism || 'Active formulation',
        range: createTimestampRange(start, end),
        confidence: createConfidenceScore(s.confidenceScore || 0.94),
      };
    });

    const benefits: readonly BenefitConcept[] = (parsed.benefits || []).map((b: any, idx: number) => {
      const start = Number(b.startSeconds) || 20.0;
      const end = Number(b.endSeconds) || 28.0;
      return {
        id: b.id || `ben-gem-${idx + 1}`,
        content: b.content || b.benefit || 'Key consumer benefit',
        sourceQuote: b.content || b.benefit || 'Key consumer benefit',
        impactDimension: (b.impactDimension as any) || 'EMOTIONAL',
        range: createTimestampRange(start, end),
        confidence: createConfidenceScore(b.confidenceScore || 0.91),
      };
    });

    const callsToAction: readonly CTAConcept[] = (parsed.callsToAction || []).map((c: any, idx: number) => {
      const start = Number(c.startSeconds) || 24.0;
      const end = Number(c.endSeconds) || 28.5;
      return {
        id: c.id || `cta-gem-${idx + 1}`,
        content: c.content || c.text || 'Check keranjang kuning sekarang!',
        sourceQuote: c.content || c.text || 'Check keranjang kuning sekarang!',
        actionType: (c.actionType as any) || 'PURCHASE',
        range: createTimestampRange(start, end),
        confidence: createConfidenceScore(c.confidenceScore || 0.98),
      };
    });

    const emotions: readonly EmotionAnchor[] = (parsed.emotions || []).map((e: any, idx: number) => {
      const start = Number(e.startSeconds) || 0.0;
      const end = Number(e.endSeconds) || 12.0;
      return {
        id: e.id || `emo-gem-${idx + 1}`,
        primaryEmotion: (e.primaryEmotion as any) || 'ASPIRATION',
        range: createTimestampRange(start, end),
        intensityScore: Number(e.intensityScore) || 0.9,
      };
    });

    const keywords: readonly KeywordAnchor[] = (parsed.keywords || ['gemini', 'trybuzzer', 'fyp', 'viral']).map((kw: string) => ({
      keyword: kw,
      occurrences: [0.0, 7.0, 15.0],
      relevanceScore: 0.95,
    }));

    const scenes: readonly SceneSegment[] = (parsed.sceneCuts || [0, 6.8, 14.5, 22.0, 28.5]).map((sec: number, idx: number, arr: number[]) => {
      const nextSec = arr[idx + 1] || duration;
      return {
        id: `sc-gem-${idx + 1}`,
        range: createTimestampRange(Number(sec), Number(nextSec)),
        visualSummary: `Cut transition #${idx + 1}`,
        keyAction: `Key action at ${Number(sec).toFixed(1)}s`,
        shotType: idx === 0 ? 'CLOSEUP' : 'MEDIUM',
      };
    });

    const offers: readonly OfferConcept[] = [
      {
        id: 'off-gem-1',
        content: brief?.brandName ? `Flash Sale Eksklusif ${brief.brandName}` : 'Flash Sale & Free Ongkir',
        sourceQuote: 'Flash Sale Diskon Spesial',
        guarantee: '100% Original Brand Guarantee',
        urgency: 'Terbatas Hari Ini',
        range: createTimestampRange(15.0, 26.0),
        confidence: createConfidenceScore(0.94),
      },
    ];

    const fallbackTranscripts: readonly TranscriptSegment[] = [
      {
        id: 'ts-gem-1',
        range: createTimestampRange(0.0, Math.min(6.8, duration)),
        text: hooks[0]?.content || 'Parfum ini wanginya beneran tahan seharian dan mewah banget!',
        speaker: 'Creator',
        words: [
          { word: 'Parfum', start: 0.0, end: 0.8, confidence: 0.98 },
          { word: 'ini', start: 0.9, end: 1.4, confidence: 0.95 },
          { word: 'wanginya', start: 1.5, end: 2.2, confidence: 0.97 },
          { word: 'mewah', start: 2.3, end: 3.0, confidence: 0.99 },
          { word: 'banget!', start: 3.1, end: 4.0, confidence: 0.96 },
        ],
      },
    ];

    const knowledge: KnowledgeDatabase = {
      id: `know-gem-${Date.now()}`,
      projectId,
      videoId: `vid-${projectId}`,
      modelIdentifier: `Google ${model} (Live API Integration)`,
      analyzedAt: new Date().toISOString(),
      transcripts: campaignContext.existingTranscripts && campaignContext.existingTranscripts.length > 0
        ? campaignContext.existingTranscripts
        : fallbackTranscripts,
      scenes,
      hooks,
      problems,
      solutions,
      benefits,
      offers,
      callsToAction,
      evidence: [],
      reasons: [],
      emotions,
      keywords,
    };

    return {
      knowledge,
      rawResponse: contentStr,
    };
  }

  public static async generateAgentScriptPrompt(
    apiKey: string,
    model: string,
    userQuery: string,
    context: string
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const systemInstruction = `You are an expert TikTok Bounty Video Director & Scriptwriter for TryBuzzer creators.
Rules:
- Hooks must be <= 7 seconds.
- Video clips must be >= 15 seconds.
- Provide crisp, high-converting copy formatted with clear emojis and bullet points.`;

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: `Context: ${context}\n\nUser Request: ${userQuery}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || 'Tidak ada balasan dari Google Gemini.';
  }
}
