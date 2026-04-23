import { reportGenerateQueue } from './queue';
import { logger } from '../config/logger';

export interface ReportGenerateJobData {
  interviewId: string;
  userId: string;
  includeVoiceAnalysis: boolean;
  includeCameraAnalysis: boolean;
}

reportGenerateQueue.process(async (data: ReportGenerateJobData) => {
  logger.info('Processing report generation job', { data });
  // TODO: Implement report generation logic
  throw new Error('Not implemented');
});
