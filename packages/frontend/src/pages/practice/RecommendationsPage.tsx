import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Target,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { reportApi } from '../../api/report.api';
import { ReadinessGauge } from '../../components/report/ReadinessGauge';

interface WeakArea {
  area: string;
  currentScore: number;
  targetScore: number;
  suggestion: string;
}

interface ActionStep {
  step: number;
  title: string;
  description: string;
}

interface RecommendationsData {
  weakAreas: WeakArea[];
  missedConcepts: string[];
  actionPlan: ActionStep[];
}

interface ReadinessData {
  readiness: number;
  level: string;
  factors: Array<{ name: string; value: number; impact: string }>;
}

/* ---------- Skeleton ---------- */
const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-6 p-6 max-w-5xl mx-auto">
    <div className="h-8 bg-gray-200 rounded w-1/3" />
    <div className="h-64 bg-gray-200 rounded-xl" />
    <div className="h-48 bg-gray-200 rounded-xl" />
    <div className="h-32 bg-gray-200 rounded-xl" />
    <div className="h-48 bg-gray-200 rounded-xl" />
  </div>
);

/* ---------- Score bar ---------- */
const ScoreBar: React.FC<{ current: number; target: number }> = ({
  current,
  target,
}) => {
  const maxScore = 10;
  const currentPct = (current / maxScore) * 100;
  const targetPct = (target / maxScore) * 100;

  return (
    <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      {/* Current */}
      <div
        className="absolute top-0 left-0 h-full bg-indigo-400 rounded-full transition-all"
        style={{ width: `${currentPct}%` }}
      />
      {/* Target marker */}
      <div
        className="absolute top-0 h-full w-0.5 bg-green-600"
        style={{ left: `${targetPct}%` }}
      />
    </div>
  );
};

/* ---------- Page ---------- */
export const RecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] =
    useState<RecommendationsData | null>(null);
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recRes, readRes] = await Promise.all([
          reportApi.getRecommendations(),
          reportApi.getReadiness(),
        ]);
        setRecommendations(recRes.data);
        setReadiness(readRes.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            'Failed to load recommendations. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartPractice = (area: string) => {
    navigate('/interview/setup', { state: { presetCategory: area } });
  };

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Practice Recommendations
      </h1>

      {/* Readiness Gauge */}
      {readiness && (
        <ReadinessGauge
          readiness={readiness.readiness}
          level={readiness.level}
          factors={readiness.factors}
        />
      )}

      {/* Weak Areas */}
      {recommendations?.weakAreas && recommendations.weakAreas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Areas to Improve
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recommendations.weakAreas.map((area, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {area.area}
                  </h4>
                  <button
                    onClick={() => handleStartPractice(area.area)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Start Practice
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mb-2">
                  <ScoreBar
                    current={area.currentScore}
                    target={area.targetScore}
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>
                      Current:{' '}
                      <span className="font-medium text-indigo-600">
                        {area.currentScore}
                      </span>
                    </span>
                    <span>
                      Target:{' '}
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {area.targetScore}
                      </span>
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">{area.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missed Concepts */}
      {recommendations?.missedConcepts &&
        recommendations.missedConcepts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Concepts to Review
            </h3>
            <div className="flex flex-wrap gap-2">
              {recommendations.missedConcepts.map((concept, i) => (
                <span
                  key={i}
                  className="inline-block px-3 py-1.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* Action Plan */}
      {recommendations?.actionPlan &&
        recommendations.actionPlan.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Action Plan
              </h3>
            </div>
            <div className="p-5">
              <ol className="relative border-l-2 border-indigo-200 ml-4 space-y-6">
                {recommendations.actionPlan.map((step, i) => (
                  <li key={i} className="ml-6">
                    <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full">
                      {step.step || i + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                      {step.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
    </div>
  );
};
