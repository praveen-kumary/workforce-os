import { WorkforceQueue } from './queue-names';

export interface WorkerConfig {
  concurrency: number;
  lockDuration: number;
  maxStalledCount: number;
}

export const QUEUE_WORKER_CONFIG: Record<WorkforceQueue, WorkerConfig> = {
  [WorkforceQueue.HREvents]:      { concurrency: 5,  lockDuration: 30_000, maxStalledCount: 2 },
  [WorkforceQueue.ITEvents]:      { concurrency: 3,  lockDuration: 60_000, maxStalledCount: 3 },
  [WorkforceQueue.FinanceEvents]: { concurrency: 3,  lockDuration: 45_000, maxStalledCount: 2 },
  [WorkforceQueue.AuditEvents]:   { concurrency: 10, lockDuration: 15_000, maxStalledCount: 1 },
};
