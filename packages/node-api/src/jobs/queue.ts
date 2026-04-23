import { logger } from '../config/logger';

// NOTE(added): These job handlers are "in-process" and don't enforce runtime schemas.
// Using `unknown` here makes TS strict function parameter checks fail for each queue job.
type JobProcessor<T = any> = (data: T) => Promise<void>;

interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  createdAt: Date;
}

class SimpleJobQueue<T = any> {
  private name: string;
  private processor?: JobProcessor<T>;
  private jobCounter = 0;

  constructor(name: string) {
    this.name = name;
  }

  process(processor: JobProcessor<T>): void {
    this.processor = processor;
  }

  async add(data: T): Promise<Job<T>> {
    const job: Job<T> = {
      id: `${this.name}-${++this.jobCounter}`,
      name: this.name,
      data,
      createdAt: new Date(),
    };

    logger.info(`Job ${job.id} added to queue ${this.name}`);

    if (this.processor) {
      // Process asynchronously (non-blocking)
      this.processor(data).catch((error) => {
        logger.error(`Job ${job.id} in ${this.name} failed:`, error);
      });
    } else {
      logger.warn(`No processor registered for queue ${this.name}`);
    }

    return job;
  }
}

// Queue definitions
export const resumeParseQueue = new SimpleJobQueue('resume-parse');
export const reportGenerateQueue = new SimpleJobQueue('report-generate');
export const dataCleanupQueue = new SimpleJobQueue('data-cleanup');
export const emailQueue = new SimpleJobQueue('email');

export function initializeQueues(): void {
  logger.info('Job queues initialized (in-process mode)');
}
