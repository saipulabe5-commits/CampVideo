import { IJobQueue } from '../../application/ports/IJobQueue';
import { Job } from '../../domain/entities/Job';
import { JobStatus, JobType } from '../../domain/enums/JobStatus';

export class LocalJobQueue implements IJobQueue {
  private static instance: LocalJobQueue;
  private jobs: Job[] = [];
  private listeners: Array<(job: Job) => void> = [];

  private constructor() {
    // Initial completed setup job for display in status bar / queue telemetry
    this.jobs = [
      {
        id: 'job-init-0',
        projectId: 'proj-acme-launch-2026',
        type: JobType.EXTRACT_KNOWLEDGE,
        status: JobStatus.COMPLETED,
        progressPct: 100,
        currentStepMessage: 'Local Knowledge Extraction Completed (12 semantic structures indexed in SQLite)',
        createdAt: '2026-09-26T09:38:00.000Z',
        startedAt: '2026-09-26T09:38:02.000Z',
        completedAt: '2026-09-26T09:39:45.000Z',
      },
    ];
  }

  public static getInstance(): LocalJobQueue {
    if (!LocalJobQueue.instance) {
      LocalJobQueue.instance = new LocalJobQueue();
    }
    return LocalJobQueue.instance;
  }

  public async enqueue(projectId: string, type: JobType, _payload: Record<string, unknown>): Promise<Job> {
    const newJob: Job = {
      id: `job-${Date.now()}`,
      projectId,
      type,
      status: JobStatus.PENDING,
      progressPct: 0,
      currentStepMessage: 'Queued for background worker execution',
      createdAt: new Date().toISOString(),
    };
    this.jobs.unshift(newJob);
    this.notify(newJob);
    return newJob;
  }

  public async updateJob(jobId: string, delta: Partial<Job>): Promise<void> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      Object.assign(job, delta);
      this.notify(job);
    }
  }

  public async cancel(jobId: string): Promise<void> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job && job.status !== JobStatus.COMPLETED) {
      job.status = JobStatus.CANCELLED;
      job.currentStepMessage = 'Cancelled by user';
      this.notify(job);
    }
  }

  public async getJobsByProject(projectId: string): Promise<readonly Job[]> {
    if (!projectId) return this.jobs;
    return this.jobs.filter((j) => j.projectId === projectId);
  }

  public async getActiveJobs(): Promise<readonly Job[]> {
    return this.jobs.filter((j) => j.status === JobStatus.RUNNING || j.status === JobStatus.PENDING);
  }

  public subscribe(listener: (job: Job) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(job: Job): void {
    for (const listener of this.listeners) {
      listener(job);
    }
  }
}
