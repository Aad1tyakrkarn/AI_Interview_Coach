import { apiClient } from './client';

export const reliabilityApi = {
  autosave: (data: {
    interviewId: string;
    sessionId?: string;
    state: Record<string, unknown>;
    currentQuestionIndex: number;
    answers: Array<Record<string, unknown>>;
  }) => apiClient.post('/reliability/autosave', data),

  heartbeat: (data: { interviewId: string; clientTime: string }) =>
    apiClient.post('/reliability/heartbeat', data),

  getConnectionQuality: () =>
    apiClient.get('/reliability/connection-quality'),

  restoreSession: (sessionId: string) =>
    apiClient.post(`/reliability/restore/${sessionId}`),

  getRestorableSessions: () =>
    apiClient.get('/reliability/restorable-sessions'),

  emergencyExport: (interviewId: string) =>
    apiClient.get(`/reliability/emergency-export/${interviewId}`),
};
