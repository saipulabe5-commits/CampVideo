import { IAIProvider, AIProviderCapabilities } from '../../application/ports/IAIProvider';
import { ITranscriptionProvider, TranscriptionProgress } from '../../application/ports/ITranscriptionProvider';
import { VideoMedia } from '../../domain/entities/VideoMedia';
import { KnowledgeDatabase, TranscriptSegment } from '../../domain/entities/Knowledge';

export class LocalWhisperProvider implements ITranscriptionProvider {
  public readonly id = 'provider-whisper-local';
  public readonly name = 'Faster-Whisper Local (Apple Silicon / CUDA / CPU)';
  public readonly isOfflineReady = true;

  public async transcribe(
    _audioFilePath: string,
    _onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<readonly TranscriptSegment[]> {
    return [];
  }
}

export class GeminiAIProvider implements IAIProvider {
  public readonly id = 'provider-gemini';
  public readonly name = 'Gemini 2.5 Flash / Pro (Multimodal Semantic)';
  public readonly isLocal = false;

  public getCapabilities(): AIProviderCapabilities {
    return {
      supportsVideoTokens: true,
      supportsLocalExecution: false,
      maxContextTokens: 1000000,
    };
  }

  public async extractKnowledge(_media: VideoMedia, _transcriptText: string): Promise<KnowledgeDatabase> {
    throw new Error('AI extraction is handled by use case workers');
  }
}

export class OllamaAIProvider implements IAIProvider {
  public readonly id = 'provider-ollama';
  public readonly name = 'Ollama Local LLM (Llama 3 / Qwen 2.5 Offline)';
  public readonly isLocal = true;

  public getCapabilities(): AIProviderCapabilities {
    return {
      supportsVideoTokens: false,
      supportsLocalExecution: true,
      maxContextTokens: 128000,
    };
  }

  public async extractKnowledge(_media: VideoMedia, _transcriptText: string): Promise<KnowledgeDatabase> {
    throw new Error('AI extraction is handled by use case workers');
  }
}

export class ClaudeAIProvider implements IAIProvider {
  public readonly id = 'provider-claude';
  public readonly name = 'Claude 3.7 Sonnet (Anthropic)';
  public readonly isLocal = false;

  public getCapabilities(): AIProviderCapabilities {
    return {
      supportsVideoTokens: false,
      supportsLocalExecution: false,
      maxContextTokens: 200000,
    };
  }

  public async extractKnowledge(_media: VideoMedia, _transcriptText: string): Promise<KnowledgeDatabase> {
    throw new Error('AI extraction is handled by use case workers');
  }
}

export class OpenAIAIProvider implements IAIProvider {
  public readonly id = 'provider-openai';
  public readonly name = 'OpenAI GPT-4o (Vision & Audio Reasoning)';
  public readonly isLocal = false;

  public getCapabilities(): AIProviderCapabilities {
    return {
      supportsVideoTokens: true,
      supportsLocalExecution: false,
      maxContextTokens: 128000,
    };
  }

  public async extractKnowledge(_media: VideoMedia, _transcriptText: string): Promise<KnowledgeDatabase> {
    throw new Error('AI extraction is handled by use case workers');
  }
}

export class ProviderRegistry {
  private static aiProviders: Map<string, IAIProvider> = new Map<string, IAIProvider>([
    ['provider-gemini', new GeminiAIProvider()],
    ['provider-claude', new ClaudeAIProvider()],
    ['provider-openai', new OpenAIAIProvider()],
    ['provider-ollama', new OllamaAIProvider()],
  ]);

  private static transcriptionProviders: Map<string, ITranscriptionProvider> = new Map<string, ITranscriptionProvider>([
    ['provider-whisper-local', new LocalWhisperProvider()],
  ]);

  public static getAIProviders(): readonly IAIProvider[] {
    return Array.from(this.aiProviders.values());
  }

  public static getTranscriptionProviders(): readonly ITranscriptionProvider[] {
    return Array.from(this.transcriptionProviders.values());
  }

  public static getAIProvider(id: string): IAIProvider | undefined {
    return this.aiProviders.get(id);
  }
}
