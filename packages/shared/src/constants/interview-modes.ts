import { IInterviewConfig } from '../types/interview.types';
import { DifficultyLevel } from '../types/interview.types';

export const PRACTICE_MODE_CONFIG: Partial<IInterviewConfig> = {
  allowPause: true,
  allowSkip: true,
  showHints: true,
  maxPauses: 10,
  duration: 3600,
  questionCount: 10,
  difficulty: DifficultyLevel.MEDIUM,
};

export const SIMULATION_MODE_CONFIG: Partial<IInterviewConfig> = {
  allowPause: false,
  allowSkip: false,
  showHints: false,
  maxPauses: 0,
  duration: 2700,
  questionCount: 8,
  difficulty: DifficultyLevel.ADAPTIVE,
};

export const DEFAULT_INTERVIEW_DURATION = 3600; // seconds
export const MAX_INTERVIEW_DURATION = 7200; // seconds
export const MIN_QUESTION_COUNT = 3;
export const MAX_QUESTION_COUNT = 25;
export const DEFAULT_QUESTION_COUNT = 10;
