import React from 'react';

interface DimensionBreakdown {
  name: string;
  score: number;
}

interface ComparisonItem {
  interviewId: string;
  title: string;
  mode: string;
  date: string;
  overall: number;
  technical: number;
  communication: number;
  confidence: number;
  breakdown: DimensionBreakdown[];
}

interface Differences {
  overall: number;
  technical: number;
  communication: number;
  confidence: number;
}

interface ScoreComparisonProps {
  comparisons: ComparisonItem[];
  differences: Differences;
}

const MODE_BADGE_CLASSES: Record<string, string> = {
  Practice: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  Mock: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  Assessment: 'bg-purple-100 text-purple-700',
};

function getScoreBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

const DiffIndicator: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`flex items-center font-semibold ${isPositive ? 'text-green-600' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? (
          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        {isPositive ? '+' : ''}{value}
      </span>
    </div>
  );
};

const ComparisonCard: React.FC<{ item: ComparisonItem }> = ({ item }) => {
  const badgeClass = MODE_BADGE_CLASSES[item.mode] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  const dimensions = [
    { name: 'Technical', score: item.technical },
    { name: 'Communication', score: item.communication },
    { name: 'Confidence', score: item.confidence },
    ...item.breakdown,
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex-1 min-w-0">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
            {item.mode}
          </span>
          <span className="text-xs text-gray-500">{item.date}</span>
        </div>
      </div>

      {/* Overall score */}
      <div className="text-center mb-5">
        <span className={`text-4xl font-bold ${getScoreTextColor(item.overall)}`}>
          {item.overall}
        </span>
        <p className="text-xs text-gray-500 mt-1">Overall Score</p>
      </div>

      {/* Dimension bars */}
      <div className="space-y-3">
        {dimensions.map((dim) => (
          <div key={dim.name}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">{dim.name}</span>
              <span className={`text-xs font-semibold ${getScoreTextColor(dim.score)}`}>{dim.score}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getScoreBarColor(dim.score)} transition-all duration-500`}
                style={{ width: `${dim.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ScoreComparison: React.FC<ScoreComparisonProps> = ({ comparisons, differences }) => {
  if (comparisons.length < 2) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Select at least two interviews to compare.
      </div>
    );
  }

  const overallImproved = differences.overall >= 0;

  return (
    <div className="space-y-4">
      {/* Improvement badge */}
      <div className="flex justify-center">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
            overallImproved
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}
        >
          {overallImproved ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
            </svg>
          )}
          {overallImproved ? 'Improved' : 'Declined'}
        </span>
      </div>

      {/* Side-by-side cards */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        <ComparisonCard item={comparisons[0]} />

        {/* Difference indicators column */}
        <div className="flex flex-col items-center justify-center gap-2 py-4 px-2 shrink-0">
          <DiffIndicator value={differences.overall} label="Overall" />
          <DiffIndicator value={differences.technical} label="Technical" />
          <DiffIndicator value={differences.communication} label="Comms" />
          <DiffIndicator value={differences.confidence} label="Confidence" />
        </div>

        <ComparisonCard item={comparisons[1]} />
      </div>
    </div>
  );
};
