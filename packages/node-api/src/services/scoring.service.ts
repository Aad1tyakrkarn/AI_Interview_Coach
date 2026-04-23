import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';

interface ScoreBreakdown {
  eyeContact: number;
  posture: number;
  timeManagement: number;
  confidence: number;
  completionRate: number;
  resumeAlignment: number;
  consistency: number;
  technicalAccuracy: number;
  communicationEffectiveness: number;
}

export class ScoringService {
  /**
   * Calculate and store comprehensive score for an interview
   */
  static async calculateScore(interviewId: string, userId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { interviewQuestions: true },
    });
    if (!interview) throw new AppError('Interview not found', 404);

    // Allow scoring even if not yet COMPLETED (e.g. user clicks Calculate early)
    // but log a warning
    if (interview.status !== 'COMPLETED' && interview.status !== 'IN_PROGRESS') {
      // Still allow calculation for demo purposes
    }

    // Gather all analysis data
    const [evaluations, voiceAnalyses, cameraAnalyses] = await Promise.all([
      prisma.evaluation.findMany({ where: { interviewId }, orderBy: { questionIndex: 'asc' } }),
      prisma.voiceAnalysis.findMany({ where: { interviewId }, orderBy: { questionIndex: 'asc' } }),
      prisma.cameraAnalysis.findMany({ where: { interviewId }, orderBy: { questionIndex: 'asc' } }),
    ]);

    // Calculate individual dimension scores (0-100)
    const breakdown = this.calculateBreakdown(interview, evaluations, voiceAnalyses, cameraAnalyses);

    // Weighted overall score
    const weights = {
      technicalAccuracy: 0.25,
      communicationEffectiveness: 0.15,
      eyeContact: 0.10,
      posture: 0.05,
      timeManagement: 0.10,
      confidence: 0.10,
      completionRate: 0.10,
      resumeAlignment: 0.05,
      consistency: 0.10,
    };

    const overall = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + (breakdown[key as keyof ScoreBreakdown] || 0) * weight, 0
    );

    // Upsert score
    const score = await prisma.score.upsert({
      where: { interviewId },
      update: {
        overallScore: Math.round(overall),
        technicalScore: breakdown.technicalAccuracy,
        communicationScore: breakdown.communicationEffectiveness,
        problemSolvingScore: Math.round((breakdown.technicalAccuracy + breakdown.consistency) / 2),
        confidenceScore: breakdown.confidence,
        breakdown: breakdown as any,
      },
      create: {
        interviewId,
        userId,
        overallScore: Math.round(overall),
        technicalScore: breakdown.technicalAccuracy,
        communicationScore: breakdown.communicationEffectiveness,
        problemSolvingScore: Math.round((breakdown.technicalAccuracy + breakdown.consistency) / 2),
        confidenceScore: breakdown.confidence,
        breakdown: breakdown as any,
      },
    });

    return score;
  }

  /**
   * Get score for a specific interview with full breakdown
   */
  static async getByInterviewId(interviewId: string) {
    let score = await prisma.score.findUnique({ where: { interviewId } });

    if (!score) {
      // Try to calculate it
      const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
      if (!interview) throw new AppError('Interview not found', 404);
      // Allow scoring for COMPLETED and IN_PROGRESS (demo friendliness)
      if (interview.status !== 'COMPLETED' && interview.status !== 'IN_PROGRESS') {
        throw new AppError('Interview not yet started', 400);
      }
      score = await this.calculateScore(interviewId, interview.userId);
    }

    const breakdown = score.breakdown as ScoreBreakdown | null;

    return {
      ...score,
      breakdown,
      label: this.getScoreLabel(score.overallScore),
      dimensions: breakdown ? [
        { name: 'Technical Accuracy', score: breakdown.technicalAccuracy, weight: 25 },
        { name: 'Communication', score: breakdown.communicationEffectiveness, weight: 15 },
        { name: 'Eye Contact', score: breakdown.eyeContact, weight: 10 },
        { name: 'Posture', score: breakdown.posture, weight: 5 },
        { name: 'Time Management', score: breakdown.timeManagement, weight: 10 },
        { name: 'Confidence', score: breakdown.confidence, weight: 10 },
        { name: 'Completion Rate', score: breakdown.completionRate, weight: 10 },
        { name: 'Resume Alignment', score: breakdown.resumeAlignment, weight: 5 },
        { name: 'Consistency', score: breakdown.consistency, weight: 10 },
      ] : [],
    };
  }

  /**
   * Get score history for a user with trends
   */
  static async getHistory(userId: string, query: { page?: number; limit?: number; mode?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.mode) {
      where.interview = { mode: query.mode };
    }

    const [scores, total] = await Promise.all([
      prisma.score.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          interview: {
            select: { id: true, title: true, mode: true, difficultyLevel: true, completedAt: true, targetRole: true },
          },
        },
      }),
      prisma.score.count({ where }),
    ]);

    // Calculate trends
    const allScores = scores.map(s => s.overallScore);
    const recentScores = allScores.slice(0, 5);
    const olderScores = allScores.slice(5, 10);

    const avgRecent = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
    const avgOlder = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : avgRecent;
    const trend = avgRecent - avgOlder;

    return {
      data: scores,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        average: Math.round(allScores.reduce((a, b) => a + b, 0) / Math.max(allScores.length, 1)),
        best: Math.max(...allScores, 0),
        latest: allScores[0] || 0,
        trend: Math.round(trend),
        trendDirection: trend > 2 ? 'improving' : trend < -2 ? 'declining' : 'stable',
        totalInterviews: total,
      },
    };
  }

  /**
   * Compare scores between multiple interviews
   */
  static async getComparison(userId: string, interviewIds: string[]) {
    if (interviewIds.length < 2) {
      throw new AppError('At least 2 interview IDs required for comparison', 400);
    }

    const scores = await prisma.score.findMany({
      where: { interviewId: { in: interviewIds }, userId },
      include: {
        interview: {
          select: { id: true, title: true, mode: true, difficultyLevel: true, completedAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (scores.length < 2) {
      throw new AppError('Scores not found for the specified interviews', 404);
    }

    // Build comparison matrix
    const comparisons = scores.map(s => {
      const bd = s.breakdown as ScoreBreakdown | null;
      return {
        interviewId: s.interviewId,
        title: s.interview.title,
        mode: s.interview.mode,
        difficulty: s.interview.difficultyLevel,
        date: s.interview.completedAt,
        overall: s.overallScore,
        technical: s.technicalScore,
        communication: s.communicationScore,
        confidence: s.confidenceScore,
        breakdown: bd,
      };
    });

    // Calculate differences between first and last
    const first = comparisons[0];
    const last = comparisons[comparisons.length - 1];
    const differences = {
      overall: (last.overall || 0) - (first.overall || 0),
      technical: (last.technical || 0) - (first.technical || 0),
      communication: (last.communication || 0) - (first.communication || 0),
      confidence: (last.confidence || 0) - (first.confidence || 0),
    };

    return { comparisons, differences, improved: differences.overall > 0 };
  }

  // -- Helper methods --

  private static calculateBreakdown(
    interview: any, evaluations: any[], voiceAnalyses: any[], cameraAnalyses: any[]
  ): ScoreBreakdown {
    // Technical accuracy from evaluations
    const evalMetrics = evaluations.map(e => e.metrics as any).filter(Boolean);
    // If no ML evaluations exist, estimate technical accuracy from answer length/quality
    const answeredIQs = (interview.interviewQuestions || []).filter((q: any) => q.answerText);
    const technicalAccuracy = evalMetrics.length > 0
      ? Math.round(this.avg(evalMetrics.map(m => (m.correctness || 0) * 100)))
      : answeredIQs.length > 0
        ? Math.round(Math.min(80, 40 + this.avg(answeredIQs.map((q: any) => Math.min(40, (q.answerText?.length || 0) / 10)))))
        : 50;

    // Communication from evaluations + voice
    const commScores = evalMetrics.map(m => (m.communication_score || m.communicationScore || 0.5) * 100);
    const voiceMetrics = voiceAnalyses.map(v => v.metrics as any).filter(Boolean);
    const voiceCommScores = voiceMetrics.map(m => {
      const rate = m.speakingRate || 140;
      return rate >= 120 && rate <= 170 ? 80 : rate >= 100 && rate <= 190 ? 60 : 40;
    });
    const communicationEffectiveness = Math.round(this.avg([...commScores, ...voiceCommScores]) || 50);

    // Eye contact from camera
    const cameraAggs = cameraAnalyses.map(c => c.aggregated as any).filter(Boolean);
    const eyeContact = cameraAggs.length > 0
      ? Math.round(this.avg(cameraAggs.map(a => a.eyeContactPercentage || 0)))
      : 50;

    // Posture from camera
    const posture = cameraAggs.length > 0
      ? Math.round(this.avg(cameraAggs.map(a => (a.avgPostureScore || 0.5) * 100)))
      : 50;

    // Time management
    const totalQuestions = interview.totalQuestions || 1;
    const answeredQuestions = interview.interviewQuestions?.filter((q: any) => q.answerText)?.length || 0;
    const avgTimePerQuestion = interview.durationMinutes
      ? (interview.durationMinutes * 60) / Math.max(answeredQuestions, 1)
      : 120;
    const idealTime = 120; // 2 min per question
    const timeDeviation = Math.abs(avgTimePerQuestion - idealTime) / idealTime;
    const timeManagement = Math.round(Math.max(0, (1 - timeDeviation) * 100));

    // Confidence from voice + camera
    const voiceConfidence = voiceMetrics.length > 0
      ? this.avg(voiceMetrics.map(m => {
          const tone = m.tone || 'neutral';
          return tone === 'confident' ? 90 : tone === 'energetic' ? 80 : tone === 'neutral' ? 60 : 40;
        }))
      : 50;
    const cameraConfidence = cameraAggs.length > 0
      ? this.avg(cameraAggs.map(a => Math.max(0, (1 - (a.avgTensionScore || 0.3)) * 100)))
      : 50;
    const confidence = Math.round((voiceConfidence + cameraConfidence) / 2);

    // Completion rate
    const completionRate = Math.round((answeredQuestions / Math.max(totalQuestions, 1)) * 100);

    // Resume alignment from evaluations
    const alignmentScores = evalMetrics.map(m => (m.resume_alignment || m.resumeAlignment || 0) * 100);
    const resumeAlignment = alignmentScores.length > 0 ? Math.round(this.avg(alignmentScores)) : 50;

    // Consistency (std deviation of scores - lower deviation = more consistent)
    const questionScores = evalMetrics.map(m => (m.correctness || 0) * 100);
    const consistency = questionScores.length > 1
      ? Math.round(Math.max(0, 100 - this.stdDev(questionScores) * 2))
      : 50;

    return {
      eyeContact,
      posture,
      timeManagement,
      confidence,
      completionRate,
      resumeAlignment,
      consistency,
      technicalAccuracy,
      communicationEffectiveness,
    };
  }

  private static getScoreLabel(score: number): string {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Average';
    if (score >= 40) return 'Below Average';
    return 'Needs Improvement';
  }

  private static avg(nums: number[]): number {
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  private static stdDev(nums: number[]): number {
    if (nums.length < 2) return 0;
    const mean = this.avg(nums);
    const variance = nums.reduce((sum, n) => sum + (n - mean) ** 2, 0) / nums.length;
    return Math.sqrt(variance);
  }
}
