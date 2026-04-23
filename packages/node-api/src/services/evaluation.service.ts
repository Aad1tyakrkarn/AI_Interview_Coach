import { prisma } from '../config/database';
import { MLProxyService } from './ml-proxy.service';
import { logger } from '../config/logger';

interface MLEvalResult {
  correctness: number;
  similarity: number;
  concepts_covered: string[];
  concepts_missed: string[];
  concept_coverage_ratio: number;
  resume_alignment: number;
  label: string;
  feedback: string;
  confidence: number;
  communication_score: number;
  technical_score: number;
  completeness: number;
}

interface MLSHAPResult {
  shap_values: Record<string, number>;
  feature_importances: Array<{
    feature: string;
    importance: number;
    direction: string;
    value: number;
  }>;
  base_value: number;
}

interface ModelVersionRecord {
  id: string;
  name: string;
  version: string;
  description: string;
  createdAt: string;
}

// In-memory model version tracking (no Prisma model for this)
const modelVersions: ModelVersionRecord[] = [];

export class EvaluationService {
  /**
   * Evaluate an answer by calling the Python ML service and storing the result.
   */
  static async evaluateAnswer(
    interviewId: string,
    questionIndex: number,
    question: string,
    answer: string,
    expectedTopics: string[],
    resumeData?: Record<string, unknown> | null,
    questionId?: string | null,
  ): Promise<unknown> {
    // Call the Python ML evaluation endpoint
    const mlResult = await MLProxyService.post<MLEvalResult>('/ml/evaluate/answer', {
      question,
      answer,
      expected_topics: expectedTopics,
      resume_data: resumeData || null,
    });

    // Build metrics JSON
    const metrics = {
      correctness: mlResult.correctness,
      similarity: mlResult.similarity,
      concepts_covered: mlResult.concepts_covered,
      concepts_missed: mlResult.concepts_missed,
      concept_coverage_ratio: mlResult.concept_coverage_ratio,
      resume_alignment: mlResult.resume_alignment,
      label: mlResult.label,
      feedback: mlResult.feedback,
      confidence: mlResult.confidence,
      communication_score: mlResult.communication_score,
      technical_score: mlResult.technical_score,
      completeness: mlResult.completeness,
    };

    // Get SHAP explanation for the evaluation features
    let shapExplanation: MLSHAPResult | null = null;
    try {
      const features: Record<string, number> = {
        correctness: mlResult.correctness,
        similarity: mlResult.similarity,
        concept_coverage: mlResult.concept_coverage_ratio,
        communication: mlResult.communication_score,
        technical_depth: mlResult.technical_score,
        completeness: mlResult.completeness,
      };

      const overallScore =
        mlResult.correctness * 0.3 +
        mlResult.similarity * 0.2 +
        mlResult.concept_coverage_ratio * 0.2 +
        mlResult.communication_score * 0.15 +
        mlResult.technical_score * 0.15;

      shapExplanation = await MLProxyService.post<MLSHAPResult>('/ml/explain/shap', {
        features,
        prediction: overallScore,
      });
    } catch (error) {
      logger.warn('SHAP explanation failed, storing evaluation without it:', error);
    }

    // Store in the database
    const evaluation = await prisma.evaluation.create({
      data: {
        interviewId,
        questionId: questionId || null,
        questionIndex,
        answerText: answer,
        metrics: metrics as any,
        shapExplanation: shapExplanation as any,
        modelVersion: 'v1.0.0-tfidf-fallback',
      },
    });

    return {
      id: evaluation.id,
      interviewId: evaluation.interviewId,
      questionIndex: evaluation.questionIndex,
      metrics,
      shapExplanation,
      modelVersion: evaluation.modelVersion,
      createdAt: evaluation.createdAt,
    };
  }

