export enum PipelineStage {
  PROJECT = 'PROJECT',
  UPLOAD = 'UPLOAD',
  ANALYZE = 'ANALYZE',
  RECOMMEND = 'RECOMMEND',
  EDIT = 'EDIT',
  RENDER = 'RENDER',
  EXPORT = 'EXPORT',
}

export interface PipelineStageMeta {
  stage: PipelineStage;
  label: string;
  description: string;
  code: string;
  dnaCategory: 'UNDERSTAND' | 'RECOMMEND' | 'COMPOSE' | 'PRODUCE';
}

export const PIPELINE_STAGES: readonly PipelineStageMeta[] = [
  {
    stage: PipelineStage.PROJECT,
    label: 'Projects',
    description: 'Project workspace, recovery, and recent files',
    code: '01_PRJ',
    dnaCategory: 'UNDERSTAND',
  },
  {
    stage: PipelineStage.UPLOAD,
    label: 'Upload Video',
    description: 'Local video ingestion (MP4/MOV/MKV), playback preview, and metadata probe',
    code: '02_UPL',
    dnaCategory: 'UNDERSTAND',
  },
  {
    stage: PipelineStage.ANALYZE,
    label: 'AI Analyze',
    description: 'Knowledge extraction: Transcript, Hook, Problem, Solution, CTA, Emotion, Scene Cuts',
    code: '03_ANZ',
    dnaCategory: 'UNDERSTAND',
  },
  {
    stage: PipelineStage.RECOMMEND,
    label: 'AI Recommendation',
    description: '3 Campaign Angles: Performance, Storytelling, & Short Hook with Explainability',
    code: '04_REC',
    dnaCategory: 'RECOMMEND',
  },
  {
    stage: PipelineStage.EDIT,
    label: 'Review & Edit',
    description: 'Clip trimmer, subtitle typography, AI title generator, & thumbnail selector',
    code: '05_EDT',
    dnaCategory: 'COMPOSE',
  },
  {
    stage: PipelineStage.RENDER,
    label: 'Render',
    description: 'Local GPU FFmpeg engine: 9:16, 16:9, and 1:1 format framing',
    code: '06_RND',
    dnaCategory: 'PRODUCE',
  },
  {
    stage: PipelineStage.EXPORT,
    label: 'Export',
    description: 'Local artifact packaging: MP4, .srt subtitle, thumbnail, and analysis report',
    code: '07_EXP',
    dnaCategory: 'PRODUCE',
  },
] as const;
