import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ReliabilityBarProps {
  interviewId: string;
  isActive: boolean;
  // Auto-save state
  autoSaveLastSaved: string | null;
  autoSaveIsSaving: boolean;
  autoSaveFailed: boolean;
  onForceSave?: () => void;
  // Heartbeat state
  heartbeatIsAlive: boolean;
  heartbeatLatency: number | null;
  heartbeatQuality: 'excellent' | 'good' | 'poor' | 'offline';
  // Connection quality state
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  connectionIsOnline: boolean;
  connectionEffectiveType: string | null;
  connectionSpeedMbps?: number;
  connectionLatency?: number;
  // Retry tracking
  retryCount?: number;
}

function getTimeAgo(isoTimestamp: string): string {
  const savedDate = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - savedDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 5) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  return `${Math.floor(diffMinutes / 60)}h ago`;
}

function qualityColor(quality: string): string {
  switch (quality) {
    case 'excellent':
      return 'text-green-400';
    case 'good':
      return 'text-green-400';
    case 'poor':
      return 'text-yellow-400';
    case 'offline':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

function qualityDotColor(quality: string): string {
  switch (quality) {
    case 'excellent':
      return 'bg-green-400';
    case 'good':
      return 'bg-green-400';
    case 'poor':
      return 'bg-yellow-400';
    case 'offline':
      return 'bg-red-400';
    default:
      return 'bg-gray-400';
  }
}

export const ReliabilityBar: React.FC<ReliabilityBarProps> = ({
  interviewId,
  isActive,
  autoSaveLastSaved,
  autoSaveIsSaving,
  autoSaveFailed,
  onForceSave,
  heartbeatIsAlive,
  heartbeatLatency,
  heartbeatQuality,
  connectionQuality,
  connectionIsOnline,
  connectionEffectiveType,
  connectionSpeedMbps = 0,
  connectionLatency = 0,
  retryCount = 0,
}) => {
  const [timeAgoText, setTimeAgoText] = useState('');
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update time-ago every second
  useEffect(() => {
    const update = () => {
      if (autoSaveLastSaved) {
        setTimeAgoText(getTimeAgo(autoSaveLastSaved));
      }
    };
    update();
    tickRef.current = setInterval(update, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [autoSaveLastSaved]);

  // Determine if there are any issues that need attention
  const hasIssues =
    autoSaveFailed ||
    !heartbeatIsAlive ||
    connectionQuality === 'poor' ||
    connectionQuality === 'offline' ||
    !connectionIsOnline ||
    retryCount > 0;

  // Auto-save status
  let saveStatusText: string;
  let saveStatusColor: string;
  let saveDotColor: string;

  if (autoSaveIsSaving) {
    saveStatusText = 'Saving...';
    saveStatusColor = 'text-gray-400';
    saveDotColor = 'bg-yellow-400';
  } else if (autoSaveFailed) {
    saveStatusText = 'Save failed';
    saveStatusColor = 'text-red-400';
    saveDotColor = 'bg-red-400';
  } else if (autoSaveLastSaved) {
    saveStatusText = `Saved ${timeAgoText}`;
    saveStatusColor = 'text-gray-400';
    saveDotColor = 'bg-green-400';
  } else {
    saveStatusText = 'Not saved';
    saveStatusColor = 'text-gray-500';
    saveDotColor = 'bg-gray-500';
  }

  // Connection text with real speed
  const speedColor = connectionSpeedMbps > 2 ? 'text-green-400' : connectionSpeedMbps > 0.5 ? 'text-yellow-400' : 'text-red-400';
  const connectionText = connectionIsOnline
    ? connectionSpeedMbps > 0
      ? `${connectionSpeedMbps} Mbps (${connectionLatency || heartbeatLatency || 0}ms)`
      : heartbeatLatency !== null
        ? `${heartbeatQuality.charAt(0).toUpperCase() + heartbeatQuality.slice(1)} (${heartbeatLatency}ms)`
        : connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)
    : 'Offline';

  // Network type label
  const networkLabel = connectionEffectiveType
    ? connectionEffectiveType.toUpperCase()
    : connectionIsOnline
      ? 'WiFi'
      : 'None';

  if (!isActive) return null;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-1.5 text-xs transition-all duration-300 ${
        hasIssues
          ? 'bg-gray-900/90 border-b border-yellow-800/50'
          : 'bg-gray-900/60 border-b border-gray-800/50'
      }`}
      role="status"
      aria-label="Reliability status"
    >
      {/* Auto-save status */}
      <button
        onClick={onForceSave}
        disabled={autoSaveIsSaving || !onForceSave}
        className={`flex items-center gap-1.5 ${saveStatusColor} hover:text-gray-200 transition-colors disabled:cursor-default`}
        title={onForceSave ? 'Click to save now' : undefined}
      >
        {autoSaveIsSaving ? (
          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <span className={`h-2 w-2 rounded-full ${saveDotColor}`} />
        )}
        <span>{saveStatusText}</span>
      </button>

      <span className="text-gray-700 dark:text-gray-300">|</span>

      {/* Connection quality with real speed */}
      <div className={`flex items-center gap-1.5 ${connectionSpeedMbps > 0 ? speedColor : qualityColor(connectionIsOnline ? heartbeatQuality : 'offline')}`}>
        <span className={`h-2 w-2 rounded-full ${connectionSpeedMbps > 2 ? 'bg-green-400' : connectionSpeedMbps > 0.5 ? 'bg-yellow-400' : connectionSpeedMbps > 0 ? 'bg-red-400' : qualityDotColor(connectionIsOnline ? heartbeatQuality : 'offline')}`} />
        <span>{connectionText}</span>
      </div>

      <span className="text-gray-700 dark:text-gray-300">|</span>

      {/* Heartbeat indicator */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          {heartbeatIsAlive ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </>
          ) : (
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          )}
        </span>
        <span className={heartbeatIsAlive ? 'text-gray-400' : 'text-red-400'}>
          {heartbeatIsAlive ? 'Heartbeat' : 'Disconnected'}
        </span>
      </div>

      <span className="text-gray-700 dark:text-gray-300">|</span>

      {/* Network type */}
      <div className="flex items-center gap-1.5 text-gray-400">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
        </svg>
        <span>{networkLabel}</span>
      </div>

      <span className="text-gray-700 dark:text-gray-300">|</span>

      {/* Retry count */}
      <div className={`flex items-center gap-1.5 ${retryCount > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
        <span>{retryCount} {retryCount === 1 ? 'retry' : 'retries'}</span>
      </div>

      {/* Idempotency / duplicate prevention active indicator */}
      <span className="text-gray-700 dark:text-gray-300">|</span>
      <div className="flex items-center gap-1.5 text-gray-500" title="Duplicate prevention is active">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Dedup</span>
      </div>
    </div>
  );
};
