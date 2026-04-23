import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { MLProxyService } from './ml-proxy.service';
import { logger } from '../config/logger';

export class CameraService {
  static async analyzeFrames(interviewId: string, questionIndex: number, frames: string[]) {
    try {
      // Send frames to ML service for analysis
      const result = await MLProxyService.post<any>('/ml/camera/analyze', {
        frames,
        interview_id: interviewId,
        question_index: questionIndex,
      });

      // Store results — ML returns fields like eye_contact_percentage, avg_posture_score, etc.
      const analysis = await prisma.cameraAnalysis.create({
        data: {
          interviewId,
          questionIndex,
          frames: { count: frames.length, timestamps: frames.map((_, i) => i * 0.5) } as any,
          aggregated: {
            eyeContactPercentage: result.eye_contact_percentage ?? 0,
            avgPostureScore: result.avg_posture_score ?? 0,
            dominantExpression: result.dominant_expression ?? 'neutral',
            avgTensionScore: result.avg_tension_score ?? 0,
            lightingQuality: result.lighting_quality ?? 'unknown',
            backgroundQuality: result.background_quality ?? 'acceptable',
            blinkRate: result.blink_rate ?? 0,
            faceDetected: result.face_detected ?? false,
            framesAnalyzed: result.frames_analyzed ?? 0,
          } as any,
        },
      });

      return analysis;
    } catch (error) {
      logger.error('Camera analysis failed:', error);
      // Store mock results on failure
      const analysis = await prisma.cameraAnalysis.create({
        data: {
          interviewId,
          questionIndex,
          frames: { count: frames.length } as any,
          aggregated: {
            eyeContactPercentage: 0,
            avgPostureScore: 0,
            dominantExpression: 'unknown',
            avgTensionScore: 0,
            lightingQuality: 'unknown',
            faceDetected: false,
            framesAnalyzed: 0,
            error: 'Analysis failed',
          } as any,
        },
      });
      return analysis;
    }
  }

  static async createAnalysis(data: {
    interviewId: string;
    questionIndex: number;
    aggregated: Record<string, unknown>;
  }) {
    return prisma.cameraAnalysis.create({
      data: {
        interviewId: data.interviewId,
        questionIndex: data.questionIndex,
        frames: {} as any,
        aggregated: data.aggregated as any,
      },
    });
  }

  static async getAnalysis(interviewId: string) {
    const analyses = await prisma.cameraAnalysis.findMany({
      where: { interviewId },
      orderBy: { questionIndex: 'asc' },
    });

    if (analyses.length === 0) {
      return { interviewId, analyses: [], summary: null };
    }

    // Build summary
    const aggregatedList = analyses.map(a => a.aggregated as any).filter(Boolean);
    const summary = {
      avgEyeContact: this.avg(aggregatedList.map((a: any) => a.eyeContactPercentage || 0)),
      avgPostureScore: this.avg(aggregatedList.map((a: any) => a.avgPostureScore || 0)),
      dominantExpression: this.mode(aggregatedList.map((a: any) => a.dominantExpression || 'neutral')),
      avgTensionScore: this.avg(aggregatedList.map((a: any) => a.avgTensionScore || 0)),
      overallLighting: this.mode(aggregatedList.map((a: any) => a.lightingQuality || 'unknown')),
      faceDetectionRate: this.avg(aggregatedList.map((a: any) => a.faceDetected ? 100 : 0)),
      totalFramesAnalyzed: aggregatedList.reduce((s: number, a: any) => s + (a.framesAnalyzed || 0), 0),
      questionsAnalyzed: analyses.length,
    };

    return { interviewId, analyses, summary };
  }

  static async submitConsent(userId: string, interviewId: string, granted: boolean, ipAddress?: string, userAgent?: string) {
    const consent = await prisma.gDPRConsent.create({
      data: {
        userId,
        consentType: 'camera',
        granted,
        ipAddress,
        userAgent,
      },
    });
    return { consentId: consent.id, granted: consent.granted, interviewId };
  }

  static async getConsent(interviewId: string) {
    // Get the most recent camera consent for this interview's user
    const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) throw new AppError('Interview not found', 404);

    const consent = await prisma.gDPRConsent.findFirst({
      where: { userId: interview.userId, consentType: 'camera' },
      orderBy: { createdAt: 'desc' },
    });

    return consent || { granted: false };
  }

  static async checkFrameQuality(frameB64: string) {
    try {
      const result = await MLProxyService.post<any>('/ml/camera/quality', { frame: frameB64 });
      return result;
    } catch {
      return { blur_score: 0, brightness: 0, face_detected: false, quality: 'unknown' };
    }
  }

  private static avg(nums: number[]): number {
    if (nums.length === 0) return 0;
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
  }

  private static mode(values: string[]): string {
    const counts: Record<string, number> = {};
    values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }
}
