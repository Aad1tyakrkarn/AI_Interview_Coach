export enum InterviewMode {
  PRACTICE = 'PRACTICE',
  SIMULATION = 'SIMULATION',
}

export enum InterviewStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  ADAPTIVE = 'ADAPTIVE',
}

export interface IInterviewConfig {
  duration: number;
  questionCount: number;
  difficulty: DifficultyLevel;
  jobRole: string;
  allowPause: boolean;
  allowSkip: boolean;
  showHints: boolean;
  maxPauses?: number;
}

export interface IInterview {
  id: string;
  userId: string;
  mode: InterviewMode;
  status: InterviewStatus;
  jobRole: string;
  difficulty: DifficultyLevel;
  config: IInterviewConfig;
  startedAt?: Date;
  endedAt?: Date;
  pausedDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInterviewQuestion {
  id: string;
  interviewId: string;
  questionId: string;
  orderIndex: number;
  answeredAt?: Date;
  skipped: boolean;
  hintUsed: boolean;
  timeTaken?: number;
}

export interface IInterviewSession {
  interviewId: string;
  currentQuestionIndex: number;
  answers: string[];
  startTime: Date;
  elapsedTime: number;
  pauseCount: number;
}
