import { emailQueue } from './queue';
import { logger } from '../config/logger';

export interface EmailJobData {
  type: 'verification' | 'password-reset' | 'welcome' | 'interview-completed' | 'report-ready' | 'generic';
  to: string;
  subject?: string;
  templateData: Record<string, unknown>;
}

emailQueue.process(async (data: EmailJobData) => {
  logger.info('Processing email job', { type: data.type, to: data.to });
  // TODO: Implement email sending logic
  throw new Error('Not implemented');
});
