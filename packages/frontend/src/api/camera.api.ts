import { apiClient } from './client';

export const cameraApi = {
  analyzeFrames: (interviewId: string, questionIndex: number, frames: string[]) =>
    apiClient.post(`/camera/analyze-frames/${interviewId}`, { questionIndex, frames }),

  createAnalysis: (data: { interviewId: string; questionIndex: number; aggregated: Record<string, unknown> }) =>
    apiClient.post('/camera/analysis', data),

  getAnalysis: (interviewId: string) =>
    apiClient.get(`/camera/analysis/${interviewId}`),

  submitConsent: (interviewId: string, granted: boolean) =>
    apiClient.post('/camera/consent', { interviewId, granted }),

  getConsent: (interviewId: string) =>
    apiClient.get(`/camera/consent/${interviewId}`),

  checkQuality: (frameB64: string) =>
    apiClient.post('/camera/quality', { frame: frameB64 }),
};
