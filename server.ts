import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Increase JSON body limit to 100MB for base64 audio payloads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Health check endpoint for Cloud Run
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// API Status endpoint
app.get('/api/status', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  res.json({
    success: true,
    geminiConfigured: hasKey,
    model: 'gemini-3.8-flash',
  });
});

/**
 * POST /api/transcribe
 * Transcribes audio content verbatim using Google Gemini 3.8 Flash multimodal audio capabilities.
 */
app.post('/api/transcribe', async (req, res) => {
  const { audioBase64, mimeType = 'audio/wav', projectName = 'Video Campaign', duration = 0 } = req.body;

  if (!audioBase64 || typeof audioBase64 !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Data audio base64 diperlukan untuk transkripsi.',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY tidak terkonfigurasi di server environment.',
    });
  }

  try {
    const ai = new GoogleGenAI();
    const systemInstruction = `You are a professional audio transcriber and video editor.
Your job is to transcribe the speech in the provided audio file VERBATIM with accurate chronological timestamps.

STRICT ACCURACY RULES:
1. Listen carefully to what is ACTUALLY spoken in the audio.
2. Transcribe verbatim in the spoken language (e.g. Bahasa Indonesia, English, or mixed/slang).
3. Do NOT invent, assume, or hallucinate words. If there is background music or silence, only transcribe audible speech.
4. Segment the speech into natural, readable subtitle phrases of 3 to 7 words each (or 1.5 to 3.5 seconds per cue).
5. For each cue, provide precise "startSeconds" and "endSeconds" relative to the start of the audio file.
6. If the audio contains NO human speech (only silence, ambient noise, or pure instrumental music), return an empty array for "transcripts".

Output format MUST be strictly JSON matching this structure:
{
  "detectedLanguage": "id" | "en" | "other",
  "summary": "1-sentence summary of the spoken dialog",
  "hasSpeech": boolean,
  "transcripts": [
    {
      "id": "cue-1",
      "startSeconds": 0.0,
      "endSeconds": 2.5,
      "text": "Exact words spoken here",
      "speaker": "Speaker 1"
    }
  ]
}`;

    const promptText = `Please listen to this audio track from video "${projectName}" (approx duration: ${duration.toFixed(1)}s).
Transcribe every spoken line accurately into chronological subtitle cues. Return valid JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: audioBase64,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const responseText = response.text || '{}';
    let parsed: {
      detectedLanguage?: string;
      summary?: string;
      hasSpeech?: boolean;
      transcripts?: Array<{ id?: string; startSeconds: number; endSeconds: number; text: string; speaker?: string }>;
    };

    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Format respon transkripsi dari AI tidak valid.',
        raw: responseText,
      });
    }

    const rawCues = parsed.transcripts || [];
    const sanitizedCues = rawCues
      .filter((c) => c && typeof c.text === 'string' && c.text.trim().length > 0)
      .map((c, index) => {
        const start = Math.max(0, Number(c.startSeconds) || 0);
        const end = Math.max(start + 0.4, Number(c.endSeconds) || start + 2.0);
        return {
          id: c.id || `cue-ai-${index + 1}`,
          startSeconds: Number(start.toFixed(2)),
          endSeconds: Number(end.toFixed(2)),
          text: c.text.trim(),
          speaker: c.speaker || 'Speaker',
        };
      });

    return res.json({
      success: true,
      hasSpeech: parsed.hasSpeech !== false && sanitizedCues.length > 0,
      detectedLanguage: parsed.detectedLanguage || 'id',
      summary: parsed.summary || 'Transkripsi audio berhasil diproses.',
      transcripts: sanitizedCues,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memproses transkripsi audio dengan Gemini.';
    console.error('Gemini transcription API error:', err);
    return res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

/**
 * POST /api/analyze-campaign
 * Generates viral short-form campaign angles and knowledge strictly from actual transcripts.
 */
app.post('/api/analyze-campaign', async (req, res) => {
  const { projectName, transcripts, duration, brandName, objective } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY tidak terkonfigurasi di server environment.',
    });
  }

  try {
    const ai = new GoogleGenAI();
    const transcriptText = Array.isArray(transcripts) && transcripts.length > 0
      ? transcripts.map((t: { startSeconds: number; endSeconds: number; text: string }) => 
          `[${Number(t.startSeconds || 0).toFixed(1)}s - ${Number(t.endSeconds || 0).toFixed(1)}s]: ${t.text}`
        ).join('\n')
      : `Video duration: ${Number(duration || 60).toFixed(0)}s. No dialogue available.`;

    const systemInstruction = `You are an expert TikTok Bounty Campaign Analyst and Video Editor.
Analyze the provided speech transcript to identify:
1. High-retention Opening Hooks (MUST start <= 7.0s).
2. Key Problems/Pain Points raised.
3. Solutions/Product Benefits explained.
4. Call to Action moments.
5. Best clip recommendations (between 15s and 60s).

Output strictly JSON:
{
  "summary": "2-sentence summary",
  "hooks": [{ "id": "hk-1", "content": "Text of the hook", "startSeconds": 0.0, "endSeconds": 5.0, "confidence": 0.95 }],
  "problems": [{ "id": "prob-1", "content": "Pain point mentioned", "startSeconds": 5.0, "endSeconds": 12.0 }],
  "solutions": [{ "id": "sol-1", "content": "Solution described", "startSeconds": 12.0, "endSeconds": 22.0 }],
  "callsToAction": [{ "id": "cta-1", "content": "CTA spoken", "startSeconds": 22.0, "endSeconds": 28.0 }],
  "clipRecommendations": [
    {
      "id": "rec-1",
      "title": "Catchy Viral Title",
      "startTime": 0.0,
      "endTime": 25.0,
      "reason": "Why this clip works"
    }
  ]
}`;

    const prompt = `PROJECT: ${projectName || 'Campaign Video'}
BRAND: ${brandName || 'General'}
GOAL: ${objective || 'Conversion'}
AUDIO TRANSCRIPT:
${transcriptText}

Generate structured knowledge strictly based on the real spoken content above.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      analysis: parsed,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menganalisis video dengan Gemini.';
    console.error('Gemini analyze API error:', err);
    return res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

// Configure Vite middleware in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Application listening on http://0.0.0.0:${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
