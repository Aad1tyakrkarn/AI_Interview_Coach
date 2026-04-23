import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { ScoringService } from './scoring.service';
import { MLProxyService } from './ml-proxy.service';
import { EvaluationService } from './evaluation.service';

export class ReportService {
  /**
   * Generate or get report for an interview
   */
  static async getByInterviewId(interviewId: string) {
    // Check if report already exists
    let report = await prisma.report.findFirst({ where: { interviewId } });
    if (report) return this.formatReport(report);

    // Generate new report
    return this.generateReport(interviewId);
  }

  /**
   * Generate a comprehensive report
   */
  static async generateReport(interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { interviewQuestions: { include: { question: true }, orderBy: { questionIndex: 'asc' } } },
    });
    if (!interview) throw new AppError('Interview not found', 404);
    if (interview.status !== 'COMPLETED') throw new AppError('Interview not completed', 400);

    // Gather all data -- auto-calculate score if it doesn't exist yet
    let [score, evaluations, voiceAnalyses, cameraAnalyses] = await Promise.all([
      prisma.score.findUnique({ where: { interviewId } }),
      prisma.evaluation.findMany({ where: { interviewId }, orderBy: { questionIndex: 'asc' } }),
      prisma.voiceAnalysis.findMany({ where: { interviewId }, orderBy: { questionIndex: 'asc' } }),
      prisma.cameraAnalysis.findMany({ where: { interviewId }, orderBy: { questionIndex: 'asc' } }),
    ]);

    // Auto-evaluate unanswered questions that have no evaluation yet
    const answeredIQsForEval = interview.interviewQuestions.filter(iq => iq.answerText && !iq.skipped);
    for (const iq of answeredIQsForEval) {
      const existingEval = evaluations.find(e => e.questionIndex === iq.questionIndex);
      if (!existingEval) {
        try {
          const questionText = (iq as any).questionText || iq.question?.text || `Question ${iq.questionIndex + 1}`;
          const expectedTopics = iq.question?.tags as string[] || [];
          await EvaluationService.evaluateAnswer(
            interviewId,
            iq.questionIndex,
            questionText,
            iq.answerText!,
            expectedTopics,
            null,
            iq.questionId,
          );
        } catch (err) {
          logger.warn(`Auto-evaluation failed for question ${iq.questionIndex}:`, err);
        }
      }
    }

    // Re-fetch evaluations after auto-evaluation
    evaluations = await prisma.evaluation.findMany({ where: { interviewId }, orderBy: { questionIndex: 'asc' } });

    // Auto-calculate score if not yet computed
    if (!score) {
      try {
        score = await ScoringService.calculateScore(interviewId, interview.userId);
      } catch (err) {
        logger.warn('Auto-score calculation failed during report generation:', err);
      }
    }

    // Generate model answers for each question using Groq
    const modelAnswers: Record<number, string> = {};
    await Promise.all(
      interview.interviewQuestions.map(async (iq) => {
        const questionText = (iq as any).questionText || iq.question?.text || `Question ${iq.questionIndex + 1}`;
        modelAnswers[iq.questionIndex] = await this.generateModelAnswer(questionText, interview.targetRole || '');
      }),
    );

    // Build summary
    const breakdown = (score?.breakdown || {}) as Record<string, number>;
    const evalMetrics = evaluations.map(e => e.metrics as any);

    // Find strengths (top 3 dimensions)
    const dimensionScores = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    // Generate fallback strengths/weaknesses if no breakdown data
    const answeredIQs = interview.interviewQuestions.filter(q => q.answerText || (q as any).isAnswered);
    const strengths = dimensionScores.length > 0
      ? dimensionScores.slice(0, 3).map(([key, val]) => `${this.humanize(key)}: ${val}%`)
      : [
          answeredIQs.length > 0 ? `Completed ${answeredIQs.length} questions` : 'Attempted the interview',
          interview.durationMinutes ? `Maintained focus for ${interview.durationMinutes} minutes` : 'Started the session',
          'Engaged with the AI interviewer',
        ];

    // Find weaknesses (bottom 3 dimensions)
    const weaknesses = dimensionScores.length > 0
      ? dimensionScores.slice(-3).reverse().map(([key, val]) => `${this.humanize(key)}: ${val}% - needs improvement`)
      : [
          'Practice with more detailed answers',
          'Work on maintaining consistent eye contact',
          'Focus on reducing filler words',
        ];

    // Readiness prediction (0-100)
    const readiness = score ? Math.min(100, Math.round(score.overallScore * 1.1)) : 0;

    // Improvement plan
    const improvementPlan = this.generateImprovementPlan(breakdown, evalMetrics);

    // Question-wise feedback
    const questionFeedback = interview.interviewQuestions.map((iq, idx) => {
      const evaluation = evaluations.find(e => e.questionIndex === iq.questionIndex);
      const voice = voiceAnalyses.find(v => v.questionIndex === iq.questionIndex);
      const camera = cameraAnalyses.find(c => c.questionIndex === iq.questionIndex);
      const metrics = evaluation?.metrics as any;

      return {
        questionIndex: iq.questionIndex,
        questionText: (iq as any).questionText || iq.question?.text || `Question ${iq.questionIndex + 1}`,
        category: iq.question?.category || 'General',
        score: metrics ? Math.round((metrics.correctness || 0) * 100) : 0,
        label: metrics?.label || 'not_evaluated',
        feedback: metrics?.feedback || 'No evaluation available.',
        conceptsCovered: metrics?.concepts_covered || metrics?.conceptsCovered || [],
        conceptsMissed: metrics?.concepts_missed || metrics?.conceptsMissed || [],
        voiceMetrics: voice ? {
          speakingRate: (voice.metrics as any)?.speakingRate || 0,
          pauseCount: (voice.metrics as any)?.pauseCount || 0,
          fillerCount: (voice.metrics as any)?.totalFillerCount || 0,
          tone: (voice.metrics as any)?.tone || 'neutral',
        } : null,
        cameraMetrics: camera ? {
          eyeContact: (camera.aggregated as any)?.eyeContactPercentage || 0,
          posture: (camera.aggregated as any)?.avgPostureScore || 0,
          expression: (camera.aggregated as any)?.dominantExpression || 'neutral',
        } : null,
        answerText: iq.answerText || '',
        expectedAnswer: modelAnswers[iq.questionIndex] || iq.question?.expectedAnswer || null,
        timeTaken: iq.timeTakenSeconds || 0,
        skipped: iq.skipped,
      };
    });

    // Voice analysis summary
    const voiceMetricsList = voiceAnalyses.map(v => v.metrics as any);
    const voiceAnalysisSummary = {
      avgSpeakingRate: this.avg(voiceMetricsList.map(m => m?.speakingRate || 0)),
      avgPauseCount: this.avg(voiceMetricsList.map(m => m?.pauseCount || 0)),
      totalFillerWords: voiceMetricsList.reduce((s, m) => s + (m?.totalFillerCount || 0), 0),
      dominantTone: this.mode(voiceMetricsList.map(m => m?.tone || 'neutral')),
      topFillerWords: this.aggregateFillers(voiceMetricsList),
      speakingRateAssessment: this.assessSpeakingRate(this.avg(voiceMetricsList.map(m => m?.speakingRate || 0))),
    };

    // Practice recommendations
    const practiceRecommendations = this.generateRecommendations(breakdown, evalMetrics, voiceAnalysisSummary);

    // Store report
    const summary = {
      overallScore: score?.overallScore || 0,
      strengths,
      weaknesses,
      readinessPrediction: readiness,
      improvementPlan,
      interviewMode: interview.mode,
      difficulty: interview.difficultyLevel,
      duration: interview.durationMinutes || 0,
      totalQuestions: interview.totalQuestions,
      answeredQuestions: interview.interviewQuestions.filter(q => q.answerText || (q as any).isAnswered).length,
      skippedQuestions: interview.interviewQuestions.filter(q => q.skipped).length,
    };

    const report = await prisma.report.create({
      data: {
        interviewId,
        userId: interview.userId,
        summary: summary as any,
        questionFeedback: questionFeedback as any,
        voiceAnalysisSummary: voiceAnalysisSummary as any,
        practiceRecommendations: practiceRecommendations as any,
      },
    });

    return this.formatReport(report);
  }

  /**
   * Generate PDF report (returns HTML that can be converted to PDF client-side)
   */
  static async getPdf(interviewId: string) {
    const report = await this.getByInterviewId(interviewId);

    // Generate HTML report for PDF conversion
    const html = this.generatePdfHtml(report);

    return { html, interviewId, generatedAt: new Date().toISOString() };
  }

  /**
   * Get trends across multiple interviews
   */
  static async getTrends(userId: string, query: { period?: string; mode?: string }) {
    const where: any = { userId };

    // Time period filter
    const periodDays = query.period === 'week' ? 7 : query.period === 'month' ? 30 : query.period === 'year' ? 365 : 90;
    where.createdAt = { gte: new Date(Date.now() - periodDays * 86400000) };

    const scores = await prisma.score.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        interview: { select: { mode: true, difficultyLevel: true, completedAt: true, targetRole: true } },
      },
    });

    // Score trend over time
    const scoreTrend = scores.map(s => ({
      date: s.createdAt.toISOString().split('T')[0],
      score: s.overallScore,
      mode: s.interview.mode,
      difficulty: s.interview.difficultyLevel,
    }));

    // Dimension trends
    const dimensionTrends: Record<string, number[]> = {};
    scores.forEach(s => {
      const bd = s.breakdown as Record<string, number> | null;
      if (bd) {
        Object.entries(bd).forEach(([key, val]) => {
          if (!dimensionTrends[key]) dimensionTrends[key] = [];
          dimensionTrends[key].push(val);
        });
      }
    });

    const avgDimensions = Object.fromEntries(
      Object.entries(dimensionTrends).map(([key, vals]) => [key, Math.round(this.avg(vals))])
    );

    // Confidence trend
    const confidenceTrend = scores.map(s => ({
      date: s.createdAt.toISOString().split('T')[0],
      confidence: s.confidenceScore || 0,
    }));

    // Role-wise normalization
    const roleScores: Record<string, number[]> = {};
    scores.forEach(s => {
      const role = s.interview.targetRole || 'general';
      if (!roleScores[role]) roleScores[role] = [];
      roleScores[role].push(s.overallScore);
    });
    const normalizedByRole = Object.fromEntries(
      Object.entries(roleScores).map(([role, vals]) => [role, { avg: Math.round(this.avg(vals)), count: vals.length }])
    );

    return {
      scoreTrend,
      confidenceTrend,
      avgDimensions,
      normalizedByRole,
      totalInterviews: scores.length,
      overallAvg: Math.round(this.avg(scores.map(s => s.overallScore))),
      bestScore: Math.max(...scores.map(s => s.overallScore), 0),
      latestScore: scores.length > 0 ? scores[scores.length - 1].overallScore : 0,
    };
  }

  /**
   * Get readiness prediction
   */
  static async getReadiness(userId: string) {
    const recentScores = await prisma.score.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { interview: { select: { mode: true, difficultyLevel: true } } },
    });

    if (recentScores.length === 0) {
      return { readiness: 0, level: 'Not enough data', factors: [], recommendation: 'Complete at least one interview to get a readiness assessment.' };
    }

    const avgScore = this.avg(recentScores.map(s => s.overallScore));
    const trend = recentScores.length >= 3
      ? this.avg(recentScores.slice(0, 3).map(s => s.overallScore)) - this.avg(recentScores.slice(-3).map(s => s.overallScore))
      : 0;
    const consistency = 100 - this.stdDev(recentScores.map(s => s.overallScore)) * 2;
    const simulationScores = recentScores.filter(s => s.interview.mode !== 'PRACTICE');
    const simulationAvg = simulationScores.length > 0 ? this.avg(simulationScores.map(s => s.overallScore)) : avgScore * 0.8;

    const readiness = Math.round(Math.min(100, (avgScore * 0.4 + simulationAvg * 0.3 + consistency * 0.2 + Math.max(0, trend) * 0.1)));

    const level = readiness >= 80 ? 'Ready' : readiness >= 60 ? 'Almost Ready' : readiness >= 40 ? 'Needs Practice' : 'Not Ready';

    const factors = [
      { name: 'Average Score', value: Math.round(avgScore), impact: avgScore >= 70 ? 'positive' : 'negative' },
      { name: 'Score Trend', value: Math.round(trend), impact: trend > 0 ? 'positive' : 'negative' },
      { name: 'Consistency', value: Math.round(consistency), impact: consistency >= 70 ? 'positive' : 'negative' },
      { name: 'Simulation Performance', value: Math.round(simulationAvg), impact: simulationAvg >= 60 ? 'positive' : 'negative' },
      { name: 'Interviews Completed', value: recentScores.length, impact: recentScores.length >= 5 ? 'positive' : 'neutral' },
    ];

    return { readiness, level, factors, recommendation: this.getReadinessRecommendation(readiness, factors) };
  }

  /**
   * Get practice recommendations
   */
  static async getRecommendations(userId: string) {
    const recentScores = await prisma.score.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { interview: { select: { targetRole: true, difficultyLevel: true } } },
    });

    const recentEvaluations = await prisma.evaluation.findMany({
      where: { interviewId: { in: recentScores.map(s => s.interviewId) } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Find weak areas from breakdowns
    const allBreakdowns = recentScores.map(s => s.breakdown as Record<string, number>).filter(Boolean);
    const avgBreakdown: Record<string, number> = {};
    allBreakdowns.forEach(bd => {
      Object.entries(bd).forEach(([key, val]) => {
        if (!avgBreakdown[key]) avgBreakdown[key] = 0;
        avgBreakdown[key] += (val as number) / allBreakdowns.length;
      });
    });

    // Sort by weakest areas
    const weakAreas = Object.entries(avgBreakdown)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([area, score]) => ({
        area: this.humanize(area),
        currentScore: Math.round(score),
        targetScore: Math.min(100, Math.round(score + 20)),
        priority: score < 40 ? 'high' : score < 60 ? 'medium' : 'low',
        suggestion: this.getSuggestion(area, score),
      }));

    // Find missed concepts
    const missedConcepts: Record<string, number> = {};
    recentEvaluations.forEach(e => {
      const metrics = e.metrics as any;
      const missed = metrics?.concepts_missed || metrics?.conceptsMissed || [];
      missed.forEach((c: string) => { missedConcepts[c] = (missedConcepts[c] || 0) + 1; });
    });

    const topMissedConcepts = Object.entries(missedConcepts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([concept, count]) => ({ concept, missedCount: count }));

    // Next interview action plan
    const actionPlan = this.generateActionPlan(weakAreas, topMissedConcepts);

    return { weakAreas, topMissedConcepts, actionPlan, totalInterviewsAnalyzed: recentScores.length };
  }

  /**
   * Get report download history
   */
  static async getHistory(userId: string, query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { userId },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          interviewId: true,
          summary: true,
          pdfUrl: true,
          generatedAt: true,
        },
      }),
      prisma.report.count({ where: { userId } }),
    ]);

    return {
      data: reports.map(r => ({
        ...r,
        overallScore: (r.summary as any)?.overallScore || 0,
        mode: (r.summary as any)?.interviewMode || 'unknown',
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // -- Private helpers --

  /**
   * Generate an ideal model answer for a question by calling the Python ML service (Groq).
   */
  static async generateModelAnswer(question: string, role: string): Promise<string> {
    try {
      const result = await MLProxyService.post<{ model_answer: string }>('/ml/evaluate/model-answer', {
        question,
        role: role || 'software engineer',
      });
      return result.model_answer;
    } catch {
      return 'Model answer not available.';
    }
  }

  private static formatReport(report: any) {
    return {
      ...report,
      summary: report.summary || {},
      questionFeedback: report.questionFeedback || [],
      voiceAnalysisSummary: report.voiceAnalysisSummary || {},
      practiceRecommendations: report.practiceRecommendations || [],
    };
  }

  private static generateImprovementPlan(breakdown: Record<string, number>, evalMetrics: any[]) {
    const plan: Array<{ area: string; suggestion: string; priority: number }> = [];

    Object.entries(breakdown)
      .filter(([_, score]) => score < 70)
      .sort((a, b) => a[1] - b[1])
      .forEach(([area, score], idx) => {
        plan.push({
          area: this.humanize(area),
          suggestion: this.getSuggestion(area, score),
          priority: idx + 1,
        });
      });

    return plan.slice(0, 5);
  }

  private static generateRecommendations(breakdown: Record<string, number>, evalMetrics: any[], voiceSummary: any) {
    const recs: Array<{ topic: string; reason: string; suggestedQuestionIds: string[] }> = [];

    if ((breakdown.technicalAccuracy || 0) < 60) {
      recs.push({ topic: 'Technical Fundamentals', reason: 'Technical accuracy needs improvement', suggestedQuestionIds: [] });
    }
    if ((breakdown.communicationEffectiveness || 0) < 60) {
      recs.push({ topic: 'Communication Skills', reason: 'Structure and clarity of answers can be improved', suggestedQuestionIds: [] });
    }
    if (voiceSummary.totalFillerWords > 10) {
      recs.push({ topic: 'Speech Fluency', reason: `High filler word count (${voiceSummary.totalFillerWords})`, suggestedQuestionIds: [] });
    }
    if ((breakdown.eyeContact || 0) < 50) {
      recs.push({ topic: 'Eye Contact Practice', reason: 'Eye contact percentage is below average', suggestedQuestionIds: [] });
    }
    if ((breakdown.confidence || 0) < 50) {
      recs.push({ topic: 'Confidence Building', reason: 'Voice tone and body language suggest low confidence', suggestedQuestionIds: [] });
    }

    return recs;
  }

  private static generateActionPlan(weakAreas: any[], missedConcepts: any[]) {
    return [
      { step: 1, action: 'Focus on your weakest area', detail: weakAreas[0]?.suggestion || 'Review fundamentals' },
      { step: 2, action: 'Practice missed concepts', detail: `Review: ${missedConcepts.slice(0, 3).map(c => c.concept).join(', ') || 'N/A'}` },
      { step: 3, action: 'Do a timed practice session', detail: 'Complete a practice interview focusing on weak areas' },
      { step: 4, action: 'Try a simulation', detail: 'Take a mock interview to test under realistic conditions' },
      { step: 5, action: 'Review and compare', detail: 'Compare your scores with previous attempts' },
    ];
  }

  private static generatePdfHtml(report: any): string {
    const summary = report.summary || {};
    const feedback = report.questionFeedback || [];

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Interview Report</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
  h1 { color: #1a56db; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
  h2 { color: #374151; margin-top: 30px; }
  .score-box { background: #f0f7ff; border: 2px solid #1a56db; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
  .score-number { font-size: 48px; font-weight: bold; color: #1a56db; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  .strength { color: #059669; } .weakness { color: #dc2626; }
  .question { border-bottom: 1px solid #e5e7eb; padding: 16px 0; }
  .label { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
  .label-strong { background: #d1fae5; color: #059669; }
  .label-acceptable { background: #fef3c7; color: #d97706; }
  .label-needs_improvement { background: #fee2e2; color: #dc2626; }
  table { width: 100%; border-collapse: collapse; } th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
</style></head>
<body>
  <h1>Interview Performance Report</h1>
  <div class="score-box"><div class="score-number">${summary.overallScore || 0}</div><div>Overall Score</div></div>
  <div class="grid">
    <div class="card"><h3>Mode</h3><p>${summary.interviewMode || 'N/A'}</p></div>
    <div class="card"><h3>Duration</h3><p>${summary.duration || 0} min</p></div>
    <div class="card"><h3>Questions</h3><p>${summary.answeredQuestions || 0}/${summary.totalQuestions || 0}</p></div>
    <div class="card"><h3>Readiness</h3><p>${summary.readinessPrediction || 0}%</p></div>
  </div>
  <h2>Strengths</h2>
  <ul>${(summary.strengths || []).map((s: string) => '<li class="strength">' + s + '</li>').join('')}</ul>
  <h2>Areas for Improvement</h2>
  <ul>${(summary.weaknesses || []).map((w: string) => '<li class="weakness">' + w + '</li>').join('')}</ul>
  <h2>Question-by-Question Feedback</h2>
  ${feedback.map((q: any, i: number) => `
    <div class="question">
      <h3>Q${i + 1}: ${q.questionText}</h3>
      <span class="label label-${q.label}">${q.label}</span> Score: ${q.score}%
      <p>${q.feedback}</p>
    </div>
  `).join('')}
  <h2>Improvement Plan</h2>
  <ol>${(summary.improvementPlan || []).map((p: any) => '<li><strong>' + p.area + '</strong>: ' + p.suggestion + '</li>').join('')}</ol>
  <p style="text-align:center;color:#9ca3af;margin-top:40px;">Generated by Interview Prep Platform</p>
</body></html>`;
  }

  private static getReadinessRecommendation(readiness: number, factors: any[]): string {
    if (readiness >= 80) return 'You are well-prepared! Consider taking a simulation interview to fine-tune your skills.';
    if (readiness >= 60) return 'You are almost there. Focus on your weak areas and do 2-3 more practice sessions.';
    if (readiness >= 40) return 'Keep practicing. Pay special attention to the areas marked as negative in the factors above.';
    return 'More practice is needed. Start with easy-level practice interviews and gradually increase difficulty.';
  }

  private static getSuggestion(area: string, score: number): string {
    const suggestions: Record<string, string> = {
      technicalAccuracy: 'Review core concepts and practice explaining them clearly with examples.',
      communicationEffectiveness: 'Structure your answers using the STAR method. Practice being concise yet thorough.',
      eyeContact: 'Practice looking at the camera while speaking. Use the camera preview to monitor yourself.',
      posture: 'Sit upright with shoulders back. Check your posture in the camera preview before starting.',
      timeManagement: 'Aim for 2-3 minutes per answer. Practice with a timer visible.',
      confidence: 'Speak at a steady pace and avoid filler words. Record yourself and review.',
      completionRate: 'Try to answer all questions. Even partial answers are better than skipping.',
      resumeAlignment: 'Connect your answers to experiences from your resume when possible.',
      consistency: 'Maintain focus throughout the interview. Take brief pauses between questions.',
    };
    return suggestions[area] || `Work on improving your ${area.replace(/([A-Z])/g, ' $1').toLowerCase()} score.`;
  }

  private static humanize(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }

  private static assessSpeakingRate(rate: number): string {
    if (rate < 100) return 'Too slow - try to speak more naturally';
    if (rate < 130) return 'Slightly slow - good for complex topics';
    if (rate <= 160) return 'Ideal speaking rate';
    if (rate <= 190) return 'Slightly fast - consider slowing down';
    return 'Too fast - slow down for clarity';
  }

  private static aggregateFillers(voiceMetrics: any[]) {
    const fillerMap: Record<string, number> = {};
    voiceMetrics.forEach(m => {
      (m?.fillerWords || []).forEach((f: any) => {
        fillerMap[f.word] = (fillerMap[f.word] || 0) + f.count;
      });
    });
    return Object.entries(fillerMap).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }

  private static avg(nums: number[]): number {
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  }

  private static mode(values: string[]): string {
    const counts: Record<string, number> = {};
    values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }

  private static stdDev(nums: number[]): number {
    if (nums.length < 2) return 0;
    const mean = this.avg(nums);
    return Math.sqrt(nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length);
  }
}
