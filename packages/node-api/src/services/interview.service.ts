import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';

interface ModeConfig {
  allowPause: boolean;
  allowSkip: boolean;
  showHints: boolean;
  maxPauses: number | null;
  pauseCount: number;
  skipCount: number;
  hintCount: number;
}

function getModeConfig(mode: string): ModeConfig {
  switch (mode) {
    case 'PRACTICE':
      // Practice Coach: real-time coaching on posture, voice, eye contact
      return {
        allowPause: true,
        allowSkip: true,
        showHints: true,
        maxPauses: null, // unlimited
        pauseCount: 0,
        skipCount: 0,
        hintCount: 0,
      };
    case 'MOCK':
      // Mock Interview: professional interview, silent evaluation, score+report at end
      return {
        allowPause: false,
        allowSkip: false,
        showHints: false,
        maxPauses: 0,
        pauseCount: 0,
        skipCount: 0,
        hintCount: 0,
      };
    case 'ASSESSMENT':
      // Backward compatibility — map ASSESSMENT to MOCK (Mock Interview) config
      return {
        allowPause: false,
        allowSkip: false,
        showHints: false,
        maxPauses: 0,
        pauseCount: 0,
        skipCount: 0,
        hintCount: 0,
      };
    default:
      throw new AppError(`Invalid interview mode: ${mode}`, 400);
  }
}

export class InterviewService {
  static async create(
    userId: string,
    data: {
      title: string;
      mode: string;
      difficultyLevel?: string;
      targetRole?: string;
      durationMinutes?: number;
      questionCount?: number;
      resumeId?: string;
    }
  ) {
    const { title, mode, targetRole, durationMinutes, questionCount = 10, resumeId } = data;

    // No difficulty filter — questions are fetched regardless of difficulty
    // Groq generates dynamic questions during the interview
    const whereClause: Record<string, unknown> = { isActive: true };

    // Fetch random questions matching criteria
    const totalAvailable = await prisma.question.count({ where: whereClause as any });

    // If no questions match, try without filters
    let finalWhere = whereClause;
    if (totalAvailable === 0) {
      finalWhere = { isActive: true };
    }
    const actualAvailable = totalAvailable || await prisma.question.count({ where: finalWhere as any });

    // If still no questions, create interview with 0 pre-loaded questions (dynamic Groq will generate them)
    const take = actualAvailable > 0 ? Math.min(questionCount, actualAvailable) : 0;

    // Use skip-based random selection
    const allMatchingIds = take > 0 ? await prisma.question.findMany({
      where: finalWhere as any,
      select: { id: true },
    }) : [];

    // Shuffle and pick
    const shuffled = allMatchingIds.sort(() => Math.random() - 0.5);
    const selectedIds = shuffled.slice(0, take).map((q) => q.id);

    const questions = await prisma.question.findMany({
      where: { id: { in: selectedIds } },
    });

    const modeConfig = getModeConfig(mode);

    // Create interview with questions in a transaction
    const interview = await prisma.$transaction(async (tx: any) => {
      const created = await tx.interview.create({
        data: {
          userId,
          title,
          mode: mode as any,
          difficultyLevel: 'INTERMEDIATE' as any,
          targetRole: targetRole || null,
          resumeId: resumeId || null,
          durationMinutes: durationMinutes ?? null,
          totalQuestions: questions.length,
          currentQuestionIndex: 0,
          metadata: modeConfig as any,
        },
      });

      // Create InterviewQuestion records
      const interviewQuestions = questions.map((q, index) => ({
        interviewId: created.id,
        questionId: q.id,
        questionIndex: index,
        skipped: false,
      }));

      for (const iq of interviewQuestions) {
        await tx.interviewQuestion.create({ data: iq });
      }

      return tx.interview.findUnique({
        where: { id: created.id },
        include: {
          interviewQuestions: {
            include: { question: true },
            orderBy: { questionIndex: 'asc' },
          },
        },
      });
    });

    return interview;
  }

