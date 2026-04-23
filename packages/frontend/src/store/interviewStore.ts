import { create } from 'zustand';
import { interviewApi } from '../api/interview.api';

export interface Question {
  id: string;
  questionId: string;
  questionIndex: number;
  text: string;
  category: string;
  difficulty: string;
  hints: string[];
  timeLimitSeconds?: number;
  skipped: boolean;
  answeredAt?: string;
  answerText?: string;
}

export interface InterviewConfig {
  allowPause: boolean;
  allowSkip: boolean;
  showHints: boolean;
  maxPauses: number | null;
  pauseCount: number;
  skipCount: number;
  hintCount: number;
}

export interface Interview {
  id: string;
  title: string;
  mode: 'PRACTICE' | 'MOCK';
  status: string;
  difficultyLevel: string;
  targetRole?: string;
  resumeId?: string;
  durationMinutes?: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  startedAt?: string;
  completedAt?: string;
  questions: Question[];
  config: InterviewConfig;
}

interface InterviewState {
  interview: Interview | null;
  isLoading: boolean;
  error: string | null;
  elapsedSeconds: number;
  questionStartTime: number;

  createInterview: (data: {
    title: string;
    mode: 'PRACTICE' | 'MOCK';
    difficultyLevel: string;
    targetRole?: string;
    durationMinutes?: number;
    questionCount?: number;
    resumeId?: string;
  }) => Promise<string>;
  loadInterview: (id: string) => Promise<void>;
  startInterview: (id: string) => Promise<void>;
  pauseInterview: () => Promise<void>;
  resumeInterview: () => Promise<void>;
  endInterview: () => Promise<void>;
  submitAnswer: (answerText: string, questionText?: string) => Promise<{ isComplete: boolean }>;
  skipQuestion: () => Promise<void>;
  loadHints: () => Promise<string[]>;
  setElapsed: (seconds: number) => void;
  setQuestionStartTime: (time: number) => void;
  reset: () => void;
  clearError: () => void;
}

