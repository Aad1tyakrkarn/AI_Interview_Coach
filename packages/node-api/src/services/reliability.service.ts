import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';

export class ReliabilityService {
  /**
   * Auto-save interview state
   */
  static async autosave(userId: string, data: {
    interviewId: string;
    sessionId?: string;
    state: Record<string, unknown>;
    currentQuestionIndex: number;
    answers: Array<Record<string, unknown>>;
  }) {
    // Verify ownership
    const interview = await prisma.interview.findFirst({
      where: { id: data.interviewId, userId },
    });
    if (!interview) throw new AppError('Interview not found', 404);
    if (interview.status === 'COMPLETED' || interview.status === 'CANCELLED') {
      throw new AppError('Cannot autosave completed interview', 400);
    }

    // Save to cache for fast access
    const cacheKey = `autosave:${data.interviewId}`;
    await cache.set(cacheKey, {
      ...data,
      userId,
      timestamp: new Date().toISOString(),
    }, 86400); // 24h TTL

    // Also persist to DB (less frequently - check if 30s since last save)
    const lastSnapshot = await prisma.interviewSnapshot.findFirst({
      where: { interviewId: data.interviewId },
      orderBy: { timestamp: 'desc' },
    });

    const shouldPersist = !lastSnapshot ||
      (Date.now() - lastSnapshot.timestamp.getTime() > 30000);

    if (shouldPersist) {
      await prisma.interviewSnapshot.create({
        data: {
          interviewId: data.interviewId,
          sessionId: data.sessionId,
          state: data.state as any,
          currentQuestionIndex: data.currentQuestionIndex,
          answers: data.answers as any,
        },
      });

      // Keep only last 10 snapshots per interview
      const snapshots = await prisma.interviewSnapshot.findMany({
        where: { interviewId: data.interviewId },
        orderBy: { timestamp: 'desc' },
        skip: 10,
        select: { id: true },
      });
      if (snapshots.length > 0) {
        await prisma.interviewSnapshot.deleteMany({
          where: { id: { in: snapshots.map(s => s.id) } },
        });
      }
    }

    return {
      saved: true,
      timestamp: new Date().toISOString(),
      persisted: shouldPersist,
    };
  }

  /**
   * Heartbeat to track active interview sessions
   */
  static async heartbeat(userId: string, data: {
    interviewId: string;
    clientTime: string;
  }) {
    const cacheKey = `heartbeat:${data.interviewId}`;
    const now = new Date();

    await cache.set(cacheKey, {
      userId,
      interviewId: data.interviewId,
      clientTime: data.clientTime,
      serverTime: now.toISOString(),
      lastPing: now.getTime(),
    }, 60); // 60s TTL - if no heartbeat in 60s, considered disconnected

    // Track active interview in cache
    await cache.set(`active:${data.interviewId}`, {
      userId,
      lastHeartbeat: now.toISOString(),
    }, 120);

    return {
      status: 'alive',
      serverTime: now.toISOString(),
      latency: data.clientTime ? Date.now() - new Date(data.clientTime).getTime() : null,
    };
  }

  /**
   * Get connection quality assessment
   */
  static async getConnectionQuality(userId: string) {
    // Return server-side assessment based on recent heartbeats
    // In a real app, this would analyze heartbeat intervals and latency
    return {
      status: 'good',
      serverTime: new Date().toISOString(),
      recommendations: [],
    };
  }

  /**
   * Restore a previous interview session from snapshot
   */
  static async restoreSession(userId: string, sessionId: string) {
    // First try cache
    const cacheKey = `autosave:${sessionId}`;
    const cached = await cache.get<any>(cacheKey);

    if (cached && cached.userId === userId) {
      return {
        source: 'cache',
        ...cached,
      };
    }

    // Fall back to DB snapshots - sessionId might be interviewId
    const snapshot = await prisma.interviewSnapshot.findFirst({
      where: {
        OR: [
          { sessionId },
          { interviewId: sessionId },
        ],
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!snapshot) {
      throw new AppError('No saved session found', 404);
    }

    // Verify the interview belongs to the user
    const interview = await prisma.interview.findFirst({
      where: { id: snapshot.interviewId, userId },
    });
    if (!interview) throw new AppError('Session not found', 404);

    return {
      source: 'database',
      interviewId: snapshot.interviewId,
      sessionId: snapshot.sessionId,
      state: snapshot.state,
      currentQuestionIndex: snapshot.currentQuestionIndex,
      answers: snapshot.answers,
      timestamp: snapshot.timestamp.toISOString(),
    };
  }

  /**
   * Check for any restorable sessions for a user
   */
  static async getRestorableSessions(userId: string) {
    // Find interviews that are IN_PROGRESS or PAUSED
    const activeInterviews = await prisma.interview.findMany({
      where: {
        userId,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        mode: true,
        status: true,
        currentQuestionIndex: true,
        totalQuestions: true,
        updatedAt: true,
      },
    });

    // Check for snapshots
    const sessions = await Promise.all(
      activeInterviews.map(async (interview) => {
        const snapshot = await prisma.interviewSnapshot.findFirst({
          where: { interviewId: interview.id },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true, currentQuestionIndex: true },
        });
        return {
          ...interview,
          lastSnapshot: snapshot?.timestamp || interview.updatedAt,
          snapshotQuestionIndex: snapshot?.currentQuestionIndex ?? interview.currentQuestionIndex,
        };
      })
    );

    return { sessions, count: sessions.length };
  }

  /**
   * Emergency export all interview data
   */
  static async emergencyExport(userId: string, interviewId: string) {
    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId },
      include: {
        interviewQuestions: { include: { question: true }, orderBy: { questionIndex: 'asc' } },
        scores: true,
      },
    });
    if (!interview) throw new AppError('Interview not found', 404);

    const [evaluations, voiceAnalyses, cameraAnalyses, transcripts, snapshots] = await Promise.all([
      prisma.evaluation.findMany({ where: { interviewId } }),
      prisma.voiceAnalysis.findMany({ where: { interviewId } }),
      prisma.cameraAnalysis.findMany({ where: { interviewId } }),
      prisma.transcript.findMany({ where: { interviewId } }),
      prisma.interviewSnapshot.findMany({ where: { interviewId }, orderBy: { timestamp: 'desc' }, take: 1 }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      interview,
      evaluations,
      voiceAnalyses,
      cameraAnalyses,
      transcripts,
      latestSnapshot: snapshots[0] || null,
    };
  }
}