  static async list(userId: string, query: Record<string, unknown>) {
    const { status, mode, page = 1, limit = 10 } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: Record<string, unknown> = { userId };
    if (status) {
      whereClause.status = status;
    }
    if (mode) {
      whereClause.mode = mode;
    }

    const [data, total] = await Promise.all([
      prisma.interview.findMany({
        where: whereClause as any,
        include: {
          scores: {
            select: { overallScore: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.interview.count({ where: whereClause as any }),
    ]);

    return {
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  static async getById(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        interviewQuestions: {
          include: { question: true },
          orderBy: { questionIndex: 'asc' },
        },
        scores: true,
      },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    return interview;
  }

  static async update(userId: string, interviewId: string, data: Record<string, unknown>) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to update this interview', 403);
    }
    if (interview.status !== 'CREATED') {
      throw new AppError('Can only update interviews with CREATED status', 400);
    }

    const allowedFields: Record<string, unknown> = {};
    if (data.title !== undefined) allowedFields.title = data.title;
    if (data.difficultyLevel !== undefined) allowedFields.difficultyLevel = data.difficultyLevel;
    if (data.targetRole !== undefined) allowedFields.targetRole = data.targetRole;

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: allowedFields as any,
    });

    return updated;
  }

  static async delete(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: { id: true, userId: true, status: true },
    });
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to delete this interview', 403);
    }
    // Protect completed interviews — their scores / reports are meaningful history.
    // Users can delete any non-completed session (created, in_progress, paused, abandoned).
    if (interview.status === 'COMPLETED') {
      throw new AppError(
        'Completed interviews cannot be deleted to preserve your history.',
        400,
      );
    }

    // Explicitly clean up child rows that may not have ON DELETE CASCADE set up
    // at the DB level, then delete the interview itself, all inside a transaction.
    await prisma.$transaction(async (tx: any) => {
      const where = { interviewId };
      await tx.interviewSnapshot.deleteMany({ where }).catch(() => undefined);
      await tx.voiceMetric?.deleteMany?.({ where }).catch(() => undefined);
      await tx.cameraMetric?.deleteMany?.({ where }).catch(() => undefined);
      await tx.answerAudio?.deleteMany?.({ where }).catch(() => undefined);
      await tx.score?.deleteMany?.({ where }).catch(() => undefined);
      await tx.report?.deleteMany?.({ where }).catch(() => undefined);
      // Cascade-safe (schema has onDelete: Cascade)
      await tx.interviewQuestion.deleteMany({ where });
      await tx.interview.delete({ where: { id: interviewId } });
    });

