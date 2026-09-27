import { Composition } from '../../domain/entities/Composition';

export interface ICompositionRepository {
  getByProjectId(projectId: string): Promise<readonly Composition[]>;
  getById(id: string): Promise<Composition | null>;
  save(composition: Composition): Promise<void>;
  delete(id: string): Promise<void>;
}
