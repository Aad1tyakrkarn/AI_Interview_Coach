/**
 * One-time data cleanup: rename any interview titles that contain
 * "Serious Interview" (old wording) to "Mock Interview".
 *
 * Run once with:  npx ts-node scripts/rename-serious-titles.ts
 *
 * Safe to re-run — the SQL only matches titles that still contain the
 * old string.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find all candidates (case-insensitive match)
  const candidates = await prisma.interview.findMany({
    where: {
      title: { contains: 'Serious Interview', mode: 'insensitive' },
    },
    select: { id: true, title: true },
  });

  if (candidates.length === 0) {
    console.log('Nothing to rename. All interview titles are already clean.');
    return;
  }

  console.log(`Found ${candidates.length} interviews with legacy titles:`);
  for (const c of candidates) {
    const newTitle = c.title.replace(/Serious Interview/gi, 'Mock Interview');
    console.log(`  ${c.id.slice(0, 8)}…  "${c.title}"  →  "${newTitle}"`);
  }

  // Perform the renames in a single transaction
  await prisma.$transaction(
    candidates.map((c) =>
      prisma.interview.update({
        where: { id: c.id },
        data: { title: c.title.replace(/Serious Interview/gi, 'Mock Interview') },
      }),
    ),
  );

  console.log(`\n✓ Renamed ${candidates.length} interview titles.`);
}

main()
  .catch((err) => {
    console.error('✗ Rename failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
