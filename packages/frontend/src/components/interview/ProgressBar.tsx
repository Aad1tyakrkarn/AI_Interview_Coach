import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  answered: number;
  skipped: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, answered, skipped }) => {
  const percentage = total > 0 ? ((current - 1) / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Question {current} of {total}
        </span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {answered} answered
          </span>
          {skipped > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              {skipped} skipped
            </span>
          )}
        </div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