    return { id: interviewId };
  }

  static async start(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        interviewQuestions: {
          include: { question: true },
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to start this interview', 403);
    }
    // Allow re-starting if already IN_PROGRESS or PAUSED (e.g. page refresh)
    if (interview.status === 'IN_PROGRESS' || interview.status === 'PAUSED') {
      const updated = await prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'IN_PROGRESS' },
        include: {
          interviewQuestions: {
            include: { question: true },
            orderBy: { questionIndex: 'asc' },
          },
        },
      });
      return updated;
    }

    if (interview.status !== 'CREATED') {
      throw new AppError('Interview can only be started from CREATED status', 400);
    }

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        interviewQuestions: {
          include: { question: true },
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    return updated;
  }

  static async pause(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to pause this interview', 403);
    }
    if (interview.status !== 'IN_PROGRESS') {
      throw new AppError('Can only pause an in-progress interview', 400);
    }

    // NOTE(added): Prisma `Json` fields are typed as `JsonValue`; cast through `unknown` for TS.
    const metadata =
      (interview.metadata as unknown as ModeConfig) || getModeConfig(interview.mode);

    if (!metadata.allowPause) {
      throw new AppError('Pausing is not allowed in ASSESSMENT mode', 403);
    }

    if (metadata.maxPauses !== null && metadata.pauseCount >= metadata.maxPauses) {
      throw new AppError(
        `Maximum number of pauses (${metadata.maxPauses}) reached for ${interview.mode} mode`,
        403
      );
    }

    const updatedMetadata = {
      ...metadata,
      pauseCount: metadata.pauseCount + 1,
    };

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: 'PAUSED',
        metadata: updatedMetadata as any,
      },
    });

    return {
      paused: true,
      pauseCount: updatedMetadata.pauseCount,
      maxPauses: updatedMetadata.maxPauses,
    };
  }

  static async resume(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to resume this interview', 403);
    }
    if (interview.status !== 'PAUSED') {
      throw new AppError('Can only resume a paused interview', 400);
    }

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'IN_PROGRESS' },
      include: {
        interviewQuestions: {
          include: { question: true },
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    return updated;
  }

  static async end(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        interviewQuestions: true,
      },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to end this interview', 403);
    }

    const now = new Date();
    let durationMinutes: number | null = null;
    if (interview.startedAt) {
      durationMinutes = Math.round((now.getTime() - interview.startedAt.getTime()) / 60000);
    }

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        durationMinutes,
      },
    });

    const answeredCount = interview.interviewQuestions.filter((iq) => iq.answerText !== null || (iq as any).isAnswered).length;
    const skippedCount = interview.interviewQuestions.filter((iq) => iq.skipped).length;

    return {
      totalQuestions: interview.totalQuestions,
      answeredCount,
      skippedCount,
      duration: durationMinutes,
      mode: interview.mode,
    };
  }

  static async submitAnswer(
    userId: string,
    interviewId: string,
    data: { questionIndex: number; answerText: string; timeTakenSeconds?: number; questionText?: string }
  ) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        interviewQuestions: {
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to submit answers for this interview', 403);
    }
    if (interview.status !== 'IN_PROGRESS') {
      throw new AppError('Can only submit answers for an in-progress interview', 400);
    }

    let interviewQuestion = interview.interviewQuestions.find(
      (iq) => iq.questionIndex === data.questionIndex
    );

    // For dynamic interviews, questions may not be pre-stored — create an InterviewQuestion record on-the-fly
    if (!interviewQuestion) {
      interviewQuestion = await prisma.interviewQuestion.create({
        data: {
          interviewId,
          questionId: null, // dynamic question, no pre-set questionId
          questionIndex: data.questionIndex,
          questionText: data.questionText || `Question ${data.questionIndex + 1}`,
          answerText: data.answerText,
          answeredAt: new Date(),
          isAnswered: true,
          timeTakenSeconds: data.timeTakenSeconds || 0,
        },
      });

      // Update totalQuestions to reflect the dynamic questions added
      const newTotal = Math.max(interview.totalQuestions, data.questionIndex + 1);
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          currentQuestionIndex: data.questionIndex + 1,
          totalQuestions: newTotal,
        },
      });

      return { nextQuestionIndex: data.questionIndex + 1, isComplete: false };
    }

    // Update the existing InterviewQuestion record
    await prisma.interviewQuestion.update({
      where: { id: interviewQuestion.id },
      data: {
        answerText: data.answerText,
        answeredAt: new Date(),
        isAnswered: true,
        timeTakenSeconds: data.timeTakenSeconds || null,
        questionText: data.questionText || (interviewQuestion as any).questionText || null,
      },
    });

    const nextQuestionIndex = data.questionIndex + 1;
    const isComplete = nextQuestionIndex >= interview.totalQuestions;

    if (isComplete) {
      // Auto-end the interview
      const now = new Date();
      let durationMinutes: number | null = null;
      if (interview.startedAt) {
        durationMinutes = Math.round((now.getTime() - interview.startedAt.getTime()) / 60000);
      }

      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          durationMinutes,
          currentQuestionIndex: nextQuestionIndex,
        },
      });
    } else {
      // Advance currentQuestionIndex
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          currentQuestionIndex: nextQuestionIndex,
        },
      });
    }

    return { nextQuestionIndex, isComplete };
  }

  static async skipQuestion(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        interviewQuestions: {
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to skip questions for this interview', 403);
    }
    if (interview.status !== 'IN_PROGRESS') {
      throw new AppError('Can only skip questions in an in-progress interview', 400);
    }

    // NOTE(added): Prisma `Json` fields are typed as `JsonValue`; cast through `unknown` for TS.
    const metadata =
      (interview.metadata as unknown as ModeConfig) || getModeConfig(interview.mode);

    if (!metadata.allowSkip) {
      throw new AppError(`Skipping questions is not allowed in ${interview.mode} mode`, 403);
    }

    const currentQuestion = interview.interviewQuestions.find(
      (iq) => iq.questionIndex === interview.currentQuestionIndex
    );

    if (!currentQuestion) {
      throw new AppError('No current question to skip', 400);
    }

    // Mark question as skipped
    await prisma.interviewQuestion.update({
      where: { id: currentQuestion.id },
      data: { skipped: true },
    });

    const updatedMetadata = {
      ...metadata,
      skipCount: metadata.skipCount + 1,
    };

    const nextQuestionIndex = interview.currentQuestionIndex + 1;

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        currentQuestionIndex: nextQuestionIndex,
        metadata: updatedMetadata as any,
      },
    });

    return {
      skipped: true,
      skipCount: updatedMetadata.skipCount,
      nextQuestionIndex,
    };
  }

  static async getHints(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        interviewQuestions: {
          include: { question: true },
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to access hints for this interview', 403);
    }

    // NOTE(added): Prisma `Json` fields are typed as `JsonValue`; cast through `unknown` for TS.
    const metadata =
      (interview.metadata as unknown as ModeConfig) || getModeConfig(interview.mode);

    if (!metadata.showHints) {
      throw new AppError(`Hints are not available in ${interview.mode} mode`, 403);
    }

    const currentIQ = interview.interviewQuestions.find(
      (iq) => iq.questionIndex === interview.currentQuestionIndex
    );

    if (!currentIQ) {
      throw new AppError('No current question found', 400);
    }

    const hints = currentIQ.question?.hints || [];

    const updatedMetadata = {
      ...metadata,
      hintCount: metadata.hintCount + 1,
    };

    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        metadata: updatedMetadata as any,
      },
    });

    return {
      hints,
      hintCount: updatedMetadata.hintCount,
    };
  }

  static async getComparison(userId: string, interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { scores: true },
    });

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }
    if (interview.userId !== userId) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    // Determine the other mode to compare against
    const otherMode = interview.mode === 'PRACTICE' ? 'MOCK' : 'PRACTICE';

    const otherInterview = await prisma.interview.findFirst({
      where: {
        userId,
        mode: otherMode as any,
        status: 'COMPLETED',
        id: { not: interviewId },
      },
      orderBy: { completedAt: 'desc' },
      include: { scores: true },
    });

    const buildStats = (iv: typeof interview) => {
      // NOTE(added): Prisma `Json` fields are typed as `JsonValue`; cast through `unknown` for TS.
      const metadata = (iv.metadata as unknown as ModeConfig) || {};
      const score = iv.scores.length > 0 ? iv.scores[0].overallScore : null;
      return {
        score,
        duration: iv.durationMinutes,
        skipCount: (metadata as any).skipCount || 0,
        hintCount: (metadata as any).hintCount || 0,
        pauseCount: (metadata as any).pauseCount || 0,
      };
    };

    const currentStats = buildStats(interview);

    return {
      practice: interview.mode === 'PRACTICE' ? currentStats : otherInterview ? buildStats(otherInterview) : null,
      simulation: interview.mode !== 'PRACTICE' ? currentStats : otherInterview ? buildStats(otherInterview) : null,
    };
  }
}
