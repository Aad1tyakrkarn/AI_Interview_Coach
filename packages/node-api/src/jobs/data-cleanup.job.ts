import { prisma } from '../config/database';
import { dataCleanupQueue } from './queue';
import { logger } from '../config/logger';
import { StorageService } from '../services/storage.service';

export interface DataCleanupJobData {
  type:
    | 'expired-sessions'
    | 'orphaned-files'
    | 'old-audit-logs'
    | 'gdpr-deletion'
    | 'old-snapshots'
    | 'expired-tokens'
    | 'abandoned-interviews';
  olderThanDays?: number;
  /** For abandoned-interviews — interviews idle this many hours get marked ABANDONED. */
  olderThanHours?: number;
  userId?: string;
}

dataCleanupQueue.process(async (data: DataCleanupJobData) => {
  logger.info('Processing data cleanup job', { type: data.type });

  switch (data.type) {
    case 'expired-sessions':
      await cleanupExpiredSessions();
      break;
    case 'orphaned-files':
      await cleanupOrphanedFiles();
      break;
    case 'old-audit-logs':
      await cleanupOldAuditLogs(data.olderThanDays || 90);
      break;
    case 'gdpr-deletion':
      if (data.userId) await processGDPRDeletion(data.userId);
      break;
    case 'old-snapshots':
      await cleanupOldSnapshots(data.olderThanDays || 7);
      break;
    case 'expired-tokens':
      await cleanupExpiredTokens();
      break;
    case 'abandoned-interviews':
      await markAbandonedInterviews(data.olderThanHours ?? 6);
      break;
    default:
      logger.warn(`Unknown cleanup type: ${data.type}`);
  }
});

async function cleanupExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  logger.info(`Cleaned up ${result.count} expired sessions`);
}

async function cleanupExpiredTokens() {
  const now = new Date();
  const [emailResults, passwordResults] = await Promise.all([
    prisma.emailVerification.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.passwordReset.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  logger.info(`Cleaned up ${emailResults.count} email tokens, ${passwordResults.count} password tokens`);
}

async function cleanupOldAuditLogs(olderThanDays: number) {
  const cutoff = new Date(Date.now() - olderThanDays * 86400000);
  const result = await prisma.auditLog.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
  logger.info(`Cleaned up ${result.count} audit logs older than ${olderThanDays} days`);
}

async function cleanupOldSnapshots(olderThanDays: number) {
  const cutoff = new Date(Date.now() - olderThanDays * 86400000);
  const result = await prisma.interviewSnapshot.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
  logger.info(`Cleaned up ${result.count} interview snapshots older than ${olderThanDays} days`);
}

async function cleanupOrphanedFiles() {
  // Find resumes with no corresponding user
  const orphanedResumes = await prisma.resume.findMany({
    where: { user: { isActive: false } },
    select: { id: true, fileUrl: true },
  });

  for (const resume of orphanedResumes) {
    if (resume.fileUrl) {
      const key = resume.fileUrl.replace('/uploads/', '');
      await StorageService.deleteFile(key).catch(() => {});
    }
  }
  logger.info(`Found ${orphanedResumes.length} orphaned files`);
}

async function processGDPRDeletion(userId: string) {
  logger.info(`Processing GDPR deletion for user ${userId}`);

  try {
    const interviewIds = (await prisma.interview.findMany({ where: { userId }, select: { id: true } })).map(i => i.id);

    // Delete user data in order (respecting foreign keys)
    await prisma.interviewSnapshot.deleteMany({ where: { interviewId: { in: interviewIds } } });
    await prisma.voiceAnalysis.deleteMany({ where: { interviewId: { in: interviewIds } } });
    await prisma.cameraAnalysis.deleteMany({ where: { interviewId: { in: interviewIds } } });
    await prisma.evaluation.deleteMany({ where: { interviewId: { in: interviewIds } } });
    await prisma.transcript.deleteMany({ where: { interviewId: { in: interviewIds } } });
    await prisma.report.deleteMany({ where: { userId } });
    await prisma.score.deleteMany({ where: { userId } });
    await prisma.interviewQuestion.deleteMany({ where: { interview: { userId } } });
    await prisma.interview.deleteMany({ where: { userId } });
    await prisma.resume.deleteMany({ where: { userId } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.gDPRConsent.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.emailVerification.deleteMany({ where: { userId } });
    await prisma.passwordReset.deleteMany({ where: { userId } });
    await prisma.userPreferences.deleteMany({ where: { userId } });
    await prisma.userProfile.deleteMany({ where: { userId } });

    // Anonymize user
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.com`,
        passwordHash: 'DELETED',
        firstName: 'Deleted',
        lastName: 'User',
        isActive: false,
        avatarUrl: null,
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    });

    logger.info(`GDPR deletion completed for user ${userId}`);
  } catch (error) {
    logger.error(`GDPR deletion failed for user ${userId}:`, error);
  }
}

/**
 * Mark stale IN_PROGRESS / PAUSED / CREATED interviews as EXPIRED (shown as
 * "Abandoned" in the UI) when the user has walked away without an explicit
 * "End" action for `olderThanHours`.
 *
 * Status semantics:
 *   • COMPLETED  — the user explicitly ended (auto timer or End button)
 *   • EXPIRED    — no explicit end; session left hanging → this job flips it
 *                  (frontend renders this as the "Abandoned" status)
 *
 * Detection policy per status:
 *   • IN_PROGRESS / PAUSED : `startedAt` older than threshold
 *   • CREATED              : `createdAt` older than threshold (never started)
 */
async function markAbandonedInterviews(olderThanHours: number) {
  const now = Date.now();
  const cutoff = new Date(now - olderThanHours * 3600_000);

  const inProgressResult = await prisma.interview.updateMany({
    where: {
      status: { in: ['IN_PROGRESS', 'PAUSED'] },
      startedAt: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  });

  // CREATED: user made a session but never started → also considered abandoned
  // after the same window.
  const createdResult = await prisma.interview.updateMany({
    where: {
      status: 'CREATED',
      createdAt: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  });

  const total = inProgressResult.count + createdResult.count;
  if (total > 0) {
    logger.info(
      `Marked ${total} interviews as ABANDONED ` +
      `(${inProgressResult.count} in-progress/paused, ${createdResult.count} never-started) ` +
      `idle > ${olderThanHours}h`,
    );
  }
}

// Schedule periodic cleanup (called from server startup)
export function scheduleCleanupJobs() {
  // Run every 6 hours
  setInterval(async () => {
    await dataCleanupQueue.add({ type: 'expired-sessions' });
    await dataCleanupQueue.add({ type: 'expired-tokens' });
    await dataCleanupQueue.add({ type: 'old-snapshots', olderThanDays: 7 });
  }, 6 * 60 * 60 * 1000);

  // Run hourly — catch stale interviews quickly so the UI stays accurate
  setInterval(async () => {
    await dataCleanupQueue.add({ type: 'abandoned-interviews', olderThanHours: 6 });
  }, 60 * 60 * 1000);

  // Run daily
  setInterval(async () => {
    await dataCleanupQueue.add({ type: 'old-audit-logs', olderThanDays: 90 });
    await dataCleanupQueue.add({ type: 'orphaned-files' });
  }, 24 * 60 * 60 * 1000);

  // Kick off one abandoned-interview sweep at boot so any sessions already
  // stale before the server restarted get cleaned up promptly.
  dataCleanupQueue.add({ type: 'abandoned-interviews', olderThanHours: 6 });

  logger.info('Data cleanup jobs scheduled (includes hourly abandoned-interview sweep)');
}
