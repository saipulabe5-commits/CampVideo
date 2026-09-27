import { Recommendation } from '../../domain/entities/Recommendation';

export interface IRecommendationRepository {
  getByProjectId(projectId: string): Promise<readonly Recommendation[]>;
  getById(id: string): Promise<Recommendation | null>;
  saveMany(recommendations: readonly Recommendation[]): Promise<void>;
  deleteByProjectId(projectId: string): Promise<void>;
}
