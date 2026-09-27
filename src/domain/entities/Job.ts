import { JobStatus, JobType } from '../enums/JobStatus';

export interface Job {
  id: string;
  projectId: string;
  type: JobType;
  status: JobStatus;
  progressPct: number;
  currentStepMessage: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}
