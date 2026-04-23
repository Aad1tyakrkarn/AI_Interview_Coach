import { apiClient } from './client';

export const userApi = {
  getProfile: () => apiClient.get('/users/me'),
  updateProfile: (data: Record<string, unknown>) => apiClient.patch('/users/me', data),
  deleteAccount: (password: string) => apiClient.delete('/users/me', { data: { password } }),
  getPreferences: () => apiClient.get('/users/me/preferences'),
  updatePreferences: (data: Record<string, unknown>) => apiClient.put('/users/me/preferences', data),
  // Avatar upload removed -- camera is used during interviews instead
  getHistory: (page = 1, limit = 20) =>
    apiClient.get(`/users/me/history?page=${page}&limit=${limit}`),
  getDevices: () => apiClient.get('/users/me/devices'),
  revokeDevice: (sessionId: string) => apiClient.delete(`/users/me/devices/${sessionId}`),
  revokeOtherDevices: () => apiClient.post('/users/me/devices/revoke-others'),
};
