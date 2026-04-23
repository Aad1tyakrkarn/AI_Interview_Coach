import { useState, useCallback, useRef, useEffect } from 'react';
import {
  aiInterviewerApi,
  ConversationHistoryEntry,
  CoachingMetrics,
  IntroResponse,
  CoachingFeedbackResponse,
  AnswerFeedbackResponse,
} from '../api/ai-interviewer.api';

export interface ChatMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  metadata?: {
    topic?: string;
    skillArea?: string;
    difficulty?: string;
    expectedDuration?: number;
    isFollowUp?: boolean;
    isAcknowledgement?: boolean;
    isSilenceWarning?: boolean;
    isCoaching?: boolean;
    isAnswerFeedback?: boolean;
  };
}

interface SilenceState {
  type: 'nudge' | 'encouragement' | 'offer_skip' | null;
  message: string | null;
  duration: number;
}

const SILENCE_THRESHOLDS = [5, 10, 20] as const;

export function useAIInterviewer(interviewId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentMetadata, setCurrentMetadata] = useState<ChatMessage['metadata']>(null as any);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [silenceWarning, setSilenceWarning] = useState<SilenceState>({
    type: null,
    message: null,
    duration: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastInputTimeRef = useRef<number>(Date.now());
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggeredThresholdsRef = useRef<Set<number>>(new Set());
  const messageIdCounterRef = useRef(0);
  const spokenMessageIdsRef = useRef<Set<string>>(new Set());

  const createMessageId = useCallback(() => {
    messageIdCounterRef.current += 1;
    return `msg-${Date.now()}-${messageIdCounterRef.current}`;
  }, []);

  const addMessage = useCallback(
    (role: ChatMessage['role'], content: string, metadata?: ChatMessage['metadata']) => {
      const msg: ChatMessage = {
        id: createMessageId(),
        role,
        content,
        timestamp: new Date(),
        metadata,
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    [createMessageId],
  );

  // Generate the next question from the AI interviewer
  const generateNext = useCallback(async () => {
    if (!interviewId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const { data } = await aiInterviewerApi.generateQuestion(interviewId);

      if (data.acknowledgement) {
        addMessage('interviewer', data.acknowledgement, { isAcknowledgement: true });
      }

      const metadata = {
        topic: data.metadata.topic,
        skillArea: data.metadata.skillArea,
        difficulty: data.metadata.difficulty,
        expectedDuration: data.metadata.expectedDuration,
      };

      addMessage('interviewer', data.question, metadata);
      setCurrentQuestion(data.question);
      setCurrentMetadata(metadata);
      setAiMessage(data.question);

      lastInputTimeRef.current = Date.now();
      triggeredThresholdsRef.current.clear();
      setSilenceWarning({ type: null, message: null, duration: 0 });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || 'Failed to generate question';
      setError(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  }, [interviewId, addMessage]);

  // Generate a dynamic question based on conversation history
  const generateDynamic = useCallback(
    async (conversationHistory: ConversationHistoryEntry[], lastAnswerText?: string) => {
      if (!interviewId) return;

      setIsGenerating(true);
      setError(null);

      try {
        const { data } = await aiInterviewerApi.generateDynamicQuestion(
          interviewId,
          conversationHistory,
          lastAnswerText,
        );

        const metadata = {
          topic: data.metadata.topic,
          skillArea: data.metadata.skillArea,
          difficulty: data.metadata.difficulty,
          expectedDuration: data.metadata.expectedDuration,
        };

        addMessage('interviewer', data.question, metadata);
        setCurrentQuestion(data.question);
        setCurrentMetadata(metadata);
        setAiMessage(data.question);

        lastInputTimeRef.current = Date.now();
        triggeredThresholdsRef.current.clear();
        setSilenceWarning({ type: null, message: null, duration: 0 });

        return data;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error?.message || 'Failed to generate dynamic question';
        setError(errorMsg);
        console.warn('[AI Interviewer] Dynamic generation failed, falling back to standard:', errorMsg);
        return generateNext();
      } finally {
        setIsGenerating(false);
      }
    },
    [interviewId, addMessage, generateNext],
  );

  // Submit a candidate answer
  const submitAnswer = useCallback(
    async (answerText: string) => {
      if (!answerText.trim()) return;

      addMessage('candidate', answerText);

      lastInputTimeRef.current = Date.now();
      triggeredThresholdsRef.current.clear();
      setSilenceWarning({ type: null, message: null, duration: 0 });

      if (interviewId) {
        try {
          await aiInterviewerApi.adaptDifficulty(interviewId);
        } catch {
          // Non-critical, ignore
        }
      }
    },
    [interviewId, addMessage],
  );

  // Request a rephrased version of the current question
  const requestRephrase = useCallback(async () => {
    if (!currentQuestion) return;

    setIsGenerating(true);
    try {
      const { data } = await aiInterviewerApi.rephraseQuestion(currentQuestion);
      addMessage('interviewer', data.rephrased, {
        ...currentMetadata,
        isFollowUp: false,
      });
      setCurrentQuestion(data.rephrased);
      setAiMessage(data.rephrased);
    } catch {
      setError('Failed to rephrase question');
    } finally {
      setIsGenerating(false);
    }
  }, [currentQuestion, currentMetadata, addMessage]);

  // Acknowledge a skip and move on
  const acknowledgeSkip = useCallback(async () => {
    try {
      const { data } = await aiInterviewerApi.getSkipAcknowledgement();
      addMessage('interviewer', data.message, { isAcknowledgement: true });
      setSilenceWarning({ type: null, message: null, duration: 0 });
      triggeredThresholdsRef.current.clear();
    } catch {
      addMessage('interviewer', "No problem, let's move on to the next question.", {
        isAcknowledgement: true,
      });
    }
  }, [addMessage]);

  // Generate a follow-up question
  const generateFollowUp = useCallback(
    async (previousQuestion: string, answer: string) => {
      if (!interviewId) return;

      setIsGenerating(true);
      try {
        const { data } = await aiInterviewerApi.generateFollowUp(interviewId, previousQuestion, answer);
        addMessage('interviewer', data.followUpQuestion, { isFollowUp: true });
        setCurrentQuestion(data.followUpQuestion);
        setAiMessage(data.followUpQuestion);
      } catch {
        setError('Failed to generate follow-up');
      } finally {
        setIsGenerating(false);
      }
    },
    [interviewId, addMessage],
  );

  // Get closing message
  const getClosing = useCallback(async () => {
    if (!interviewId) return;

    try {
      const { data } = await aiInterviewerApi.getClosingMessage(interviewId);
      addMessage('interviewer', data.message, { isAcknowledgement: true });
      setAiMessage(data.message);
    } catch {
      addMessage('interviewer', 'Thank you for completing this interview. Your results will be available shortly.', {
        isAcknowledgement: true,
      });
    }
  }, [interviewId, addMessage]);

  // Get intro message for the interview (mode-aware on backend)
  const getIntro = useCallback(async (): Promise<IntroResponse | null> => {
    if (!interviewId) return null;

    setIsGenerating(true);
    setError(null);

    try {
      const { data } = await aiInterviewerApi.generateIntro(interviewId);
      return data;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || 'Failed to generate intro';
      setError(errorMsg);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [interviewId]);

  // Get coaching feedback based on real-time metrics (Practice Coach only)
  const getCoachingFeedback = useCallback(
    async (metrics: CoachingMetrics): Promise<CoachingFeedbackResponse | null> => {
      if (!interviewId) return null;

      try {
        const { data } = await aiInterviewerApi.getCoachingFeedback(interviewId, metrics);
        if (data.priorityTip) {
          addMessage('interviewer', data.priorityTip, { isCoaching: true });
        }
        return data;
      } catch {
        return null;
      }
    },
    [interviewId, addMessage],
  );

  // Get answer feedback with coaching tips (Practice Coach only)
  const getAnswerFeedback = useCallback(
    async (
      question: string,
      answer: string,
      metrics: CoachingMetrics,
      answerDurationSeconds: number,
    ): Promise<AnswerFeedbackResponse | null> => {
      if (!interviewId) return null;

      setIsGenerating(true);
      try {
        const { data } = await aiInterviewerApi.getAnswerFeedback(
          interviewId,
          question,
          answer,
          {
            eyeContact: metrics.eyeContact,
            postureScore: metrics.postureScore,
            speakingRate: metrics.speakingRate,
            fillerCount: metrics.fillerCount,
            answerDurationSeconds,
          },
        );
        if (data.feedback) {
          addMessage('interviewer', data.feedback, { isAnswerFeedback: true });
        }
        return data;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error?.message || 'Failed to get answer feedback';
        setError(errorMsg);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [interviewId, addMessage],
  );

  // Generate a resume-based question
  const generateResumeQuestion = useCallback(
    async (conversationHistory: ConversationHistoryEntry[]) => {
      if (!interviewId) return null;

      setIsGenerating(true);
      setError(null);

      try {
        const { data } = await aiInterviewerApi.generateResumeQuestion(interviewId, conversationHistory);

        const metadata = {
          topic: data.metadata.topic,
          skillArea: data.metadata.skillArea,
          difficulty: data.metadata.difficulty,
          expectedDuration: data.metadata.expectedDuration,
        };

        addMessage('interviewer', data.question, metadata);
        setCurrentQuestion(data.question);
        setCurrentMetadata(metadata);
        setAiMessage(data.question);

        lastInputTimeRef.current = Date.now();
        triggeredThresholdsRef.current.clear();
        setSilenceWarning({ type: null, message: null, duration: 0 });

        return data;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error?.message || 'Failed to generate resume question';
        setError(errorMsg);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [interviewId, addMessage],
  );

  // Silence detection
  const checkSilence = useCallback(async () => {
    if (!interviewId || !currentQuestion) return;

    const elapsed = Math.floor((Date.now() - lastInputTimeRef.current) / 1000);

    for (const threshold of SILENCE_THRESHOLDS) {
      if (elapsed >= threshold && !triggeredThresholdsRef.current.has(threshold)) {
        triggeredThresholdsRef.current.add(threshold);

        try {
          const { data } = await aiInterviewerApi.handleSilence(interviewId, elapsed);
          if (data) {
            setSilenceWarning({
              type: data.type,
              message: data.message,
              duration: data.silenceDuration,
            });
          }
        } catch {
          // Non-critical
        }
        break;
      }
    }
  }, [interviewId, currentQuestion]);

  // Start silence monitoring when a question is active
  useEffect(() => {
    if (currentQuestion && interviewId) {
      silenceTimerRef.current = setInterval(checkSilence, 2000);
    }

    return () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [currentQuestion, interviewId, checkSilence]);

  // Record last input time on any user interaction
  const recordInput = useCallback(() => {
    lastInputTimeRef.current = Date.now();
    triggeredThresholdsRef.current.clear();
    setSilenceWarning({ type: null, message: null, duration: 0 });
  }, []);

  // Get an acknowledgement for the user's answer
  const getAcknowledgement = useCallback(
    async (answerText: string): Promise<string> => {
      if (!interviewId) return '';

      try {
        const { data } = await aiInterviewerApi.getAcknowledgement(interviewId, answerText);
        const text = data.acknowledgement;
        if (text) {
          addMessage('interviewer', text, { isAcknowledgement: true });
        }
        return text || '';
      } catch {
        return '';
      }
    },
    [interviewId, addMessage],
  );

  // Get encouragement text for the candidate
  const getEncouragement = useCallback(async (): Promise<string> => {
    if (!interviewId) return '';

    try {
      const { data } = await aiInterviewerApi.getEncouragement(interviewId);
      const text = data.message;
      if (text) {
        addMessage('interviewer', text, { isAcknowledgement: true });
      }
      return text || '';
    } catch {
      return '';
    }
  }, [interviewId, addMessage]);

  // Mark a message as spoken via TTS
  const markAsSpoken = useCallback((messageId: string) => {
    spokenMessageIdsRef.current.add(messageId);
  }, []);

  // Check if a message has already been spoken
  const hasBeenSpoken = useCallback((messageId: string): boolean => {
    return spokenMessageIdsRef.current.has(messageId);
  }, []);

  // Get unspoken interviewer messages
  const getUnspokenMessages = useCallback((): ChatMessage[] => {
    return messages.filter(
      (m) => m.role === 'interviewer' && !spokenMessageIdsRef.current.has(m.id),
    );
  }, [messages]);

  return {
    messages,
    currentQuestion,
    currentMetadata,
    aiMessage,
    silenceWarning,
    isGenerating,
    error,
    generateNext,
    generateDynamic,
    submitAnswer,
    requestRephrase,
    acknowledgeSkip,
    generateFollowUp,
    getClosing,
    recordInput,
    getAcknowledgement,
    getEncouragement,
    markAsSpoken,
    hasBeenSpoken,
    getUnspokenMessages,
    // New methods
    getIntro,
    getCoachingFeedback,
    getAnswerFeedback,
    generateResumeQuestion,
  };
}
