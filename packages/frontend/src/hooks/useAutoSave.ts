import { useEffect, useRef, useCallback, useState } from 'react';
import { reliabilityApi } from '../api/reliability.api';
import { useReliabilityStore } from '../store/reliabilityStore';

interface UseAutoSaveOptions {
  interviewId: string;
  sessionId?: string;
  intervalMs?: number;
  enabled?: boolean;
}

const LOCAL_STORAGE_KEY_PREFIX = 'autosave_';

export function useAutoSave(
  getData: () => {
    state: Record<string, unknown>;
    currentQuestionIndex: number;
    answers: Array<Record<string, unknown>>;
  },
  options: UseAutoSaveOptions
) {
  const { interviewId, sessionId, intervalMs = 10000, enabled = true } = options;
  const { setLastSaved, setIsSaving, isOffline } = useReliabilityStore();

  const [lastSaved, setLastSavedLocal] = useState<string | null>(null);
  const [isSaving, setIsSavingLocal] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const getDataRef = useRef(getData);
  getDataRef.current = getData;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveToLocalStorage = useCallback(
    (data: ReturnType<typeof getData>) => {
      try {
        const key = `${LOCAL_STORAGE_KEY_PREFIX}${interviewId}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            ...data,
            interviewId,
            sessionId,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {
        // localStorage might be full or unavailable; silently fail
      }
    },
    [interviewId, sessionId]
  );

  const performSave = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    const data = getDataRef.current();

    // Always save to localStorage as fallback
    saveToLocalStorage(data);

    if (isOffline) {
      // When offline, only save locally
      const now = new Date().toISOString();
      setLastSavedLocal(now);
      setLastSaved(now);
      setSaveFailed(false);
      return;
    }

    setIsSavingLocal(true);
    setIsSaving(true);
    setSaveFailed(false);

    try {
      await reliabilityApi.autosave({
        interviewId,
        sessionId,
        state: data.state,
        currentQuestionIndex: data.currentQuestionIndex,
        answers: data.answers,
      });

      const now = new Date().toISOString();
      setLastSavedLocal(now);
      setLastSaved(now);
      setSaveFailed(false);
      retryCountRef.current = 0;

      // Clear localStorage backup on successful server save
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${interviewId}`);
      } catch {
        // ignore
      }
    } catch {
      // Retry once on failure
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        try {
          await reliabilityApi.autosave({
            interviewId,
            sessionId,
            state: data.state,
            currentQuestionIndex: data.currentQuestionIndex,
            answers: data.answers,
          });

          const now = new Date().toISOString();
          setLastSavedLocal(now);
          setLastSaved(now);
          setSaveFailed(false);
          retryCountRef.current = 0;
        } catch {
          setSaveFailed(true);
          retryCountRef.current = 0;
        }
      } else {
        setSaveFailed(true);
        retryCountRef.current = 0;
      }
    } finally {
      if (isMountedRef.current) {
        setIsSavingLocal(false);
        setIsSaving(false);
      }
    }
  }, [enabled, interviewId, sessionId, isOffline, saveToLocalStorage, setLastSaved, setIsSaving]);

  const forceSave = useCallback(() => {
    // Debounce rapid force-save calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, 300);
  }, [performSave]);

  // Set up interval-based autosave
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(performSave, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, performSave]);

  // Final save on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Do a synchronous localStorage save on unmount
      const data = getDataRef.current();
      try {
        const key = `${LOCAL_STORAGE_KEY_PREFIX}${interviewId}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            ...data,
            interviewId,
            sessionId,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [interviewId, sessionId]);

  return {
    lastSaved,
    isSaving,
    saveFailed,
    forceSave,
  };
}
