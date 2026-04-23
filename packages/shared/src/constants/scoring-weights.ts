export const SCORING_WEIGHTS = {
  eyeContact: 0.15,
  posture: 0.10,
  timeManagement: 0.15,
  confidence: 0.15,
  answerQuality: 0.25,
  resumeAlignment: 0.10,
  consistency: 0.10,
} as const;

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;
export const PASSING_SCORE = 60;
export const EXCELLENT_SCORE = 85;

export const SCORE_LABELS = {
  EXCELLENT: { min: 85, max: 100, label: 'Excellent' },
  GOOD: { min: 70, max: 84, label: 'Good' },
  AVERAGE: { min: 55, max: 69, label: 'Average' },
  BELOW_AVERAGE: { min: 40, max: 54, label: 'Below Average' },
  POOR: { min: 0, max: 39, label: 'Needs Improvement' },
} as const;
