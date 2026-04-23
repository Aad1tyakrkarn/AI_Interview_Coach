import { apiClient } from './client';

export const reportApi = {
  getByInterviewId: (interviewId: string) =>
    apiClient.get(`/reports/${interviewId}`),

  generateReport: (interviewId: string) =>
    apiClient.post(`/reports/${interviewId}/generate`),

  getPdf: (interviewId: string) =>
    apiClient.get(`/reports/${interviewId}/pdf`),

  getTrends: (params?: { period?: string; mode?: string }) =>
    apiClient.get('/reports/trends', { params }),

  getReadiness: () =>
    apiClient.get('/reports/readiness'),

  getRecommendations: () =>
    apiClient.get('/reports/recommendations'),

  getHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/reports/history', { params }),
};
