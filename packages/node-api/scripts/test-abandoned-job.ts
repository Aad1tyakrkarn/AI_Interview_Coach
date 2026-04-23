/**
 * Smoke test for the abandoned-interview cleanup job.
 *
 * Creates 5 interviews in different states and ages, runs the cleanup queue
 * with a 6-hour threshold, and verifies each interview ends up in the
 * expected status.
 */
import { PrismaClient } from '@prisma/client';
import { dataCleanupQueue } from '../src/jobs/queue';
// Register the processor
import '../src/jobs/data-cleanup.job';

const prisma = new PrismaClient();

async function main() {
  const email = `test-abandoned-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: 'dummy',
      firstName: 'Test',
      lastName: 'User',
      emailVerified: true,
    },
  });
  console.log('✓ test user created');

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

  const [fresh, staleInProgress, stalePaused, staleCreated, freshCreated] = await Promise.all([
    // Freshly started, should stay IN_PROGRESS
    prisma.interview.create({
      data: {
        userId: user.id,
        title: 'Fresh session',
        mode: 'PRACTICE',
        status: 'IN_PROGRESS',
        difficultyLevel: 'INTERMEDIATE',
        startedAt: hoursAgo(1),
        totalQuestions: 0,
        currentQuestionIndex: 0,
      },
    }),
    // 10h old IN_PROGRESS → should become ABANDONED
    prisma.interview.create({
      data: {
        userId: user.id,
        title: 'Stale in-progress',
        mode: 'PRACTICE',
        status: 'IN_PROGRESS',
        difficultyLevel: 'INTERMEDIATE',
        startedAt: hoursAgo(10),
        totalQuestions: 0,
        currentQuestionIndex: 0,
      },
    }),
    // 8h old PAUSED → should become ABANDONED
    prisma.interview.create({
      data: {
        userId: user.id,
        title: 'Stale paused',
        mode: 'MOCK',
        status: 'PAUSED',
        difficultyLevel: 'INTERMEDIATE',
        startedAt: hoursAgo(8),
        totalQuestions: 0,
        currentQuestionIndex: 0,
      },
    }),
    // 12h old CREATED (never started) → should become ABANDONED
    prisma.interview.create({
      data: {
        userId: user.id,
        title: 'Stale created',
        mode: 'PRACTICE',
        status: 'CREATED',
        difficultyLevel: 'INTERMEDIATE',
        totalQuestions: 0,
        currentQuestionIndex: 0,
        createdAt: hoursAgo(12),
      },
    }),
    // 2h old CREATED → should stay CREATED
    prisma.interview.create({
      data: {
        userId: user.id,
        title: 'Fresh created',
        mode: 'MOCK',
        status: 'CREATED',
        difficultyLevel: 'INTERMEDIATE',
        totalQuestions: 0,
        currentQuestionIndex: 0,
        createdAt: hoursAgo(2),
      },
    }),
  ]);
  console.log('✓ 5 test interviews created');

  // Run the job (threshold 6h). The queue dispatches the processor
  // asynchronously; wait long enough for the Prisma pool to spin up and the
  // UPDATE to commit.
  await dataCleanupQueue.add({ type: 'abandoned-interviews', olderThanHours: 6 });
  await new Promise((r) => setTimeout(r, 3000));

  // Verify
  const ids = [fresh.id, staleInProgress.id, stalePaused.id, staleCreated.id, freshCreated.id];
  const after = await prisma.interview.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, status: true },
  });
  const byId = new Map(after.map((i) => [i.id, i.status]));

  const expectations: [string, string, string][] = [
    [fresh.id, 'IN_PROGRESS', 'fresh session should stay IN_PROGRESS'],
    [staleInProgress.id, 'EXPIRED', 'stale in-progress should become ABANDONED'],
    [stalePaused.id, 'EXPIRED', 'stale paused should become ABANDONED'],
    [staleCreated.id, 'EXPIRED', 'stale never-started should become ABANDONED'],
    [freshCreated.id, 'CREATED', 'fresh never-started should stay CREATED'],
  ];

  let pass = true;
  for (const [id, expected, label] of expectations) {
    const actual = byId.get(id);
    const ok = actual === expected;
    console.log(`${ok ? '✓' : '✗'} ${label} — got ${actual}`);
    if (!ok) pass = false;
  }

  // Cleanup
  await prisma.interview.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log('✓ cleaned up');

  if (!pass) {
    console.error('\n✗ TEST FAILED');
    process.exit(1);
  }
  console.log('\n=== ALL CHECKS PASSED ===');
}

main()
  .catch((e) => {
    console.error('\n✗ ERROR:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
