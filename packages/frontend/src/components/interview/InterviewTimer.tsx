import React from 'react';

interface InterviewTimerProps {
  seconds: number;
  formatted: string;
  isRunning: boolean;
  hasDuration: boolean;
  totalDurationSeconds?: number;
}

export const InterviewTimer: React.FC<InterviewTimerProps> = ({
  seconds,
  formatted,
  isRunning,
  hasDuration,
  totalDurationSeconds,
}) => {
  if (!hasDuration) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-sm text-gray-500 font-medium">No time limit</span>
        <span className="text-lg font-mono text-gray-600 dark:text-gray-400">{formatted}</span>
      </div>
    );
  }

  const ratio = totalDurationSeconds ? seconds / totalDurationSeconds : 1;
  const isLow = ratio < 0.25;
  const isMedium = ratio >= 0.25 && ratio < 0.5;
  const isPulsing = seconds < 60 && seconds > 0;

  let colorClass = 'text-green-600 dark:text-green-400';
  let dotColor = 'bg-green-500';
  if (isLow) {
    colorClass = 'text-red-600 dark:text-red-400';
    dotColor = 'bg-red-500';
  } else if (isMedium) {
    colorClass = 'text-yellow-600 dark:text-yellow-400';
    dotColor = 'bg-yellow-500';
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${dotColor} ${
          isRunning ? 'animate-pulse' : ''
        }`}
      />
      <span
        className={`text-2xl font-mono font-bold tabular-nums ${colorClass} ${
          isPulsing ? 'animate-pulse' : ''
        }`}
      >
        {formatted}
      </span>
      {seconds === 0 && hasDuration && (
        <span className="text-xs text-red-500 font-semibold uppercase">Time&apos;s up</span>
      )}
    </div>
  );
};
