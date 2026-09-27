import { create } from 'zustand';
import { Job } from '../../domain/entities/Job';
import { JobStatus, JobType } from '../../domain/enums/JobStatus';
import { LocalJobQueue } from '../../infrastructure/queue/LocalJobQueue';

const queue = LocalJobQueue.getInstance();

interface JobQueueState {
  jobs: readonly Job[];
  activeWorkerCount: number;
  totalCompletedJobs: number;
  activeJobs: readonly Job[];
  
  // Actions
  initialize: () => void;
  enqueueJob: (projectId: string, type: JobType, payload?: Record<string, unknown>) => Promise<Job>;
  updateJob: (jobId: string, delta: Partial<Job>) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
}

export const useJobQueueStore = create<JobQueueState>((set, get) => ({
  jobs: [],
  activeWorkerCount: 1,
  totalCompletedJobs: 1,
  activeJobs: [],

  initialize: () => {
    queue.subscribe((_job) => {
      get().refreshJobs();
    });
    get().refreshJobs();
  },

  refreshJobs: async () => {
    const active = await queue.getActiveJobs();
    // Get all jobs from queue
    const all = await queue.getJobsByProject(''); // returns all
    set({
      jobs: all,
      activeJobs: active,
      totalCompletedJobs: all.filter((j) => j.status === JobStatus.COMPLETED).length,
    });
  },

  enqueueJob: async (projectId: string, type: JobType, payload: Record<string, unknown> = {}) => {
    const job = await queue.enqueue(projectId, type, payload);
    await get().refreshJobs();
    return job;
  },

  updateJob: async (jobId: string, delta: Partial<Job>) => {
    await queue.updateJob(jobId, delta);
    await get().refreshJobs();
  },

  cancelJob: async (jobId: string) => {
    await queue.cancel(jobId);
    await get().refreshJobs();
  },
}));
