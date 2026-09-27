import { KnowledgeDatabase } from '../../domain/entities/Knowledge';
import { VideoMedia } from '../../domain/entities/VideoMedia';

export interface AIProviderCapabilities {
  supportsVideoTokens: boolean;
  supportsLocalExecution: boolean;
  maxContextTokens: number;
}

export interface IAIProvider {
  readonly id: string;
  readonly name: string;
  readonly isLocal: boolean;
  getCapabilities(): AIProviderCapabilities;
  extractKnowledge(media: VideoMedia, transcriptText: string): Promise<KnowledgeDatabase>;
}
