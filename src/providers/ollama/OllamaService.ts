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

export class OllamaService {
  private static defaultEndpoint = 'http://localhost:11434';

  public static async testConnection(endpoint?: string): Promise<{ success: boolean; models: string[]; message: string }> {
    const target = (endpoint && endpoint.trim()) ? endpoint.trim().replace(/\/+$/, '') : this.defaultEndpoint;
    try {
      const res = await fetch(`${target}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        return { success: false, models: [], message: `Ollama merespon dengan status HTTP ${res.status}` };
      }

      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name || m.model);
      return {
        success: true,
        models,
        message: models.length > 0 
          ? `Ollama Local aktif & terhubung! Ditemukan ${models.length} model (${models.slice(0, 3).join(', ')}...)`
          : 'Ollama Local aktif (belum ada model terunduh, ketik "ollama run llama3.3" di terminal)',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal';
      return { 
        success: false, 
        models: [], 
        message: `Gagal terhubung ke Ollama (${target}). Pastikan aplikasi Ollama sedang berjalan di komputer Anda.` 
      };
    }
  }

  public static async extractCampaignKnowledge(
    endpoint: string = 'http://localhost:11434',
    model: string = 'llama3.3',
    projectId: string,
    campaignContext: {
      projectName: string;
      description: string;
      videoDurationSeconds: number;
      trybuzzer?: TryBuzzerMetadata;
      existingTranscripts?: readonly TranscriptSegment[];
    }
  ): Promise<{ knowledge: KnowledgeDatabase; rawResponse: string }> {
    const target = (endpoint && endpoint.trim()) ? endpoint.trim().replace(/\/+$/, '') : this.defaultEndpoint;
    const brief = campaignContext.trybuzzer;
    const duration = campaignContext.videoDurationSeconds || 60;

    const transcriptExcerpt = campaignContext.existingTranscripts && campaignContext.existingTranscripts.length > 0
      ? campaignContext.existingTranscripts.map((t) => `[${(t?.range?.startSeconds ?? 0).toFixed(1)}s - ${(t?.range?.endSeconds ?? 0).toFixed(1)}s] ${t.speaker || 'Host'}: ${t.text}`).join('\n')
      : `Video Campaign "${campaignContext.projectName}". Total duration: ${duration.toFixed(0)}s.`;

    const systemPrompt = `You are a local AI Video Campaign Extraction Engine.
Analyze the video context and transcript to produce a 12-factor JSON knowledge matrix for short-form video editing.
CRITICAL RULES:
1. Hook duration must be strictly <= 7.0s (startSeconds: 0.0, endSeconds <= 7.0).
2. Clip duration must be between 15s and 60s.
3. Respond ONLY with valid JSON matching keys: summary, hooks, problems, solutions, benefits, callsToAction, emotions, keywords, sceneCuts.`;

    const userPrompt = `
CAMPAIGN CONTEXT:
- Name: ${campaignContext.projectName}
- Description: ${campaignContext.description}
- Video Duration: ${duration.toFixed(1)}s
${brief ? `- Brand: ${brief.brandName || 'Brand'}
- Objective: ${brief.objectiveFocus || 'Conversion'}
- Hashtags: ${(brief.requiredHashtags || []).join(' ')}` : ''}

TRANSCRIPT:
${transcriptExcerpt}

Return JSON with format:
{
  "summary": "Brief summary",
  "hooks": [{ "id": "hk-ol-1", "content": "Viral hook text", "hookType": "CURIOSITY", "startSeconds": 0.0, "endSeconds": 6.5, "confidenceScore": 0.94 }],
  "problems": [{ "id": "prob-ol-1", "content": "Pain point", "startSeconds": 6.5, "endSeconds": 14.0, "confidenceScore": 0.91, "painSeverity": "CRITICAL" }],
  "solutions": [{ "id": "sol-ol-1", "content": "Solution", "mechanism": "Active formula", "startSeconds": 14.0, "endSeconds": 24.0, "confidenceScore": 0.93 }],
  "benefits": [{ "id": "ben-ol-1", "content": "Benefit", "impactDimension": "EMOTIONAL", "startSeconds": 20.0, "endSeconds": 28.0, "confidenceScore": 0.9 }],
  "callsToAction": [{ "id": "cta-ol-1", "content": "Check keranjang kuning!", "actionType": "PURCHASE", "startSeconds": 24.0, "endSeconds": 28.5, "confidenceScore": 0.97 }],
  "emotions": [{ "id": "emo-ol-1", "primaryEmotion": "ASPIRATION", "startSeconds": 0.0, "endSeconds": 12.0, "intensityScore": 0.88 }],
  "keywords": ["cave", "parfum", "trybuzzer", "fyp"],
  "sceneCuts": [0.0, 6.8, 14.2, 22.0, 28.5]
}
`;

    const res = await fetch(`${target}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.3',
        format: 'json',
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        options: {
          temperature: 0.3,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    const contentStr = data.message?.content || '{}';
    const parsed = JSON.parse(contentStr);

    const hooks: readonly HookConcept[] = (parsed.hooks || []).map((h: any, idx: number) => {
      const start = Math.max(0, Number(h.startSeconds) || 0);
      const end = Math.min(7.0, Number(h.endSeconds) || 6.5);
      return {
        id: h.id || `hk-ol-${idx + 1}`,
        content: h.content || h.text || 'Ollama Local Viral Hook',
        sourceQuote: h.content || h.text || 'Ollama Local Viral Hook',
        hookType: (h.hookType as any) || 'CURIOSITY',
        retentionPotential: 'EXEMPLARY',
        range: createTimestampRange(start, Math.max(start + 1.0, end)),
        confidence: createConfidenceScore(h.confidenceScore || 0.94),
      };
    });

    const problems: readonly ProblemConcept[] = (parsed.problems || []).map((p: any, idx: number) => {
      const start = Number(p.startSeconds) || 6.5;
      const end = Number(p.endSeconds) || 14.0;
      return {
        id: p.id || `prob-ol-${idx + 1}`,
        content: p.content || p.statement || 'Identified customer pain point',
        sourceQuote: p.content || p.statement || 'Identified customer pain point',
        painSeverity: (p.painSeverity as any) || 'CRITICAL',
        range: createTimestampRange(start, end),
        confidence: createConfidenceScore(p.confidenceScore || 0.91),
      };
    });

    const solutions: readonly SolutionConcept[] = (parsed.solutions || []).map((s: any, idx: number) => {
      const start = Number(s.startSeconds) || 14.0;
      const end = Number(s.endSeconds) || 24.0;
      return {
        id: s.id || `sol-ol-${idx + 1}`,
        content: s.content || s.description || 'Brand solution mechanism',
        sourceQuote: s.content || s.description || 'Brand solution mechanism',
        mechanism: s.mechanism || 'Formula mechanism',
        range: createTimestampRange(start, end),
        confidence: createConfidenceScore(s.confidenceScore || 0.93),
      };
    });

    const benefits: readonly BenefitConcept[] = (parsed.benefits || []).map((b: any, idx: number) => {
      const start = Number(b.startSeconds) || 20.0;
      const end = Number(b.endSeconds) || 28.0;
      return {
        id: b.id || `ben-ol-${idx + 1}`,
        content: b.content || b.benefit || 'Consumer direct benefit',
        sourceQuote: b.content || b.benefit || 'Consumer direct benefit',
        impactDimension: (b.impactDimension as any) || 'EMOTIONAL',
        range: createTimestampRange(start, end),
        confidence: createConfidenceScore(b.confidenceScore || 0.9),
      };
    });

    const callsToAction: readonly CTAConcept[] = (parsed.callsToAction || []).map((c: any, idx: number) => {
      const start = Number(c.startSeconds) || 24.0;
      const end = Number(c.endSeconds) || 28.5;
      return {
        id: c.id || `cta-ol-${idx + 1}`,
        content: c.content || c.text || 'Check keranjang kuning sekarang!',
        sourceQuote: c.content || c.text || 'Check keranjang kuning sekarang!',
        actionType: (c.actionType as any) || 'PURCHASE',
        range: createTimestampRange(start, end),
        confidence: createConfidenceScore(c.confidenceScore || 0.97),
      };
    });

    const emotions: readonly EmotionAnchor[] = (parsed.emotions || []).map((e: any, idx: number) => {
      const start = Number(e.startSeconds) || 0.0;
      const end = Number(e.endSeconds) || 12.0;
      return {
        id: e.id || `emo-ol-${idx + 1}`,
        primaryEmotion: (e.primaryEmotion as any) || 'ASPIRATION',
        range: createTimestampRange(start, end),
        intensityScore: Number(e.intensityScore) || 0.88,
      };
    });

    const keywords: readonly KeywordAnchor[] = (parsed.keywords || ['ollama', 'trybuzzer', 'fyp', 'viral']).map((kw: string) => ({
      keyword: kw,
      occurrences: [0.0, 7.0, 15.0],
      relevanceScore: 0.95,
    }));

    const scenes: readonly SceneSegment[] = (parsed.sceneCuts || [0, 6.8, 14.5, 22.0, 28.5]).map((sec: number, idx: number, arr: number[]) => {
      const nextSec = arr[idx + 1] || duration;
      return {
        id: `sc-ol-${idx + 1}`,
        range: createTimestampRange(Number(sec), Number(nextSec)),
        visualSummary: `Scene cut at ${Number(sec).toFixed(1)}s`,
        keyAction: `Key action at ${Number(sec).toFixed(1)}s`,
        shotType: idx === 0 ? 'CLOSEUP' : 'MEDIUM',
      };
    });

    const offers: readonly OfferConcept[] = [
      {
        id: 'off-ol-1',
        content: brief?.brandName ? `Flash Sale ${brief.brandName}` : 'Flash Sale & Free Ongkir',
        sourceQuote: 'Flash Sale Diskon Spesial',
        guarantee: '100% Original',
        urgency: 'Terbatas Hari Ini',
        range: createTimestampRange(15.0, 26.0),
        confidence: createConfidenceScore(0.92),
      },
    ];

    const fallbackTranscripts: readonly TranscriptSegment[] = [
      {
        id: 'ts-ol-1',
        range: createTimestampRange(0.0, Math.min(6.8, duration)),
        text: hooks[0]?.content || 'Parfum ini wanginya beneran mewah dan semerbak banget!',
        speaker: 'Host',
        words: [
          { word: 'Parfum', start: 0.0, end: 0.8, confidence: 0.98 },
          { word: 'ini', start: 0.9, end: 1.4, confidence: 0.95 },
          { word: 'wanginya', start: 1.5, end: 2.2, confidence: 0.97 },
          { word: 'mewah', start: 2.3, end: 3.0, confidence: 0.99 },
        ],
      },
    ];

    const knowledge: KnowledgeDatabase = {
      id: `know-ol-${Date.now()}`,
      projectId,
      videoId: `vid-${projectId}`,
      modelIdentifier: `Ollama ${model} (100% Offline Local LLM)`,
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
    endpoint: string = 'http://localhost:11434',
    model: string = 'llama3.3',
    userQuery: string,
    context: string
  ): Promise<string> {
    const target = (endpoint && endpoint.trim()) ? endpoint.trim().replace(/\/+$/, '') : this.defaultEndpoint;
    const res = await fetch(`${target}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.3',
        stream: false,
        messages: [
          {
            role: 'system',
            content: `You are an expert TikTok Video Director & Scriptwriter running offline on Ollama.
Rules:
- Hooks must be <= 7 seconds.
- Video clips must be >= 15 seconds.
- Format responses cleanly with emojis and bullet points.`,
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nUser Request: ${userQuery}`,
          },
        ],
        options: {
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.message?.content || 'Tidak ada balasan dari Ollama.';
  }
}
