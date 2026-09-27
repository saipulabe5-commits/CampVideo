import { IProjectRepository } from '../../application/ports/IProjectRepository';
import { Project, createProjectPaths } from '../../domain/entities/Project';
import { PipelineStage } from '../../domain/enums/PipelineStage';

const STORAGE_KEY = 'aicampaign_projects_v1';

export class LocalProjectRepository implements IProjectRepository {
  private getStorage(): Project[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as Project[];
    } catch {
      return [];
    }
  }

  private setStorage(projects: readonly Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  public async getAll(): Promise<readonly Project[]> {
    const list = this.getStorage();
    // Ensure only 1 demo project exists by removing obsolete second demo project if present
    const cleaned = list.filter((p) => p.id !== 'proj-founder-story-2026');
    if (cleaned.length !== list.length) {
      this.setStorage(cleaned);
    }

    if (cleaned.length === 0) {
      // Seed strictly 1 default initial campaign workspace if empty
      const isWin = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);
      const defaultRoot = isWin ? 'C:/workspace/HyperScale_Keynote' : '/Users/campaign/workspace/HyperScale_Keynote';

      const initial: Project = {
        id: 'proj-acme-launch-2026',
        name: 'HyperScale Product Keynote 2026',
        description: 'Comprehensive 42-minute executive campaign keynote and feature unveiling.',
        rootPath: defaultRoot,
        paths: createProjectPaths(defaultRoot),
        currentStage: PipelineStage.UPLOAD,
        sourceVideoId: 'vid-keynote-4k.mp4',
        videoFileName: 'HyperScale_Keynote_4K.mp4',
        videoDurationSeconds: 154.5,
        lastAutosavedAt: '2026-09-26T11:20:00.000Z',
        recoverySnapshots: [
          {
            timestamp: '2026-09-26T10:45:00.000Z',
            stage: PipelineStage.UPLOAD,
            description: 'Source video ingested and probed (1080x1920 60fps h264)',
          },
          {
            timestamp: '2026-09-26T11:10:00.000Z',
            stage: PipelineStage.ANALYZE,
            description: 'AI Knowledge analysis completed (12 semantic structures indexed)',
          },
        ],
        createdAt: '2026-09-24T14:30:00.000Z',
        updatedAt: '2026-09-26T11:20:00.000Z',
      };
      this.setStorage([initial]);
      return [initial];
    }
    return cleaned;
  }

  public async getById(id: string): Promise<Project | null> {
    const list = this.getStorage();
    const found = list.find((p) => p.id === id);
    return found || null;
  }

  public async save(project: Project): Promise<void> {
    const list = this.getStorage();
    const index = list.findIndex((p) => p.id === project.id);
    let next: Project[];
    if (index >= 0) {
      next = [...list];
      next[index] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      next = [project, ...list];
    }
    this.setStorage(next);
  }

  public async delete(id: string): Promise<void> {
    const list = this.getStorage();
    this.setStorage(list.filter((p) => p.id !== id));
  }

  public async updateStage(id: string, stage: PipelineStage): Promise<void> {
    const list = this.getStorage();
    const index = list.findIndex((p) => p.id === id);
    if (index >= 0) {
      const updated = {
        ...list[index],
        currentStage: stage,
        updatedAt: new Date().toISOString(),
      };
      const next = [...list];
      next[index] = updated;
      this.setStorage(next);
    }
  }
}
