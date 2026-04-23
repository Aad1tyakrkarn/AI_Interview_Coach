import React from 'react';

interface MetricBarProps {
  label: string;
  value: number;
  maxValue?: number;
}

function getBarColor(percentage: number): string {
  if (percentage >= 70) return 'bg-green-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getBarBgColor(percentage: number): string {
  if (percentage >= 70) return 'bg-green-100 dark:bg-green-900/40';
  if (percentage >= 40) return 'bg-yellow-100 dark:bg-yellow-900/40';
  return 'bg-red-100 dark:bg-red-900/40';
}

export const MetricBar: React.FC<MetricBarProps> = ({ label, value, maxValue = 1 }) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const displayValue = maxValue === 1 ? value.toFixed(2) : `${Math.round(value)}`;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 shrink-0 truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 h-3 rounded-full overflow-hidden relative">
        <div className={`absolute inset-0 ${getBarBgColor(percentage)} rounded-full`} />
        <div
          className={`h-full ${getBarColor(percentage)} rounded-full transition-all duration-500 ease-out relative z-10`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-12 text-right shrink-0">
        {displayValue}
      </span>
    </div>
  );
};
