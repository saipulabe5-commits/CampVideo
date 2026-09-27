import { Project } from '../../domain/entities/Project';

export interface IProjectRepository {
  getAll(): Promise<readonly Project[]>;
  getById(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
  updateStage(id: string, stage: Project['currentStage']): Promise<void>;
}
