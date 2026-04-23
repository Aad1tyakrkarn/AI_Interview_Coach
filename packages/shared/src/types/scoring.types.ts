export interface IScore {
  id: string;
  interviewId: string;
  overall: number;
  eyeContact: number;
  posture: number;
  timeManagement: number;
  confidence: number;
  completionRate: number;
  resumeAlignment: number;
  consistency: number;
  createdAt: Date;
}

export interface IScoreHistory {
  scores: IScore[];
  trend: string;
}

export interface IScoreComparison {
  interviewA: IScore;
  interviewB: IScore;
  differences: Record<string, number>;
}
