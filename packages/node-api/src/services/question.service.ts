import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';

export class QuestionService {
  static async list(query: Record<string, unknown>) {
    const { category, difficulty, roleId, tags, search, page = 1, limit = 10 } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: Record<string, unknown> = { isActive: true };

    if (category) {
      whereClause.category = category;
    }
    if (difficulty) {
      whereClause.difficultyLevel = difficulty;
    }
    if (roleId) {
      whereClause.roleId = roleId;
    }
    if (tags) {
      const tagArray = typeof tags === 'string' ? (tags as string).split(',') : tags;
      whereClause.tags = { hasSome: tagArray };
    }
    if (search) {
      whereClause.text = { contains: search as string, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.question.findMany({
        where: whereClause as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.question.count({ where: whereClause as any }),
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

  static async getById(questionId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    return question;
  }

  static async getCategories() {
    const categories = await prisma.question.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    return categories.map((c) => ({
      category: c.category,
      count: c._count.category,
    }));
  }

  static async getByRole(roleId: string) {
    const questions = await prisma.question.findMany({
      where: { roleId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return questions;
  }

  static async getRandomQuestions(count: number, difficulty?: string, roleId?: string) {
    const whereClause: Record<string, unknown> = { isActive: true };

    if (difficulty) {
      whereClause.difficultyLevel = difficulty;
    }
    if (roleId) {
      whereClause.roleId = roleId;
    }

    const allIds = await prisma.question.findMany({
      where: whereClause as any,
      select: { id: true },
    });

    if (allIds.length === 0) {
      return [];
    }

    // Shuffle and pick the requested count
    const shuffled = allIds.sort(() => Math.random() - 0.5);
    const selectedIds = shuffled.slice(0, Math.min(count, allIds.length)).map((q) => q.id);

    const questions = await prisma.question.findMany({
      where: { id: { in: selectedIds } },
    });

    return questions;
  }
}
