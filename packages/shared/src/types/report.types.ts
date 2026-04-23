import { IVoiceMetrics } from './voice.types';
import { IAggregatedCameraMetrics } from './camera.types';

export interface IImprovementItem {
  area: string;
  suggestion: string;
  priority: number;
}

export interface IReportSummary {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  readinessPrediction: number;
  improvementPlan: IImprovementItem[];
}

export interface IQuestionFeedback {
  questionIndex: number;
  questionText: string;
  score: number;
  feedback: string;
  category: string;
  voiceMetrics?: IVoiceMetrics;
  cameraMetrics?: IAggregatedCameraMetrics;
}

export interface IPracticeRecommendation {
  topic: string;
  reason: string;
  suggestedQuestionIds: string[];
}

export interface IReport {
  interviewId: string;
  userId: string;
  summary: IReportSummary;
  questionFeedback: IQuestionFeedback[];
  voiceAnalysisSummary: string;
  practiceRecommendations: IPracticeRecommendation[];
  pdfUrl?: string;
  generatedAt: Date;
}
