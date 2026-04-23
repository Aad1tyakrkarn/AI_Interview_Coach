export enum EvaluationLabel {
  STRONG = 'STRONG',
  ACCEPTABLE = 'ACCEPTABLE',
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
}

export interface IFeatureImportance {
  feature: string;
  importance: number;
}

export interface ISHAPExplanation {
  featureImportances: IFeatureImportance[];
  baseValue: number;
  outputValue: number;
}

export interface IEvaluationMetrics {
  correctness: number;
  similarity: number;
  conceptsCovered: string[];
  conceptsMissed: string[];
  conceptCoverageRatio: number;
  resumeAlignmentScore: number;
  label: EvaluationLabel;
}

export interface IEvaluation {
  interviewId: string;
  questionId: string;
  questionIndex: number;
  answerText: string;
  metrics: IEvaluationMetrics;
  shapExplanation?: ISHAPExplanation;
  modelVersion: string;
  createdAt: Date;
}

export interface IModelVersion {
  id: string;
  modelName: string;
  version: string;
  accuracy?: number;
  isActive: boolean;
  deployedAt?: Date;
  createdAt: Date;
}