function buildConfig(mode: 'PRACTICE' | 'MOCK'): InterviewConfig {
  switch (mode) {
    case 'PRACTICE':
      return {
        allowPause: true,
        allowSkip: true,
        showHints: true,
        maxPauses: null,
        pauseCount: 0,
        skipCount: 0,
        hintCount: 0,
      };
    case 'MOCK':
      return {
        allowPause: false,
        allowSkip: false,
        showHints: false,
        maxPauses: 0,
        pauseCount: 0,
        skipCount: 0,
        hintCount: 0,
      };
  }
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  interview: null,
  isLoading: false,
  error: null,
  elapsedSeconds: 0,
  questionStartTime: 0,

  createInterview: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await interviewApi.create(data);
      const id = response.data?.id ?? response.data?.data?.id;
      set({ isLoading: false });
      return id;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create interview';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  loadInterview: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await interviewApi.get(id);
      const raw = response.data?.data ?? response.data;
      const mode = raw.mode as 'PRACTICE' | 'MOCK';
      const rawQuestions = raw.questions ?? raw.interviewQuestions ?? [];
      const questions: Question[] = rawQuestions.map(
        (q: Record<string, any>, index: number) => {
          const nested = q.question as Record<string, any> | undefined;
          return {
            id: (q.id as string) ?? `q-${index}`,
            questionId: (q.questionId as string) ?? (nested?.id as string) ?? `q-${index}`,
            questionIndex: (q.questionIndex as number) ?? index,
            text: (nested?.text as string) ?? (q.text as string) ?? '',
            category: (nested?.category as string) ?? (q.category as string) ?? 'General',
            difficulty: (nested?.difficultyLevel as string) ?? (q.difficulty as string) ?? raw.difficultyLevel ?? 'Intermediate',
            hints: (nested?.hints as string[]) ?? (q.hints as string[]) ?? [],
            timeLimitSeconds: (nested?.timeLimitSeconds ?? q.timeLimitSeconds) as number | undefined,
            skipped: (q.skipped as boolean) ?? false,
            answeredAt: q.answeredAt as string | undefined,
            answerText: q.answerText as string | undefined,
          };
        },
      );

      const config = raw.config
        ? {
            allowPause: raw.config.allowPause ?? true,
            allowSkip: raw.config.allowSkip ?? false,
            showHints: raw.config.showHints ?? false,
            maxPauses: raw.config.maxPauses ?? null,
            pauseCount: raw.config.pauseCount ?? 0,
            skipCount: raw.config.skipCount ?? 0,
            hintCount: raw.config.hintCount ?? 0,
          }
        : buildConfig(mode);

      const interview: Interview = {
        id: raw.id,
        title: raw.title ?? 'Interview',
        mode,
        status: raw.status ?? 'CREATED',
        difficultyLevel: raw.difficultyLevel ?? 'Intermediate',
        targetRole: raw.targetRole,
        resumeId: raw.resumeId ?? raw.resume_id ?? undefined,
        durationMinutes: raw.durationMinutes ?? raw.duration_minutes ?? (raw.metadata?.durationMinutes) ?? undefined,
        totalQuestions: raw.totalQuestions ?? questions.length,
        currentQuestionIndex: raw.currentQuestionIndex ?? 0,
        startedAt: raw.startedAt,
        completedAt: raw.completedAt,
        questions,
        config,
      };

      set({ interview, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load interview';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  startInterview: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await interviewApi.start(id);
      set((state) => ({
        isLoading: false,
        interview: state.interview
          ? {
              ...state.interview,
              status: 'IN_PROGRESS',
              startedAt: new Date().toISOString(),
            }
          : null,
        questionStartTime: Date.now(),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start interview';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  pauseInterview: async () => {
    const { interview } = get();
    if (!interview) return;
    set({ isLoading: true, error: null });
    try {
      await interviewApi.pause(interview.id);
      set({
        isLoading: false,
        interview: {
          ...interview,
          status: 'PAUSED',
          config: {
            ...interview.config,
            pauseCount: interview.config.pauseCount + 1,
          },
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to pause interview';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  resumeInterview: async () => {
    const { interview } = get();
    if (!interview) return;
    set({ isLoading: true, error: null });
    try {
      await interviewApi.resume(interview.id);
      set({
        isLoading: false,
        interview: {
          ...interview,
          status: 'IN_PROGRESS',
        },
        questionStartTime: Date.now(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resume interview';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  endInterview: async () => {
    const { interview } = get();
    if (!interview) return;
    set({ isLoading: true, error: null });
    try {
      await interviewApi.end(interview.id);
      set({
        isLoading: false,
        interview: {
          ...interview,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to end interview';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  submitAnswer: async (answerText: string, questionText?: string) => {
    const { interview, questionStartTime } = get();
    if (!interview) throw new Error('No active interview');

    const timeTakenSeconds = Math.round((Date.now() - questionStartTime) / 1000);
    const questionIndex = interview.currentQuestionIndex;

    // Derive questionText from current question if not explicitly provided
    const resolvedQuestionText = questionText
      || interview.questions[questionIndex]?.text
      || `Question ${questionIndex + 1}`;

    set({ isLoading: true, error: null });
    try {
      await interviewApi.submitAnswer(interview.id, {
        questionIndex,
        answerText,
        timeTakenSeconds,
        questionText: resolvedQuestionText,
      });

      const updatedQuestions = interview.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, answeredAt: new Date().toISOString(), answerText }
          : q,
      );

      const nextIndex = questionIndex + 1;
      // Never auto-complete based on question count — duration-based only.
      // The interview ends when the timer runs out or the user clicks "End Interview".
      const isComplete = false;

      set({
        isLoading: false,
        interview: {
          ...interview,
          questions: updatedQuestions,
          currentQuestionIndex: nextIndex,
          status: interview.status,
          completedAt: interview.completedAt,
        },
        questionStartTime: Date.now(),
      });

      return { isComplete };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit answer';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  skipQuestion: async () => {
    const { interview } = get();
    if (!interview) return;

    set({ isLoading: true, error: null });
    try {
      await interviewApi.skipQuestion(interview.id);

      const updatedQuestions = interview.questions.map((q, i) =>
        i === interview.currentQuestionIndex ? { ...q, skipped: true } : q,
      );

      const nextIndex = interview.currentQuestionIndex + 1;

      set({
        isLoading: false,
        interview: {
          ...interview,
          questions: updatedQuestions,
          currentQuestionIndex: nextIndex,
          status: interview.status,
          completedAt: interview.completedAt,
          config: {
            ...interview.config,
            skipCount: interview.config.skipCount + 1,
          },
        },
        questionStartTime: Date.now(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to skip question';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  loadHints: async () => {
    const { interview } = get();
    if (!interview) return [];

    try {
      const response = await interviewApi.getHints(interview.id);
      const hints: string[] = response.data?.hints ?? response.data?.data?.hints ?? [];
      set((state) => ({
        interview: state.interview
          ? {
              ...state.interview,
              config: {
                ...state.interview.config,
                hintCount: state.interview.config.hintCount + 1,
              },
            }
          : null,
      }));
      return hints;
    } catch {
      return [];
    }
  },

  setElapsed: (seconds: number) => set({ elapsedSeconds: seconds }),

  setQuestionStartTime: (time: number) => set({ questionStartTime: time }),

  reset: () =>
    set({
      interview: null,
      isLoading: false,
      error: null,
      elapsedSeconds: 0,
      questionStartTime: 0,
    }),

  clearError: () => set({ error: null }),
}));
