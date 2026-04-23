import argon2 from 'argon2';
import bcrypt from 'bcryptjs'; // Kept for backward-compatible hash migration
import { SignJWT } from 'jose';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { config } from '../config';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { EmailService } from './email.service';

// ---------------------------------------------------------------------------
// JWT — using jose (Web Crypto, faster, edge-compatible)
// ---------------------------------------------------------------------------
const jwtSecret = new TextEncoder().encode(config.jwt.secret);

async function generateAccessToken(userId: string, sessionId: string, role: string): Promise<string> {
  return new SignJWT({ userId, sessionId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.jwt.expiresIn || '24h')
    .sign(jwtSecret);
}

function generateRefreshToken(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Password hashing — Argon2id (PHC winner) with bcrypt backward compatibility
// ---------------------------------------------------------------------------
async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  // Backward compatibility: detect bcrypt hashes ($2a$, $2b$) and verify with bcrypt
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compare(password, hash);
  }
  // Argon2 hashes start with $argon2
  return argon2.verify(hash, password);
}

async function migrateHashIfNeeded(userId: string, password: string, currentHash: string): Promise<void> {
  // If still using bcrypt, re-hash with argon2 on successful login
  if (currentHash.startsWith('$2a$') || currentHash.startsWith('$2b$')) {
    const newHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }
}

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<unknown> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await hashPassword(data.password);

    let verificationToken = '';

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          profile: {
            create: {},
          },
          preferences: {
            create: {},
          },
        },
        include: {
          profile: true,
          preferences: true,
        },
      });

      verificationToken = crypto.randomUUID();

      await tx.emailVerification.create({
        data: {
          userId: newUser.id,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      return newUser;
    });

    // Send email outside transaction to avoid timeout
    await EmailService.sendVerificationEmail(user.email, verificationToken);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async login(
    email: string,
    password: string,
    twoFactorCode?: string,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ accessToken: string; refreshToken: string; user: unknown }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account has been deleted or deactivated', 403);
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.emailVerified) {
      throw new AppError('Email not verified. Please check your inbox for the verification link.', 403);
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        throw new AppError('2FA code required', 403);
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: twoFactorCode,
      });

      if (!isValid) {
        throw new AppError('Invalid 2FA code', 401);
      }
    }

    const refreshToken = generateRefreshToken();

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: '', // will be updated with access token
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: meta?.userAgent || '',
        ipAddress: meta?.ipAddress || '',
      },
    });

    const accessToken = await generateAccessToken(user.id, session.id, user.role);

    // Update session with the access token
    await prisma.session.update({
      where: { id: session.id },
      data: { token: accessToken },
    });

    // Migrate bcrypt hash to argon2 on successful login
    await migrateHashIfNeeded(user.id, password, user.passwordHash);

    const { passwordHash: _, twoFactorSecret: __, ...userWithoutSensitive } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutSensitive,
    };
  }

  static async logout(sessionId: string): Promise<void> {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  static async refreshToken(
    refreshTokenValue: string
  ): Promise<{ accessToken: string }> {
    const session = await prisma.session.findFirst({
      where: { refreshToken: refreshTokenValue },
      include: { user: true },
    });

    if (!session) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new AppError('Refresh token expired', 401);
    }

    const accessToken = await generateAccessToken(
      session.userId,
      session.id,
      session.user.role
    );

    await prisma.session.update({
      where: { id: session.id },
      data: { token: accessToken },
    });

    return { accessToken };
  }

  static async verifyEmail(token: string): Promise<void> {
    const verification = await prisma.emailVerification.findFirst({
      where: { token },
    });

    if (!verification) {
      throw new AppError('Invalid verification token', 400);
    }

    if (verification.expiresAt < new Date()) {
      throw new AppError('Verification token expired', 400);
    }

    // NOTE(added): Prisma schema uses `usedAt` (not `used`).
    if (verification.usedAt) {
      throw new AppError('Verification token already used', 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        // NOTE(added): Mark as used with a timestamp.
        data: { usedAt: new Date() },
      }),
    ]);
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to not reveal if email exists
    if (!user) {
      return;
    }

    const resetToken = crypto.randomUUID();

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await EmailService.sendPasswordResetEmail(email, resetToken);
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const passwordReset = await prisma.passwordReset.findFirst({
      where: { token },
    });

    if (!passwordReset) {
      throw new AppError('Invalid reset token', 400);
    }

    if (passwordReset.expiresAt < new Date()) {
      throw new AppError('Reset token expired', 400);
    }

    // NOTE(added): Prisma schema uses `usedAt` (not `used`).
    if (passwordReset.usedAt) {
      throw new AppError('Reset token already used', 400);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordReset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        // NOTE(added): Mark as used with a timestamp.
        data: { usedAt: new Date() },
      }),
      prisma.session.deleteMany({
        where: { userId: passwordReset.userId },
      }),
    ]);
  }

  static async setup2FA(
    userId: string
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const secret = speakeasy.generateSecret({
      name: `InterviewPlatform:${user.email}`,
      issuer: 'InterviewPlatform',
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  static async verify2FA(
    userId: string,
    code: string
  ): Promise<{ verified: boolean }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new AppError('2FA not set up', 400);
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });

    if (!isValid) {
      throw new AppError('Invalid 2FA code', 401);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { verified: true };
  }

  static async disable2FA(userId: string, code: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new AppError('2FA not enabled', 400);
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });

    if (!isValid) {
      throw new AppError('Invalid 2FA code', 401);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }

  static async resendVerification(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email already verified', 400);
    }

    const verificationToken = crypto.randomUUID();

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await EmailService.sendVerificationEmail(email, verificationToken);
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // Delete all other sessions to force re-login on other devices
      prisma.session.deleteMany({
        where: {
          userId,
        },
      }),
    ]);
  }
}
