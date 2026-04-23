import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { interviewApi } from '../../api/interview.api';
import { evaluationApi } from '../../api/evaluation.api';
import { Loading } from '../../components/common/Loading';

interface InterviewRecord {
  id: string;
  title: string;
  mode: string;
  status: string;
  createdAt: string;
  score?: number;
  weaknesses?: string[];
}

interface EvaluationMetrics {
  correctness: number;
  similarity: number;
  communication: number;
  technicalDepth: number;
}

interface EvaluationData {
  questionIndex: number;
  score: number;
  label: string;
  metrics: EvaluationMetrics;
  conceptsCovered: string[];
  conceptsMissed: string[];
}

interface InterviewWithEval {
  interview: InterviewRecord;
  evaluations: EvaluationData[];
  avgScore: number;
}

export const ProgressPage: React.FC = () => {
  const [data, setData] = useState<InterviewWithEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const interviewRes = await interviewApi.list({ limit: 20, status: 'COMPLETED' });
      const interviews: InterviewRecord[] = interviewRes.data.interviews ?? interviewRes.data ?? [];

      // Fetch evaluations for each interview
      const results: InterviewWithEval[] = [];
      for (const interview of interviews) {
        try {
          const evalRes = await evaluationApi.getByInterviewId(interview.id);
          const evals: EvaluationData[] = evalRes.data.evaluations ?? evalRes.data ?? [];
          const avgScore =
            evals.length > 0 ? evals.reduce((s, e) => s + e.score, 0) / evals.length : 0;
          results.push({ interview, evaluations: evals, avgScore });
        } catch {
          // If evaluations fail for one interview, include it with zero score
          results.push({ interview, evaluations: [], avgScore: interview.score ?? 0 });
        }
      }

      // Sort by date ascending
      results.sort(
        (a, b) =>
          new Date(a.interview.createdAt).getTime() - new Date(b.interview.createdAt).getTime()
      );

      setData(results);
    } catch {
      setError('Failed to load progress data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: new Date(d.interview.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        score: Math.round(d.avgScore),
      })),
    [data]
  );

  const stats = useMemo(() => {
    if (data.length === 0) {
      return { avgScore: 0, bestScore: 0, latestScore: 0, trend: 0, improvementAreas: [] as string[] };
    }

    const scores = data.map((d) => d.avgScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const latestScore = scores[scores.length - 1];

    // Trend: compare latest 3 vs first 3
    const recentSlice = scores.slice(-3);
    const earlySlice = scores.slice(0, 3);
    const recentAvg = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
    const earlyAvg = earlySlice.reduce((a, b) => a + b, 0) / earlySlice.length;
    const trend = recentAvg - earlyAvg;

    // Aggregate weaknesses from the latest evaluations
    const weaknessMap: Record<string, number> = {};
    const recent = data.slice(-5);
    for (const item of recent) {
      for (const ev of item.evaluations) {
        for (const missed of ev.conceptsMissed) {
          weaknessMap[missed] = (weaknessMap[missed] || 0) + 1;
        }
        // Check low metrics
        if (ev.metrics.correctness < 0.5) weaknessMap['Correctness'] = (weaknessMap['Correctness'] || 0) + 1;
        if (ev.metrics.communication < 0.5) weaknessMap['Communication'] = (weaknessMap['Communication'] || 0) + 1;
        if (ev.metrics.technicalDepth < 0.5) weaknessMap['Technical Depth'] = (weaknessMap['Technical Depth'] || 0) + 1;
      }
    }

    const improvementAreas = Object.entries(weaknessMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area]) => area);

    return { avgScore, bestScore, latestScore, trend, improvementAreas };
  }, [data]);

  const last5 = useMemo(() => data.slice(-5).reverse(), [data]);

  if (loading) {
    return <Loading message="Loading progress data..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Progress</h1>
      <p className="text-sm text-gray-500 mb-6">Track your interview performance over time</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="text-sm text-red-600 dark:text-red-400 underline hover:text-red-800 mt-1"
          >
            Retry
          </button>
        </div>
      )}

      {data.length === 0 && !error ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No completed interviews yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Complete your first interview to start tracking progress.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Average Score</span>
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.avgScore)}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Best Score</span>
              </div>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.round(stats.bestScore)}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wider">Latest Score</span>
              </div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.latestScore)}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                {stats.trend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500 uppercase tracking-wider">Trend</span>
              </div>
              <span
                className={`text-3xl font-bold ${
                  stats.trend >= 0 ? 'text-green-600' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stats.trend >= 0 ? '+' : ''}
                {Math.round(stats.trend)}
              </span>
            </div>
          </div>

          {/* Score trend chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Score Trend Over Time</h2>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                Complete more interviews to see a trend line.
              </div>
            )}
          </div>

          {/* Improvement areas + Recent interviews */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Improvement areas */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Areas for Improvement</h2>
              {stats.improvementAreas.length > 0 ? (
                <ul className="space-y-2">
                  {stats.improvementAreas.map((area, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      {area}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No specific areas identified yet.</p>
              )}
            </div>

            {/* Recent interviews comparison table */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Last 5 Interviews</h2>
              {last5.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left py-2 text-xs text-gray-500 font-medium">Date</th>
                        <th className="text-left py-2 text-xs text-gray-500 font-medium">Title</th>
                        <th className="text-left py-2 text-xs text-gray-500 font-medium">Mode</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">Score</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">Questions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {last5.map((item) => {
                        const scoreColor =
                          item.avgScore >= 70
                            ? 'text-green-600 dark:text-green-400'
                            : item.avgScore >= 40
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400';
                        return (
                          <tr
                            key={item.interview.id}
                            className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="py-2.5 text-gray-600 dark:text-gray-400">
                              {new Date(item.interview.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
                              {item.interview.title}
                            </td>
                            <td className="py-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                {item.interview.mode}
                              </span>
                            </td>
                            <td className={`py-2.5 text-right font-bold ${scoreColor}`}>
                              {Math.round(item.avgScore)}
                            </td>
                            <td className="py-2.5 text-right text-gray-500">
                              {item.evaluations.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No completed interviews to display.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
