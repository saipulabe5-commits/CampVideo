import { Job } from '../../domain/entities/Job';
import { JobType } from '../../domain/enums/JobStatus';

export interface IJobQueue {
  enqueue(projectId: string, type: JobType, payload: Record<string, unknown>): Promise<Job>;
  updateJob(jobId: string, delta: Partial<Job>): Promise<void>;
  cancel(jobId: string): Promise<void>;
  getJobsByProject(projectId: string): Promise<readonly Job[]>;
  getActiveJobs(): Promise<readonly Job[]>;
  subscribe(listener: (job: Job) => void): () => void;
}
