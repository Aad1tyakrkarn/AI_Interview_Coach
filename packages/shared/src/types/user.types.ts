export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  isVerified: boolean;
  is2FAEnabled: boolean;
  twoFactorSecret?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  experience?: string;
  targetRoles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPreferences {
  id: string;
  userId: string;
  theme: string;
  notifications: boolean;
  language: string;
  timezone: string;
  lastSelectedRole?: string;
}

export interface ISession {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
}
