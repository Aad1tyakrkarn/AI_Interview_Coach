export const CACHE_KEYS = {
  session: (userId: string, sessionId: string) =>
    `session:${userId}:${sessionId}`,

  refreshToken: (token: string) =>
    `refresh_token:${token}`,

  emailVerify: (token: string) =>
    `email_verify:${token}`,

  passwordReset: (token: string) =>
    `password_reset:${token}`,

  rateLimit: (identifier: string, action: string) =>
    `rate_limit:${action}:${identifier}`,

  autosave: (interviewId: string) =>
    `autosave:${interviewId}`,

  heartbeat: (interviewId: string) =>
    `heartbeat:${interviewId}`,

  interviewSession: (interviewId: string) =>
    `interview_session:${interviewId}`,

  cache: (resource: string, id: string) =>
    `cache:${resource}:${id}`,

  userSessions: (userId: string) =>
    `user_sessions:${userId}`,

  lockout: (identifier: string) =>
    `lockout:${identifier}`,

  twoFactorAttempts: (userId: string) =>
    `2fa_attempts:${userId}`,

  activeInterviews: () =>
    'active_interviews',

  questionCache: (questionId: string) =>
    `cache:question:${questionId}`,

  userPreferences: (userId: string) =>
    `cache:preferences:${userId}`,
} as const;

export const CACHE_TTL = {
  SESSION: 86400,           // 24 hours
  REFRESH_TOKEN: 604800,    // 7 days
  EMAIL_VERIFY: 86400,      // 24 hours
  PASSWORD_RESET: 3600,     // 1 hour
  RATE_LIMIT: 900,          // 15 minutes
  AUTOSAVE: 86400,          // 24 hours
  HEARTBEAT: 30,            // 30 seconds
  CACHE: 3600,              // 1 hour
  LOCKOUT: 900,             // 15 minutes
  TWO_FACTOR_ATTEMPTS: 300, // 5 minutes
} as const;
