import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTimerOptions {
  mode?: 'countup' | 'countdown';
  initialSeconds?: number;
  onComplete?: () => void;
}

export function useTimer(options: UseTimerOptions = {}) {
  const { mode = 'countup', initialSeconds = 0, onComplete } = options;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const tick = useCallback(() => {
    setSeconds((prev) => {
      if (mode === 'countdown') {
        if (prev <= 1) {
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      }
      return prev + 1;
    });
  }, [mode]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(
    (newInitial?: number) => {
      pause();
      setSeconds(newInitial ?? initialSeconds);
    },
    [pause, initialSeconds],
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return { seconds, formatted, isRunning, start, pause, reset };
}
