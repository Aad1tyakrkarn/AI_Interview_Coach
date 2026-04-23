import React from 'react';

interface ScoreCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { outer: 64, stroke: 4, fontSize: 'text-sm', labelSize: 'text-xs', gap: 'gap-1' },
  md: { outer: 96, stroke: 6, fontSize: 'text-xl', labelSize: 'text-sm', gap: 'gap-2' },
  lg: { outer: 144, stroke: 8, fontSize: 'text-3xl', labelSize: 'text-base', gap: 'gap-3' },
};

function getScoreColor(value: number): { ring: string; text: string; bg: string } {
  if (value >= 70) return { ring: 'stroke-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' };
  if (value >= 40) return { ring: 'stroke-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' };
  return { ring: 'stroke-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' };
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ label, value, icon, size = 'md' }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const cfg = sizeConfig[size];
  const radius = (cfg.outer - cfg.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const colors = getScoreColor(clamped);

  return (
    <div className={`flex flex-col items-center ${cfg.gap}`}>
      <div className="relative" style={{ width: cfg.outer, height: cfg.outer }}>
        <svg
          width={cfg.outer}
          height={cfg.outer}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={cfg.outer / 2}
            cy={cfg.outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-gray-200"
            strokeWidth={cfg.stroke}
          />
          {/* Progress arc */}
          <circle
            cx={cfg.outer / 2}
            cy={cfg.outer / 2}
            r={radius}
            fill="none"
            className={colors.ring}
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Center number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${cfg.fontSize} ${colors.text}`}>{clamped}</span>
        </div>
      </div>

      {/* Label */}
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-gray-500">{icon}</span>}
        <span className={`font-medium text-gray-700 dark:text-gray-300 ${cfg.labelSize}`}>{label}</span>
      </div>
    </div>
  );
};
