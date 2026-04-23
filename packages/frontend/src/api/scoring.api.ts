import { apiClient } from './client';

export const scoringApi = {
  getByInterviewId: (interviewId: string) =>
    apiClient.get(`/scoring/${interviewId}`),

  calculateScore: (interviewId: string) =>
    apiClient.post(`/scoring/${interviewId}/calculate`),

  getHistory: (params?: { page?: number; limit?: number; mode?: string }) =>
    apiClient.get('/scoring/history', { params }),

  getComparison: (interviewIds: string[]) =>
    apiClient.get('/scoring/comparison', { params: { interviewIds: interviewIds.join(',') } }),
};
