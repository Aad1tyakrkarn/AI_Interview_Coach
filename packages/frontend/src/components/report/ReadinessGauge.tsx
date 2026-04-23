import React from 'react';

interface Factor {
  name: string;
  value: number;
  impact: string;
}

interface ReadinessGaugeProps {
  readiness: number;
  level: string;
  factors: Factor[];
}

function getGaugeColor(value: number): string {
  if (value < 40) return '#ef4444';
  if (value < 70) return '#eab308';
  return '#22c55e';
}

function getImpactColor(impact: string): string {
  switch (impact.toLowerCase()) {
    case 'positive':
      return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
    case 'negative':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900';
  }
}

export const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({
  readiness,
  level,
  factors,
}) => {
  const clampedValue = Math.max(0, Math.min(100, readiness));
  // Semicircle: 180 degrees from left (PI) to right (0)
  // We map 0-100 to angle PI -> 0
  const angle = Math.PI - (clampedValue / 100) * Math.PI;
  const needleX = 100 + 70 * Math.cos(angle);
  const needleY = 100 - 70 * Math.sin(angle);
  const gaugeColor = getGaugeColor(clampedValue);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
      {/* Gauge */}
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 120" className="w-64 h-auto">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Red zone 0-40 */}
          <path
            d="M 20 100 A 80 80 0 0 1 35.36 41.72"
            fill="none"
            stroke="#fecaca"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Yellow zone 40-70 */}
          <path
            d="M 35.36 41.72 A 80 80 0 0 1 100 20"
            fill="none"
            stroke="#fef08a"
            strokeWidth="12"
          />
          <path
            d="M 100 20 A 80 80 0 0 1 131.76 27.84"
            fill="none"
            stroke="#fef08a"
            strokeWidth="12"
          />
          {/* Green zone 70-100 */}
          <path
            d="M 131.76 27.84 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#bbf7d0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2={needleX}
            y2={needleY}
            stroke={gaugeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx="100" cy="100" r="5" fill={gaugeColor} />
          {/* Score text */}
          <text
            x="100"
            y="90"
            textAnchor="middle"
            className="text-2xl font-bold"
            fill={gaugeColor}
            fontSize="24"
            fontWeight="bold"
          >
            {clampedValue}
          </text>
        </svg>

        <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-gray-200">{level}</p>
        <p className="text-xs text-gray-500">Interview Readiness Score</p>
      </div>

      {/* Factors */}
      {factors.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Contributing Factors
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {factors.map((factor, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {factor.name}
                  </p>
                  <span
                    className={`inline-block mt-0.5 px-1.5 py-0.5 text-xs font-medium rounded ${getImpactColor(factor.impact)}`}
                  >
                    {factor.impact}
                  </span>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {factor.value}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
