import React, { useEffect, useState, useCallback } from 'react';
import { useReliabilityStore } from '../../store/reliabilityStore';

export const ConnectionBanner: React.FC = () => {
  const { connectionQuality, heartbeatLatency, isOffline } = useReliabilityStore();
  const [visible, setVisible] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (connectionQuality === 'poor' || connectionQuality === 'offline') {
      setVisible(true);
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
        setAutoHideTimer(null);
      }
    } else if (connectionQuality === 'excellent' || connectionQuality === 'good') {
      // Show briefly when reconnected, then auto-hide after 3s
      if (visible) {
        const timer = setTimeout(() => {
          setVisible(false);
        }, 3000);
        setAutoHideTimer(timer);
      }
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionQuality]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    // Trigger a check by toggling offline state briefly
    // The actual retry is handled by the heartbeat/connection quality hooks
    // We just provide visual feedback
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setRetrying(false);
  }, []);

  if (!visible) return null;

  const isGood = connectionQuality === 'excellent' || connectionQuality === 'good';
  const isPoor = connectionQuality === 'poor';
  const isOfflineState = connectionQuality === 'offline' || isOffline;

  let bgClass = '';
  let textContent = '';
  let icon: React.ReactNode = null;

  if (isOfflineState) {
    bgClass = 'bg-red-600';
    textContent = 'You are offline - changes saved locally';
    icon = (
      <svg className="w-4 h-4 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v4m0 4h.01" />
      </svg>
    );
  } else if (isPoor) {
    bgClass = 'bg-yellow-500';
    textContent = `Poor connection - some features may be limited${heartbeatLatency ? ` (${heartbeatLatency}ms)` : ''}`;
    icon = (
      <svg className="w-4 h-4 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  } else if (isGood) {
    bgClass = 'bg-green-500';
    textContent = 'Connected';
    icon = (
      <svg className="w-4 h-4 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  return (
    <div
      className={`
        ${bgClass} text-white text-center py-2 px-4 text-sm font-medium
        transition-all duration-500 ease-in-out
        ${visible ? 'opacity-100 max-h-12' : 'opacity-0 max-h-0'}
        overflow-hidden flex items-center justify-center
      `}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center">
        {icon}
        {textContent}
      </span>

      {isOfflineState && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="ml-4 px-3 py-0.5 bg-white dark:bg-gray-800/20 hover:bg-white/30 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retrying ? (
            <span className="flex items-center">
              <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Retrying...
            </span>
          ) : (
            'Retry'
          )}
        </button>
      )}
    </div>
  );
};
