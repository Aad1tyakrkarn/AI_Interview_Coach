/**
 * End-to-end smoke test for DELETE /interviews/:id.
 *
 * Creates a throwaway user, creates an interview in CREATED state,
 * deletes it, and verifies it's gone. Also verifies that completed
 * interviews cannot be deleted.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://localhost:4000/api/v1';

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const body = (await res.json()) as any;
  return body.accessToken || body.data?.accessToken;
}

async function main() {
  const email = `test-delete-${Date.now()}@example.com`;
  const password = 'Test1234!ABC';

  // Register + verify email
  await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, firstName: 'T', lastName: 'D' }),
  });
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });
  const token = await login(email, password);
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  console.log('✓ user ready');

  // Create a CREATED-status interview
  const createRes = await fetch(`${BASE}/interviews`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: 'To-be-deleted session',
      mode: 'PRACTICE',
      difficultyLevel: 'INTERMEDIATE',
      targetRole: 'Software Engineer',
      durationMinutes: 10,
      questionCount: 5,
    }),
  });
  if (!createRes.ok) throw new Error(`create failed: ${createRes.status} ${await createRes.text()}`);
  const createdInterview = (await createRes.json()) as any;
  const interviewId = createdInterview.id || createdInterview.data?.id;
  if (!interviewId) throw new Error(`no id in create response: ${JSON.stringify(createdInterview)}`);
  console.log(`✓ created interview ${interviewId}`);

  // DELETE it
  const delRes = await fetch(`${BASE}/interviews/${interviewId}`, {
    method: 'DELETE',
    headers: auth,
  });
  console.log(`DELETE status=${delRes.status}`);
  if (delRes.status !== 200) throw new Error(`expected 200, got ${delRes.status}: ${await delRes.text()}`);
  console.log('✓ interview deleted');

  // Verify — GET should now 404
  const getRes = await fetch(`${BASE}/interviews/${interviewId}`, { headers: auth });
  console.log(`GET after delete → ${getRes.status}`);
  if (getRes.status !== 404) throw new Error(`expected 404, got ${getRes.status}`);
  console.log('✓ gone from DB');

  // Try deleting a completed interview → should 400
  const completed = await prisma.interview.create({
    data: {
      userId: (await prisma.user.findUnique({ where: { email } }))!.id,
      title: 'Already finished',
      mode: 'PRACTICE',
      status: 'COMPLETED',
      difficultyLevel: 'INTERMEDIATE',
      totalQuestions: 0,
      currentQuestionIndex: 0,
    },
  });
  const delCompletedRes = await fetch(`${BASE}/interviews/${completed.id}`, {
    method: 'DELETE',
    headers: auth,
  });
  console.log(`DELETE completed → ${delCompletedRes.status}`);
  if (delCompletedRes.status !== 400) throw new Error(`expected 400, got ${delCompletedRes.status}`);
  console.log('✓ completed interview delete blocked');

  // Cleanup
  await prisma.user.delete({ where: { email } });
  console.log('\n=== ALL CHECKS PASSED ===');
}

main()
  .catch((e) => {
    console.error('\n✗ TEST FAILED:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
