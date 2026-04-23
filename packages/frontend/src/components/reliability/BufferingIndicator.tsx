import React, { useEffect, useState, useRef } from 'react';

interface BufferingIndicatorProps {
  isBuffering: boolean;
  message?: string;
  onCancel?: () => void;
}

export const BufferingIndicator: React.FC<BufferingIndicatorProps> = ({
  isBuffering,
  message,
  onCancel,
}) => {
  const [progress, setProgress] = useState(0);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);

  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isBuffering) {
      setProgress(0);
      setShowSlowMessage(false);
      setShowCancelButton(false);

      // Animate progress bar with a decelerating pattern
      let currentProgress = 0;
      animationRef.current = setInterval(() => {
        // Progress slows down as it approaches 90%
        const remaining = 90 - currentProgress;
        const increment = Math.max(0.5, remaining * 0.05);
        currentProgress = Math.min(90, currentProgress + increment);
        setProgress(currentProgress);
      }, 100);

      // Show "Taking longer than expected" after 5s
      slowTimerRef.current = setTimeout(() => {
        setShowSlowMessage(true);
      }, 5000);

      // Show cancel button after 10s
      cancelTimerRef.current = setTimeout(() => {
        setShowCancelButton(true);
      }, 10000);
    } else {
      // Complete the progress bar quickly when done
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setProgress(0);
        setShowSlowMessage(false);
        setShowCancelButton(false);
      }, 400);

      return () => clearTimeout(hideTimer);
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
        cancelTimerRef.current = null;
      }
    };
  }, [isBuffering]);

  if (!isBuffering && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60]">
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-transparent">
        <div
          className={`h-full bg-blue-500 transition-all ${
            isBuffering ? 'duration-100' : 'duration-300'
          } ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Message area */}
      {isBuffering && (showSlowMessage || message) && (
        <div className="flex items-center justify-center gap-3 py-2 px-4 bg-white dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 shadow-sm">
          <svg className="animate-spin w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            {message || (showSlowMessage ? 'Taking longer than expected...' : '')}
          </span>

          {showCancelButton && onCancel && (
            <button
              onClick={onCancel}
              className="ml-2 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};
