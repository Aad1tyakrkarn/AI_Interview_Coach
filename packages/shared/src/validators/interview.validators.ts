import { z } from 'zod';
import { InterviewMode, DifficultyLevel } from '../types/interview.types';

export const interviewConfigSchema = z.object({
  duration: z.number().int().min(300).max(7200).optional(),
  questionCount: z.number().int().min(3).max(25).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  jobRole: z.string().min(1).max(100).optional(),
  allowPause: z.boolean().optional(),
  allowSkip: z.boolean().optional(),
  showHints: z.boolean().optional(),
  maxPauses: z.number().int().min(0).max(20).optional(),
});

export const createInterviewSchema = z.object({
  mode: z.nativeEnum(InterviewMode),
  jobRole: z.string().min(1, 'Job role is required').max(100),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  config: interviewConfigSchema.optional(),
});

export const updateInterviewSchema = z.object({
  status: z.enum(['PAUSED', 'COMPLETED', 'ABANDONED']).optional(),
  config: interviewConfigSchema.optional(),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
