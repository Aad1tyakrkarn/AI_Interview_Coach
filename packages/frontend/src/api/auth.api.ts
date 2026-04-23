import { apiClient } from './client';

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post('/auth/register', data),

  login: (data: { email: string; password: string; twoFactorCode?: string }) =>
    apiClient.post('/auth/login', data),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh-token', { refreshToken }),

  verifyEmail: (token: string) =>
    apiClient.post('/auth/verify-email', { token }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),

  setup2FA: () => apiClient.post('/auth/2fa/setup'),

  verify2FA: (code: string) =>
    apiClient.post('/auth/2fa/verify', { code }),

  disable2FA: (code: string) =>
    apiClient.post('/auth/2fa/disable', { code }),

  resendVerification: (email: string) =>
    apiClient.post('/auth/resend-verification', { email }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),
};
