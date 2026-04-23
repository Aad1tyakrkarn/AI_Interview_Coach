import { apiClient } from './client';

export interface ConversationHistoryEntry {
  role: 'interviewer' | 'candidate';
  content: string;
}

export interface DynamicQuestionResponse {
  question: string;
  metadata: {
    topic: string;
    skillArea: string;
    difficulty: string;
    expectedDuration: number;
  };
  acknowledgement?: string;
}

export interface CoachingMetrics {
  eyeContact: number;
  postureScore: number;
  lightingQuality: string;
  speakingRate: number;
  fillerCount: number;
  blinkRate: number;
  answerDurationSeconds?: number;
}

export interface IntroResponse {
  introText: string;
  followUpPrompt: string;
}

export interface CoachingFeedbackResponse {
  tips: string[];
  priorityTip: string;
}

export interface AnswerFeedbackResponse {
  feedback: string;
  strengths: string[];
  improvements: string[];
  transition: string;
}

export const aiInterviewerApi = {
  generateQuestion: (interviewId: string) =>
    apiClient.post(`/ai-interviewer/${interviewId}/generate-question`),

  /** Generate a dynamic question based on full conversation history */
  generateDynamicQuestion: (
    interviewId: string,
    conversationHistory: ConversationHistoryEntry[],
    lastAnswerText?: string,
  ) =>
    apiClient.post<DynamicQuestionResponse>(
      `/ai-interviewer/${interviewId}/generate-dynamic`,
      { conversationHistory, lastAnswerText },
    ),

  generateFollowUp: (interviewId: string, previousQuestion: string, answer: string) =>
    apiClient.post(`/ai-interviewer/${interviewId}/follow-up`, { previousQuestion, answer }),

  adaptDifficulty: (interviewId: string) =>
    apiClient.post(`/ai-interviewer/${interviewId}/adapt-difficulty`),

  handleSilence: (interviewId: string, silenceDurationSeconds: number) =>
    apiClient.post(`/ai-interviewer/${interviewId}/silence`, { silenceDurationSeconds }),

  getClosingMessage: (interviewId: string) =>
    apiClient.post(`/ai-interviewer/${interviewId}/closing`),

  rephraseQuestion: (question: string) =>
    apiClient.post('/ai-interviewer/rephrase', { question }),

  getSkipAcknowledgement: () =>
    apiClient.post('/ai-interviewer/skip-ack'),

  /** Get an acknowledgement/transition response after a user answer */
  getAcknowledgement: (interviewId: string, answerText: string) =>
    apiClient.post<{ acknowledgement: string }>(
      `/ai-interviewer/${interviewId}/acknowledge`,
      { answerText },
    ),

  /** Get an encouragement message to motivate the candidate */
  getEncouragement: (interviewId: string) =>
    apiClient.post<{ message: string }>(
      `/ai-interviewer/${interviewId}/encouragement`,
    ),

  /** Generate a friendly or professional intro for the interview */
  generateIntro: (interviewId: string) =>
    apiClient.post<IntroResponse>(
      `/ai-interviewer/${interviewId}/intro`,
    ),

  /** Get real-time coaching feedback based on camera/voice metrics (Practice Coach only) */
  getCoachingFeedback: (interviewId: string, metrics: CoachingMetrics) =>
    apiClient.post<CoachingFeedbackResponse>(
      `/ai-interviewer/${interviewId}/coaching-feedback`,
      metrics,
    ),

  /** Get detailed answer feedback with coaching tips (Practice Coach only) */
  getAnswerFeedback: (
    interviewId: string,
    question: string,
    answer: string,
    metrics: Omit<CoachingMetrics, 'lightingQuality' | 'blinkRate'> & { answerDurationSeconds: number },
  ) =>
    apiClient.post<AnswerFeedbackResponse>(
      `/ai-interviewer/${interviewId}/answer-feedback`,
      { question, answer, ...metrics },
    ),

  /** Generate a resume-based question using conversation history */
  generateResumeQuestion: (interviewId: string, conversationHistory: ConversationHistoryEntry[]) =>
    apiClient.post<DynamicQuestionResponse>(
      `/ai-interviewer/${interviewId}/resume-question`,
      { conversationHistory },
    ),
};
