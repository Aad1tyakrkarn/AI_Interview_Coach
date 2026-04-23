import { useCallback, useEffect, useRef } from 'react';
import { useInterviewStore } from '../store/interviewStore';
import { useTimer } from './useTimer';

export function useInterview(interviewId?: string) {
  const store = useInterviewStore();
  const { interview, isLoading, error } = store;

  const hasDuration = !!(interview?.durationMinutes && interview.durationMinutes > 0);
  const isPracticeNoLimit = interview?.mode === 'PRACTICE' && !hasDuration;

  const durationSeconds = hasDuration ? interview!.durationMinutes! * 60 : 0;

  const timer = useTimer({
    mode: isPracticeNoLimit ? 'countup' : hasDuration ? 'countdown' : 'countup',
    initialSeconds: durationSeconds,
    onComplete: () => {
      if (hasDuration) {
        store.endInterview();
      }
    },
  });

  const timerStartedRef = useRef(false);

  useEffect(() => {
    if (interviewId) {
      store.loadInterview(interviewId);
    }
    return () => {
      timerStartedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  // Reset timer when interview loads with duration
  useEffect(() => {
    if (durationSeconds > 0 && !timerStartedRef.current) {
      timer.reset(durationSeconds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSeconds]);

  useEffect(() => {
    if (interview?.status === 'IN_PROGRESS' && !timerStartedRef.current) {
      // Fresh start — reset to initial before ticking so no stale seconds carry over
      timer.reset(durationSeconds);
      timer.start();
      timerStartedRef.current = true;
    } else if (interview?.status === 'PAUSED') {
      timer.pause();
      timerStartedRef.current = false;
    } else if (interview?.status === 'COMPLETED') {
      timer.pause();
      timerStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview?.status]);

  useEffect(() => {
    store.setElapsed(timer.seconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.seconds]);

  const startInterview = useCallback(async () => {
    if (!interview) return;
    await store.startInterview(interview.id);
  }, [interview, store]);

  const pauseInterview = useCallback(async () => {
    await store.pauseInterview();
  }, [store]);

  const resumeInterview = useCallback(async () => {
    await store.resumeInterview();
  }, [store]);

  const endInterview = useCallback(async () => {
    await store.endInterview();
  }, [store]);

  const submitAnswer = useCallback(
    async (answerText: string) => {
      return store.submitAnswer(answerText);
    },
    [store],
  );

  const skipQuestion = useCallback(async () => {
    await store.skipQuestion();
  }, [store]);

  const loadHints = useCallback(async () => {
    return store.loadHints();
  }, [store]);

  const currentQuestion =
    interview && interview.questions.length > 0
      ? interview.questions[interview.currentQuestionIndex] ?? null
      : null;

  const answeredCount = interview?.questions.filter((q) => q.answeredAt).length ?? 0;
  const skippedCount = interview?.config.skipCount ?? 0;
  const progress = interview
    ? {
        current: interview.currentQuestionIndex + 1,
        total: interview.totalQuestions,
        answered: answeredCount,
        skipped: skippedCount,
      }
    : { current: 0, total: 0, answered: 0, skipped: 0 };

  return {
    interview,
    isLoading,
    error,
    currentQuestion,
    progress,
    timer: {
      seconds: timer.seconds,
      formatted: timer.formatted,
      isRunning: timer.isRunning,
    },
    hasDuration,
    isPracticeNoLimit,
    startInterview,
    pauseInterview,
    resumeInterview,
    endInterview,
    submitAnswer,
    skipQuestion,
    loadHints,
    clearError: store.clearError,
    reset: store.reset,
  };
}
