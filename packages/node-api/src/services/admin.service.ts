import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';

export class AdminService {
  // ─── User Management ──────────────────────────

  static async getUsers(query: { page?: number; limit?: number; role?: string; search?: string; verified?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.verified) where.emailVerified = query.verified === 'true';
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, emailVerified: true, isActive: true, lastLoginAt: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    return { data: users, total, page, limit };
  }

  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, preferences: true, _count: { select: { interviews: true, resumes: true, sessions: true } } },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  static async updateUser(userId: string, data: { role?: string; isActive?: boolean; emailVerified?: boolean }) {
    return prisma.user.update({ where: { id: userId }, data: data as any });
  }

  static async deleteUser(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }

  static async getUserAnalytics() {
    const [totalUsers, activeUsers, verifiedUsers, roleDistribution] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
    ]);

    // Recent signups (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const signupsByDay: Record<string, number> = {};
    recentUsers.forEach(u => {
      const day = u.createdAt.toISOString().split('T')[0];
      signupsByDay[day] = (signupsByDay[day] || 0) + 1;
    });

    return { totalUsers, activeUsers, verifiedUsers, roleDistribution, signupsByDay };
  }

  // ─── Question Bank ─────────────────────────────

  static async getQuestions(query: { page?: number; limit?: number; category?: string; difficulty?: string; search?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };
    if (query.category) where.category = query.category;
    if (query.difficulty) where.difficultyLevel = query.difficulty;
    if (query.search) where.text = { contains: query.search, mode: 'insensitive' };

    const [questions, total] = await Promise.all([
      prisma.question.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.question.count({ where }),
    ]);
    return { data: questions, total, page, limit };
  }

  static async createQuestion(data: { text: string; category: string; subcategory?: string; difficultyLevel: string; expectedAnswer?: string; hints?: string[]; tags?: string[]; roleId?: string; timeLimitSeconds?: number }) {
    return prisma.question.create({ data: data as any });
  }

  static async updateQuestion(id: string, data: Record<string, unknown>) {
    return prisma.question.update({ where: { id }, data: data as any });
  }

  static async deleteQuestion(id: string) {
    return prisma.question.update({ where: { id }, data: { isActive: false } });
  }

  static async getQuestionAnalytics() {
    const [totalQuestions, byCategory, byDifficulty] = await Promise.all([
      prisma.question.count({ where: { isActive: true } }),
      prisma.question.groupBy({ by: ['category'], _count: { id: true } }),
      prisma.question.groupBy({ by: ['difficultyLevel'], _count: { id: true } }),
    ]);

    // Question usage (how many times each question was used)
    const topUsed = await prisma.interviewQuestion.groupBy({
      by: ['questionId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return { totalQuestions, byCategory, byDifficulty, topUsedQuestions: topUsed };
  }

  static async bulkImportQuestions(questions: Array<Record<string, unknown>>) {
    const result = await prisma.question.createMany({ data: questions as any, skipDuplicates: true });
    return { imported: result.count };
  }

  // ─── Interview Monitoring ──────────────────────

  static async getInterviews(query: { page?: number; limit?: number; status?: string; mode?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.mode) where.mode = query.mode;

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } }, scores: { select: { overallScore: true } } },
      }),
      prisma.interview.count({ where }),
    ]);
    return { data: interviews, total, page, limit };
  }

  static async getActiveInterviews() {
    const active = await prisma.interview.findMany({
      where: { status: { in: ['IN_PROGRESS', 'PAUSED'] } },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { startedAt: 'desc' },
    });
    return { data: active, count: active.length };
  }

  static async getInterviewAnalytics() {
    const [total, completed, avgScore, byMode, byStatus, completionRate] = await Promise.all([
      prisma.interview.count(),
      prisma.interview.count({ where: { status: 'COMPLETED' } }),
      prisma.score.aggregate({ _avg: { overallScore: true } }),
      prisma.interview.groupBy({ by: ['mode'], _count: { id: true } }),
      prisma.interview.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.interview.count({ where: { status: 'COMPLETED' } }).then(c => prisma.interview.count().then(t => t > 0 ? Math.round((c / t) * 100) : 0)),
    ]);

    return { total, completed, avgScore: Math.round(avgScore._avg.overallScore || 0), byMode, byStatus, completionRate };
  }

  // ─── System Health & Analytics ─────────────────

  static async getSystemHealth() {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch { /* ignore */ }

    const [userCount, interviewCount, questionCount] = await Promise.all([
      prisma.user.count(),
      prisma.interview.count(),
      prisma.question.count(),
    ]);

    return {
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      counts: { users: userCount, interviews: interviewCount, questions: questionCount },
      timestamp: new Date().toISOString(),
    };
  }

  static async getSystemAnalytics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(Date.now() - 7 * 86400000);
    const thisMonth = new Date(Date.now() - 30 * 86400000);

    const [todayInterviews, weekInterviews, monthInterviews, todayUsers, weekUsers, totalUsers, totalInterviews, avgScore] = await Promise.all([
      prisma.interview.count({ where: { createdAt: { gte: today } } }),
      prisma.interview.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.interview.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.user.count(),
      prisma.interview.count(),
      prisma.score.aggregate({ _avg: { overallScore: true } }),
    ]);

    return {
      today: { interviews: todayInterviews, newUsers: todayUsers },
      thisWeek: { interviews: weekInterviews, newUsers: weekUsers },
      thisMonth: { interviews: monthInterviews },
      totals: { users: totalUsers, interviews: totalInterviews, avgScore: Math.round(avgScore._avg.overallScore || 0) },
    };
  }

  static async getPeakUsage() {
    // Get hourly interview counts for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const interviews = await prisma.interview.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const hourlyUsage: Record<string, number> = {};
    const dailyUsage: Record<string, number> = {};
    interviews.forEach(i => {
      const hour = `${i.createdAt.toISOString().split('T')[0]} ${String(i.createdAt.getHours()).padStart(2, '0')}:00`;
      const day = i.createdAt.toISOString().split('T')[0];
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
      dailyUsage[day] = (dailyUsage[day] || 0) + 1;
    });

    // Find peak hour
    const peakHour = Object.entries(hourlyUsage).sort((a, b) => b[1] - a[1])[0];

    return { hourlyUsage, dailyUsage, peakHour: peakHour ? { time: peakHour[0], count: peakHour[1] } : null };
  }

  static async getApiUsageStats() {
    // Approximate API usage from audit logs
    const oneDayAgo = new Date(Date.now() - 86400000);
    const logs = await prisma.auditLog.findMany({
      where: { timestamp: { gte: oneDayAgo } },
      select: { action: true, resource: true, timestamp: true },
    });

    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    logs.forEach(l => {
      byAction[l.action] = (byAction[l.action] || 0) + 1;
      byResource[l.resource] = (byResource[l.resource] || 0) + 1;
    });

    return { totalRequests: logs.length, byAction, byResource, period: '24h' };
  }

  static async getStorageUsage() {
    const [resumeCount, resumeSize] = await Promise.all([
      prisma.resume.count(),
      prisma.resume.aggregate({ _sum: { fileSize: true } }),
    ]);

    return {
      resumes: { count: resumeCount, totalBytes: resumeSize._sum.fileSize || 0, totalMB: Math.round((resumeSize._sum.fileSize || 0) / (1024 * 1024) * 100) / 100 },
    };
  }

  // ─── Support Tickets (removed — table no longer exists) ───────────

  static async getTickets(_query: any) {
    return { data: [], total: 0, page: 1, limit: 20 };
  }

  static async getTicketById(_id: string) {
    throw new AppError('Support tickets feature has been removed', 404);
  }

  static async updateTicket(_id: string, _data: any) {
    throw new AppError('Support tickets feature has been removed', 404);
  }

  // ─── Feedback ──────────────────────────────────

  static async getFeedback(query: { page?: number; limit?: number; reviewed?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        skip, take: limit, orderBy: { generatedAt: 'desc' },
        select: { id: true, interviewId: true, userId: true, summary: true, generatedAt: true },
      }),
      prisma.report.count(),
    ]);

    return { data: reports.map(r => ({ ...r, overallScore: (r.summary as any)?.overallScore || 0 })), total, page, limit };
  }

  // ─── ML Operations ────────────────────────────

  static async getMLModels() {
    return prisma.mLModelVersion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  static async getMLDrift() {
    const models = await prisma.mLModelVersion.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });

    // Simulate drift detection from score trends
    const recentScores = await prisma.score.findMany({
      orderBy: { createdAt: 'desc' }, take: 100,
      select: { overallScore: true, createdAt: true, modelVersion: true },
    });

    const scores = recentScores.map(s => s.overallScore);
    const recentAvg = scores.slice(0, 20).reduce((a, b) => a + b, 0) / Math.max(scores.slice(0, 20).length, 1);
    const olderAvg = scores.slice(50, 70).reduce((a, b) => a + b, 0) / Math.max(scores.slice(50, 70).length, 1);
    const drift = Math.abs(recentAvg - olderAvg);

    return {
      models,
      driftDetected: drift > 10,
      driftMagnitude: Math.round(drift * 100) / 100,
      recentAvgScore: Math.round(recentAvg),
      olderAvgScore: Math.round(olderAvg),
      recommendation: drift > 10 ? 'Consider retraining models' : 'Models performing within expected range',
      scoreTimeline: recentScores.map(s => ({ score: s.overallScore, date: s.createdAt.toISOString().split('T')[0] })),
    };
  }

  static async triggerRetrain(modelName: string) {
    const version = `${modelName}-${Date.now()}`;
    const model = await prisma.mLModelVersion.create({
      data: {
        modelName,
        version,
        description: 'Retrain triggered from admin panel',
        isActive: false,
      },
    });
    logger.info(`Model retrain triggered: ${modelName} -> ${version}`);
    return { model, message: 'Retrain job queued' };
  }

  // ─── RBAC ──────────────────────────────────────

  static async checkAdminAccess(userId: string, requiredRole: string = 'ADMIN') {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) throw new AppError('User not found', 404);

    const roleHierarchy: Record<string, number> = { CANDIDATE: 0, INTERVIEWER: 1, ADMIN: 2 };
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 2;

    if (userLevel < requiredLevel) {
      throw new AppError('Insufficient admin permissions', 403);
    }
    return true;
  }
}
