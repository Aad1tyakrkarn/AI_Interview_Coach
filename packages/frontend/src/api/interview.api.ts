import { apiClient } from './client';

export const interviewApi = {
  create: (data: {
    title: string;
    mode: 'PRACTICE' | 'MOCK' | 'ASSESSMENT';
    difficultyLevel: string;
    targetRole?: string;
    durationMinutes?: number;
    questionCount?: number;
    resumeId?: string;
  }) => apiClient.post('/interviews', data),

  list: (params?: { page?: number; limit?: number; status?: string; mode?: string }) =>
    apiClient.get('/interviews', { params }),

  get: (id: string) => apiClient.get(`/interviews/${id}`),

  remove: (id: string) => apiClient.delete(`/interviews/${id}`),

  start: (id: string) => apiClient.post(`/interviews/${id}/start`),

  pause: (id: string) => apiClient.post(`/interviews/${id}/pause`),

  resume: (id: string) => apiClient.post(`/interviews/${id}/resume`),

  end: (id: string) => apiClient.post(`/interviews/${id}/end`),

  submitAnswer: (id: string, data: { questionIndex: number; answerText: string; timeTakenSeconds: number; questionText?: string }) =>
    apiClient.post(`/interviews/${id}/answer`, data),

  skipQuestion: (id: string) => apiClient.post(`/interviews/${id}/skip`),

  getHints: (id: string) => apiClient.get(`/interviews/${id}/hints`),

  getComparison: (id: string) => apiClient.get(`/interviews/${id}/comparison`),
};
