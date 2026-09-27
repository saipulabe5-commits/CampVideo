import { KnowledgeDatabase } from '../../domain/entities/Knowledge';

export interface IKnowledgeRepository {
  getByProjectId(projectId: string): Promise<KnowledgeDatabase | null>;
  save(knowledge: KnowledgeDatabase): Promise<void>;
  deleteByProjectId(projectId: string): Promise<void>;
}
