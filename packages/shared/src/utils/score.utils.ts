import { SCORING_WEIGHTS, MIN_SCORE, MAX_SCORE, SCORE_LABELS } from '../constants/scoring-weights';

/**
 * Normalize a raw score to the 0-100 range.
 * @param score - The raw score
 * @param min - Minimum possible raw score (default: 0)
 * @param max - Maximum possible raw score (default: 100)
 * @returns Normalized score between 0 and 100
 */
export function normalizeScore(score: number, min: number = MIN_SCORE, max: number = MAX_SCORE): number {
  if (max === min) return 0;
  const normalized = ((score - min) / (max - min)) * 100;
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(normalized * 100) / 100));
}

/**
 * Calculate a weighted score from individual dimension scores.
 * @param scores - Object with dimension keys and their scores (0-100)
 * @returns Weighted overall score
 */
export function calculateWeightedScore(scores: Partial<Record<keyof typeof SCORING_WEIGHTS, number>>): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [dimension, weight] of Object.entries(SCORING_WEIGHTS)) {
    const score = scores[dimension as keyof typeof SCORING_WEIGHTS];
    if (score !== undefined) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Get a human-readable label for a numeric score.
 * @param score - The score (0-100)
 * @returns Label string
 */
export function getScoreLabel(score: number): string {
  for (const { min, max, label } of Object.values(SCORE_LABELS)) {
    if (score >= min && score <= max) {
      return label;
    }
  }
  return 'Unknown';
}
