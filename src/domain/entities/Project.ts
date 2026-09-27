import { PipelineStage } from '../enums/PipelineStage';

export interface ProjectPaths {
  projectDb: string;
  mediaDir: string;
  cacheDir: string;
  exportsDir: string;
  logsDir: string;
}

export interface ProjectSnapshot {
  timestamp: string;
  stage: PipelineStage;
  description: string;
}

export interface TryBuzzerMetadata {
  campaignKey?: 'cave_duo_bahlul' | 'wardah_skinverse' | 'kahf_fuji' | 'custom';
  brandName?: string;
  cpmRateIdr?: number;
  minViews?: number;
  maxViews?: number;
  requiredHashtags?: readonly string[];
  requiredMentions?: readonly string[];
  yellowCart?: 'Wajib' | 'Tidak Wajib';
  yellowCartLink?: string;
  hookMaxSeconds?: number;
  niche?: 'Product' | 'Beauty' | 'Entertainment' | 'General';
  objectiveFocus?: string;
  mandatoryCtaText?: string;
  verificationCode?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  rootPath: string;
  paths: ProjectPaths;
  currentStage: PipelineStage;
  sourceVideoId?: string;
  videoFileName?: string;
  videoDurationSeconds?: number;
  lastAutosavedAt?: string;
  recoverySnapshots?: readonly ProjectSnapshot[];
  trybuzzer?: TryBuzzerMetadata;
  createdAt: string;
  updatedAt: string;
}

export function createProjectPaths(rootPath: string): ProjectPaths {
  const normalized = rootPath.replace(/\\/g, '/').replace(/\/$/, '');
  return {
    projectDb: `${normalized}/project.db`,
    mediaDir: `${normalized}/media`,
    cacheDir: `${normalized}/cache`,
    exportsDir: `${normalized}/exports`,
    logsDir: `${normalized}/logs`,
  };
}
