import { useEffect, useRef, useState, useCallback } from 'react';
import { reliabilityApi } from '../api/reliability.api';
import { useReliabilityStore } from '../store/reliabilityStore';

interface UseHeartbeatOptions {
  interviewId: string;
  intervalMs?: number;
  enabled?: boolean;
}

type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

function classifyLatency(latencyMs: number): ConnectionQuality {
  if (latencyMs < 100) return 'excellent';
  if (latencyMs < 300) return 'good';
  if (latencyMs < 1000) return 'poor';
  return 'offline';
}

export function useHeartbeat(options: UseHeartbeatOptions) {
  const { interviewId, intervalMs = 15000, enabled = true } = options;
  const { setHeartbeat, setConnectionQuality, setOffline } = useReliabilityStore();

  const [isAlive, setIsAlive] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [quality, setQuality] = useState<ConnectionQuality>('good');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consecutiveFailuresRef = useRef(0);
  const isMountedRef = useRef(true);

  const sendHeartbeat = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    const startTime = performance.now();
    const clientTime = new Date().toISOString();

    try {
      await reliabilityApi.heartbeat({ interviewId, clientTime });

      const endTime = performance.now();
      const roundTrip = Math.round(endTime - startTime);

      if (!isMountedRef.current) return;

      const detectedQuality = classifyLatency(roundTrip);

      setLatency(roundTrip);
      setQuality(detectedQuality);
      setIsAlive(true);
      setHeartbeat(clientTime, roundTrip);
      setConnectionQuality(detectedQuality);
      setOffline(false);
      consecutiveFailuresRef.current = 0;
    } catch {
      if (!isMountedRef.current) return;

      consecutiveFailuresRef.current += 1;

      // After 2 consecutive failures, mark as offline
      if (consecutiveFailuresRef.current >= 2) {
        setIsAlive(false);
        setQuality('offline');
        setConnectionQuality('offline');
        setOffline(true);
      } else {
        // Single failure: mark as poor
        setQuality('poor');
        setConnectionQuality('poor');
      }
    }
  }, [enabled, interviewId, setHeartbeat, setConnectionQuality, setOffline]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) return;

    // Send initial heartbeat immediately
    sendHeartbeat();

    intervalRef.current = setInterval(sendHeartbeat, intervalMs);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, sendHeartbeat]);

  return {
    isAlive,
    latency,
    quality,
  };
}
