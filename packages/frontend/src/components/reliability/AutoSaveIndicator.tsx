import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AutoSaveIndicatorProps {
  lastSaved?: string;
  isSaving?: boolean;
  saveFailed?: boolean;
  onForceSave?: () => void;
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

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ago`;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSaved,
  isSaving = false,
  saveFailed = false,
  onForceSave,
}) => {
  const [timeAgoText, setTimeAgoText] = useState<string>('');
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateTimeAgo = useCallback(() => {
    if (lastSaved) {
      setTimeAgoText(getTimeAgo(lastSaved));
    }
  }, [lastSaved]);

  // Update time-ago every second
  useEffect(() => {
    updateTimeAgo();
    tickRef.current = setInterval(updateTimeAgo, 1000);
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
      }
    };
  }, [updateTimeAgo]);

  const handleClick = useCallback(() => {
    if (onForceSave && !isSaving) {
      onForceSave();
    }
  }, [onForceSave, isSaving]);

  let statusIcon: React.ReactNode;
  let statusText: string;
  let statusColor: string;

  if (isSaving) {
    statusIcon = (
      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
    statusText = 'Saving...';
    statusColor = 'text-gray-400';
  } else if (saveFailed) {
    statusIcon = (
      <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
    statusText = 'Save failed';
    statusColor = 'text-red-400';
  } else if (lastSaved) {
    statusIcon = (
      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
    statusText = `Saved ${timeAgoText}`;
    statusColor = 'text-gray-400';
  } else {
    statusIcon = (
      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
    );
    statusText = 'Not saved yet';
    statusColor = 'text-gray-500';
  }

  return (
    <button
      onClick={handleClick}
      disabled={isSaving || !onForceSave}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded text-xs
        ${statusColor}
        ${onForceSave && !isSaving ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'cursor-default'}
        transition-colors duration-200
      `}
      title={onForceSave ? 'Click to save now' : undefined}
      aria-label={statusText}
    >
      {statusIcon}
      <span>{statusText}</span>
    </button>
  );
};
