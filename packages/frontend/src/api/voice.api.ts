import { apiClient } from './client';

export const voiceApi = {
  // Transcript CRUD
  createTranscript: (data: {
    interviewId: string;
    segments: Array<{
      questionIndex: number;
      speaker: string;
      text: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
    fullText?: string;
    language?: string;
  }) => apiClient.post('/voice/transcripts', data),

  getTranscripts: (interviewId: string) =>
    apiClient.get(`/voice/transcripts/${interviewId}`),

  updateTranscript: (id: string, data: { segments?: any; fullText?: string }) =>
    apiClient.put(`/voice/transcripts/${id}`, data),

  // Analysis
  getAnalysis: (interviewId: string) =>
    apiClient.get(`/voice/analysis/${interviewId}`),

  getMetrics: (interviewId: string) =>
    apiClient.get(`/voice/metrics/${interviewId}`),

  // Transcribe audio via ML
  transcribeAudio: (audioUrl: string) =>
    apiClient.post('/voice/transcribe', { audioUrl }),

  // Save voice analysis metrics (per-question)
  saveAnalysis: (interviewId: string, data: { questionIndex: number; metrics: Record<string, unknown> }) =>
    apiClient.post(`/voice/analysis/${interviewId}`, data),

  // Analyze audio via ML
  analyzeAudio: (interviewId: string, audioUrl: string, questionIndex: number) =>
    apiClient.post(`/voice/analyze/${interviewId}`, { audioUrl, questionIndex }),
};
