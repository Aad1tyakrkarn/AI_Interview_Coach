import { apiClient } from './client';

export const evaluationApi = {
  evaluateAnswer: (interviewId: string, data: {
    questionIndex: number;
    question: string;
    answer: string;
    expectedTopics: string[];
    resumeData?: Record<string, unknown>;
  }) => apiClient.post(`/evaluations/${interviewId}/evaluate`, data),

  getByInterviewId: (interviewId: string) =>
    apiClient.get(`/evaluations/${interviewId}`),

  getByQuestion: (interviewId: string, questionId: string) =>
    apiClient.get(`/evaluations/${interviewId}/questions/${questionId}`),

  getExplainability: (interviewId: string) =>
    apiClient.get(`/evaluations/${interviewId}/explainability`),

  getModelVersions: () =>
    apiClient.get('/evaluations/models'),
};
