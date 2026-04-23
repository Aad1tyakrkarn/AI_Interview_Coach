import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { StorageService } from './storage.service';
import { comparePassword } from './auth.service';

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        twoFactorEnabled: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        preferences: true,
      },
    });

    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  static async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    targetRole?: string;
    experience?: string;
    experienceYears?: number;
    skills?: string[];
    education?: string;
    currentCompany?: string;
    preferredLanguage?: string;
  }) {
    // Update user name fields
    const userUpdate: Record<string, unknown> = {};
    if (data.firstName) userUpdate.firstName = data.firstName;
    if (data.lastName) userUpdate.lastName = data.lastName;

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: userUpdate });
    }

    // Upsert profile
    const profileData = {
      bio: data.bio,
      targetRole: data.targetRole,
      experienceYears: data.experienceYears,
      skills: data.skills,
      education: data.education,
      currentCompany: data.currentCompany,
      preferredLanguage: data.preferredLanguage,
    };

    // Remove undefined values
    const cleanProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(cleanProfileData).length > 0) {
      await prisma.userProfile.upsert({
        where: { userId },
        update: cleanProfileData,
        create: { userId, ...cleanProfileData },
      });
    }

    return this.getProfile(userId);
  }

  static async deleteAccount(userId: string, password: string) {
    if (!password || typeof password !== 'string') {
      throw new AppError('Password is required to delete the account', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new AppError('User not found', 404);

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Incorrect password', 401);
    }

    // Hard delete — cascading deletes handle related records (sessions, profile, etc.)
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  static async getPreferences(userId: string) {
    let prefs = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Create default preferences
      prefs = await prisma.userPreferences.create({
        data: { userId },
      });
    }

    return prefs;
  }

  static async updatePreferences(userId: string, data: {
    emailNotifications?: boolean;
    interviewReminders?: boolean;
    marketingEmails?: boolean;
    theme?: string;
    language?: string;
    timezone?: string;
    cameraEnabled?: boolean;
    microphoneEnabled?: boolean;
  }) {
    const prefs = await prisma.userPreferences.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return prefs;
  }

  static async uploadAvatar(userId: string, file: Express.Multer.File) {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const key = `avatars/${userId}/avatar.${ext}`;

    const url = await StorageService.uploadFile(key, file.buffer, file.mimetype);

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });

    return { avatarUrl: url };
  }

  static async getHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          mode: true,
          status: true,
          difficultyLevel: true,
          targetRole: true,
          startedAt: true,
          completedAt: true,
          durationMinutes: true,
          totalQuestions: true,
          createdAt: true,
          scores: {
            select: {
              overallScore: true,
            },
          },
        },
      }),
      prisma.interview.count({ where: { userId } }),
    ]);

    return {
      data: interviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getDevices(userId: string, currentSessionId?: string) {
    const now = new Date();
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    const mapped = sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      loginAt: s.createdAt,
      expiresAt: s.expiresAt,
      current: currentSessionId ? s.id === currentSessionId : false,
    }));

    // Current session first so it always shows at top
    mapped.sort((a, b) => {
      if (a.current !== b.current) return a.current ? -1 : 1;
      return new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime();
    });
    return mapped;
  }

  static async revokeSession(userId: string, sessionId: string, currentSessionId?: string) {
    if (currentSessionId && sessionId === currentSessionId) {
      throw new AppError('Cannot revoke the current session. Use logout instead.', 400);
    }
    const result = await prisma.session.deleteMany({
      where: { id: sessionId, userId },
    });
    if (result.count === 0) {
      throw new AppError('Session not found', 404);
    }
  }

  static async revokeOtherSessions(userId: string, currentSessionId: string) {
    const result = await prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });
    return { revokedCount: result.count };
  }
}
