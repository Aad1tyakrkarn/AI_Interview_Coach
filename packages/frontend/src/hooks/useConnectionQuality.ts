import { useState, useEffect, useCallback, useRef } from 'react';
import { useReliabilityStore } from '../store/reliabilityStore';
import { ML_URL } from '../config/env';

type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

function getNetworkConnection(): NetworkInformation | undefined {
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection;
}

// Measure real internet speed by downloading a small file and timing it
async function measureSpeed(): Promise<{
  latency: number;
  speedMbps: number;
  quality: ConnectionQuality;
}> {
  const testUrl = `${ML_URL}/ml/health`;
  const startTime = performance.now();

  try {
    const response = await fetch(testUrl, { cache: 'no-store' });
    const data = await response.text();
    const endTime = performance.now();

    const durationMs = endTime - startTime;
    const bytes = new Blob([data]).size;
    const bitsPerSecond = (bytes * 8) / (durationMs / 1000);
    const mbps = bitsPerSecond / 1_000_000;

    let quality: ConnectionQuality;
    if (durationMs < 100) quality = 'excellent';
    else if (durationMs < 300) quality = 'good';
    else if (durationMs < 1000) quality = 'fair';
    else quality = 'poor';

    return {
      latency: Math.round(durationMs),
      speedMbps: Math.round(mbps * 10) / 10,
      quality,
    };
  } catch {
    return { latency: 0, speedMbps: 0, quality: 'offline' };
  }
}

export function useConnectionQuality() {
  const { setConnectionQuality, setOffline } = useReliabilityStore();

  const [quality, setQuality] = useState<ConnectionQuality>('good');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [latency, setLatency] = useState<number>(0);
  const [speedMbps, setSpeedMbps] = useState<number>(0);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);

  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setQuality('offline');
      setConnectionQuality('offline');
      setOffline(true);
      setLatency(0);
      setSpeedMbps(0);
      return;
    }

    const result = await measureSpeed();

    if (!isMountedRef.current) return;

    setLatency(result.latency);
    setSpeedMbps(result.speedMbps);
    setQuality(result.quality);
    // Map 'fair' to 'poor' for the store which only supports excellent|good|poor|offline
    const storeQuality = result.quality === 'fair' ? 'poor' : result.quality;
    setConnectionQuality(storeQuality as 'excellent' | 'good' | 'poor' | 'offline');
    setOffline(false);
  }, [setConnectionQuality, setOffline]);

  // Read effectiveType from Network Information API
  useEffect(() => {
    const connection = getNetworkConnection();
    if (connection && connection.effectiveType) {
      setEffectiveType(connection.effectiveType);
    }

    const handleChange = () => {
      const conn = getNetworkConnection();
      if (conn && conn.effectiveType) {
        setEffectiveType(conn.effectiveType);
      }
    };

    if (connection) {
      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, []);

  // Monitor online/offline events
  useEffect(() => {
    isMountedRef.current = true;

    const handleOnline = () => {
      setIsOnline(true);
      setOffline(false);
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setQuality('offline');
      setConnectionQuality('offline');
      setOffline(true);
      setLatency(0);
      setSpeedMbps(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setConnectionQuality, setOffline, checkConnection]);

  // Periodic speed measurement (every 30s)
  useEffect(() => {
    // Initial check
    checkConnection();

    pingIntervalRef.current = setInterval(checkConnection, 30000);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [checkConnection]);

  return {
    quality,
    isOnline,
    latency,
    speedMbps,
    effectiveType,
  };
}
