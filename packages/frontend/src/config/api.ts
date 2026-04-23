export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    SETUP_2FA: '/auth/2fa/setup',
    VERIFY_2FA: '/auth/2fa/verify',
    DISABLE_2FA: '/auth/2fa/disable',
  },
  USER: {
    PROFILE: '/users/profile',
    UPDATE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    PREFERENCES: '/users/preferences',
  },
  RESUME: {
    UPLOAD: '/resumes/upload',
    LIST: '/resumes',
    GET: '/resumes/:id',
    DELETE: '/resumes/:id',
    PARSE: '/resumes/:id/parse',
  },
  INTERVIEW: {
    CREATE: '/interviews',
    LIST: '/interviews',
    GET: '/interviews/:id',
    START: '/interviews/:id/start',
    PAUSE: '/interviews/:id/pause',
    RESUME: '/interviews/:id/resume',
    END: '/interviews/:id/end',
    SKIP: '/interviews/:id/skip',
    HINTS: '/interviews/:id/hints',
  },
  QUESTION: {
    LIST: '/questions',
    GET: '/questions/:id',
    CATEGORIES: '/questions/categories',
  },
  VOICE: {
    TRANSCRIBE: '/voice/transcribe',
    ANALYZE: '/voice/analyze',
  },
  CAMERA: {
    ANALYZE: '/camera/analyze',
  },
  EVALUATION: {
    GET: '/evaluations/:id',
    LIST: '/evaluations',
  },
  SCORING: {
    GET: '/scoring/:id',
    DETAILED: '/scoring/:id/detailed',
    COMPARISON: '/scoring/comparison',
  },
  REPORT: {
    GET: '/reports/:id',
    GENERATE: '/reports/generate',
    PDF: '/reports/:id/pdf',
  },
  RELIABILITY: {
    HEARTBEAT: '/reliability/heartbeat',
    RESTORE: '/reliability/restore/:id',
  },
} as const;