  /**
   * Get all evaluations for an interview with summary statistics.
   */
  static async getByInterviewId(interviewId: string): Promise<unknown> {
    const evaluations = await prisma.evaluation.findMany({
      where: { interviewId },
      orderBy: { questionIndex: 'asc' },
    });

    if (evaluations.length === 0) {
      return { evaluations: [], summary: null };
    }

    // Compute summary statistics across all evaluations
    const metricsArray = evaluations.map((e) => e.metrics as Record<string, any>);

    const avgMetric = (key: string): number => {
      const values = metricsArray
        .map((m) => m[key])
        .filter((v) => typeof v === 'number');
      if (values.length === 0) return 0;
      return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000;
    };

    const labelCounts: Record<string, number> = {};
    for (const m of metricsArray) {
      const label = m.label || 'unknown';
      labelCounts[label] = (labelCounts[label] || 0) + 1;
    }

    const summary = {
      totalQuestions: evaluations.length,
      averageCorrectness: avgMetric('correctness'),
      averageSimilarity: avgMetric('similarity'),
      averageCommunication: avgMetric('communication_score'),
      averageTechnical: avgMetric('technical_score'),
      averageCompleteness: avgMetric('completeness'),
      averageCoverage: avgMetric('concept_coverage_ratio'),
      labelDistribution: labelCounts,
      overallLabel: EvaluationService.computeOverallLabel(labelCounts, evaluations.length),
    };

    return {
      evaluations: evaluations.map((e) => ({
        id: e.id,
        interviewId: e.interviewId,
        questionId: e.questionId,
        questionIndex: e.questionIndex,
        answerText: e.answerText,
        metrics: e.metrics,
        modelVersion: e.modelVersion,
        createdAt: e.createdAt,
      })),
      summary,
    };
  }

  /**
   * Get a single evaluation by interview and question ID.
   */
  static async getByQuestion(interviewId: string, questionId: string): Promise<unknown> {
    const evaluation = await prisma.evaluation.findFirst({
      where: { interviewId, questionId },
    });

    if (!evaluation) {
      return null;
    }

    return {
      id: evaluation.id,
      interviewId: evaluation.interviewId,
      questionId: evaluation.questionId,
      questionIndex: evaluation.questionIndex,
      answerText: evaluation.answerText,
      metrics: evaluation.metrics,
      shapExplanation: evaluation.shapExplanation,
      modelVersion: evaluation.modelVersion,
      createdAt: evaluation.createdAt,
    };
  }

  /**
   * Get SHAP explanations for all evaluations in an interview.
   */
  static async getExplainability(interviewId: string): Promise<unknown> {
    const evaluations = await prisma.evaluation.findMany({
      where: { interviewId },
      orderBy: { questionIndex: 'asc' },
    });

    const explanations = evaluations
      .filter((e) => e.shapExplanation !== null)
      .map((e) => ({
        evaluationId: e.id,
        questionIndex: e.questionIndex,
        questionId: e.questionId,
        shapExplanation: e.shapExplanation,
      }));

    // Compute aggregate feature importance across all evaluations
    const featureAccum: Record<string, { total: number; count: number }> = {};
    for (const e of evaluations) {
      const shap = e.shapExplanation as Record<string, any> | null;
      if (!shap || !shap.feature_importances) continue;
      for (const fi of shap.feature_importances) {
        if (!featureAccum[fi.feature]) {
          featureAccum[fi.feature] = { total: 0, count: 0 };
        }
        featureAccum[fi.feature].total += fi.importance;
        featureAccum[fi.feature].count += 1;
      }
    }

    const aggregateImportance = Object.entries(featureAccum)
      .map(([feature, { total, count }]) => ({
        feature,
        averageImportance: Math.round((total / count) * 10000) / 10000,
      }))
      .sort((a, b) => b.averageImportance - a.averageImportance);

    return {
      interviewId,
      explanations,
      aggregateFeatureImportance: aggregateImportance,
    };
  }

  /**
   * List all tracked model versions.
   */
  static async getModelVersions(): Promise<ModelVersionRecord[]> {
    return modelVersions;
  }

  /**
   * Track a new model version.
   */
  static async trackModelVersion(data: {
    name: string;
    version: string;
    description: string;
  }): Promise<ModelVersionRecord> {
    const record: ModelVersionRecord = {
      id: `mv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: data.name,
      version: data.version,
      description: data.description,
      createdAt: new Date().toISOString(),
    };
    modelVersions.push(record);
    return record;
  }

  /**
   * Determine overall label from label distribution.
   */
  private static computeOverallLabel(
    labelCounts: Record<string, number>,
    total: number,
  ): string {
    const strongRatio = (labelCounts['strong'] || 0) / total;
    const needsImprovementRatio = (labelCounts['needs_improvement'] || 0) / total;

    if (strongRatio >= 0.6) return 'strong';
    if (needsImprovementRatio >= 0.5) return 'needs_improvement';
    return 'acceptable';
  }
}
