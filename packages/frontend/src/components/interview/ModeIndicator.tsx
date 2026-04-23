import React, { useState } from 'react';

interface ModeIndicatorProps {
  mode: 'PRACTICE' | 'MOCK' | 'ASSESSMENT';
}

const MODE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; rules: string[] }
> = {
  PRACTICE: {
    label: 'Practice',
    color: 'text-green-800 dark:text-green-300',
    bg: 'bg-green-100 dark:bg-green-900/40',
    border: 'border-green-300 dark:border-green-700',
    rules: [
      'Unlimited pauses allowed',
      'Skip questions freely',
      'Hints available',
      'No time pressure (optional timer)',
    ],
  },
  MOCK: {
    label: 'Mock Simulation',
    color: 'text-yellow-800 dark:text-yellow-300',
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    border: 'border-yellow-300 dark:border-yellow-700',
    rules: [
      'Up to 2 pauses allowed',
      'No skipping questions',
      'No hints available',
      'Timed interview',
    ],
  },
  ASSESSMENT: {
    label: 'Assessment',
    color: 'text-red-800',
    bg: 'bg-red-100 dark:bg-red-900/40',
    border: 'border-red-300 dark:border-red-700',
    rules: [
      'No pauses allowed',
      'No skipping questions',
      'No hints available',
      'Strict time limit',
    ],
  },
};

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ mode }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = MODE_CONFIG[mode] ?? MODE_CONFIG.PRACTICE;

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border cursor-help ${config.bg} ${config.color} ${config.border}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            mode === 'PRACTICE' ? 'bg-green-500' : mode === 'MOCK' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        />
        {config.label}
      </div>

      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
          <p className="font-semibold mb-2">{config.label} Mode Rules:</p>
          <ul className="space-y-1">
            {config.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">-</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
};
