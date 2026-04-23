import React, { useEffect, useState, useCallback } from 'react';
import { scoringApi } from '../../api/scoring.api';
import { ScoreCard } from './ScoreCard';
import { ScoreRadarChart } from './ScoreRadarChart';

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
}

interface ScoreData {
  overall: number;
  dimensions: DimensionScore[];
}

interface ScoreDashboardProps {
  interviewId: string;
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' };
  if (score >= 75) return { label: 'Very Good', color: 'text-green-500' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
  if (score >= 40) return { label: 'Average', color: 'text-yellow-600 dark:text-yellow-400' };
  if (score >= 20) return { label: 'Below Average', color: 'text-orange-600' };
  return { label: 'Needs Improvement', color: 'text-red-600 dark:text-red-400' };
}

/* Skeleton placeholder for the loading state */
const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="flex flex-col items-center gap-4">
      <SkeletonBlock className="w-36 h-36 rounded-full" />
      <SkeletonBlock className="w-28 h-5" />
    </div>
    <SkeletonBlock className="w-full h-80" />
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-28" />
      ))}
    </div>
  </div>
);

export const ScoreDashboard: React.FC<ScoreDashboardProps> = ({ interviewId }) => {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const normalizeScore = (data: any): ScoreData => ({
    overall: data.overall ?? data.overallScore ?? 0,
    dimensions: data.dimensions || [],
  });

  const fetchScore = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);
      const { data } = await scoringApi.getByInterviewId(interviewId);
      setScoreData(normalizeScore(data));
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      } else {
        setError('Failed to load score data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      setError(null);
      const { data } = await scoringApi.calculateScore(interviewId);
      setScoreData(normalizeScore(data));
      setNotFound(false);
    } catch {
      setError('Failed to calculate score. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
        <button
          onClick={fetchScore}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  /* ---------- Score not calculated yet ---------- */
  if (notFound || !scoreData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Score Not Available</h3>
        <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
          Your interview score has not been calculated yet. Click below to analyze your performance.
        </p>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {calculating && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {calculating ? 'Calculating...' : 'Calculate Score'}
        </button>
      </div>
    );
  }

  /* ---------- Main score display ---------- */
  const { label: scoreLabel, color: scoreLabelColor } = getScoreLabel(scoreData.overall);

  return (
    <div className="space-y-8">
      {/* Overall score - centered */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
        <div className="flex flex-col items-center">
          <ScoreCard label="Overall Score" value={scoreData.overall} size="lg" />
          <span className={`mt-2 text-lg font-semibold ${scoreLabelColor}`}>{scoreLabel}</span>
        </div>
      </div>

      {/* Radar chart */}
      {scoreData.dimensions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Performance Breakdown</h2>
          <ScoreRadarChart dimensions={scoreData.dimensions} />
        </div>
      )}

      {/* Individual dimension cards */}
      {scoreData.dimensions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5">Dimension Scores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {scoreData.dimensions.map((dim) => (
              <ScoreCard key={dim.name} label={dim.name} value={dim.score} size="md" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
