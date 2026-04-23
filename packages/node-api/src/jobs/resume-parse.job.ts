import { resumeParseQueue } from './queue';
import { logger } from '../config/logger';

export interface ResumeParseJobData {
  resumeId: string;
  userId: string;
  fileUrl: string;
  mimeType: string;
}

resumeParseQueue.process(async (data: ResumeParseJobData) => {
  logger.info('Processing resume parse job', { data });
  // TODO: Implement resume parsing logic
  throw new Error('Not implemented');
});
