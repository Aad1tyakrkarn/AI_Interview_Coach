import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';

interface EvaluationMetrics {
  correctness: number;
  similarity: number;
  communication: number;
  technicalDepth: number;
}

interface EvaluationData {
  questionIndex: number;
  question: string;
  score: number;
  label: 'strong' | 'acceptable' | 'needs_improvement';
  metrics: EvaluationMetrics;
  conceptsCovered: string[];
  conceptsMissed: string[];
  feedback: string;
}

interface EvaluationSummaryProps {
  evaluations: EvaluationData[];
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 40) return 'Below Average';
  return 'Needs Improvement';
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getBarFill(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
  if (confidence >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({ evaluations }) => {
  const stats = useMemo(() => {
    if (evaluations.length === 0) {
      return {
        overallScore: 0,
        avgCorrectness: 0,
        avgSimilarity: 0,
        avgCoverage: 0,
        avgCommunication: 0,
        avgTechnical: 0,
        strengths: [] as string[],
        weaknesses: [] as string[],
        confidence: 0,
      };
    }

    const n = evaluations.length;
    const overallScore = evaluations.reduce((s, e) => s + (e.score || 0), 0) / n;
    const avgCorrectness = evaluations.reduce((s, e) => s + (e.metrics?.correctness || 0), 0) / n;
    const avgSimilarity = evaluations.reduce((s, e) => s + (e.metrics?.similarity || 0), 0) / n;
    const avgCommunication = evaluations.reduce((s, e) => s + (e.metrics?.communication || 0), 0) / n;
    const avgTechnical = evaluations.reduce((s, e) => s + (e.metrics?.technicalDepth || 0), 0) / n;

    const totalCovered = evaluations.reduce((s, e) => s + (e.conceptsCovered?.length || 0), 0);
    const totalConcepts = evaluations.reduce(
      (s, e) => s + (e.conceptsCovered?.length || 0) + (e.conceptsMissed?.length || 0),
      0
    );
    const avgCoverage = totalConcepts > 0 ? totalCovered / totalConcepts : 0;

    // Determine strengths and weaknesses from metrics
    const metricScores: Array<{ name: string; value: number }> = [
      { name: 'Correctness', value: avgCorrectness },
      { name: 'Similarity', value: avgSimilarity },
      { name: 'Communication', value: avgCommunication },
      { name: 'Technical Depth', value: avgTechnical },
      { name: 'Concept Coverage', value: avgCoverage },
    ];

    const sorted = [...metricScores].sort((a, b) => b.value - a.value);
    const strengths = sorted
      .filter((m) => m.value >= 0.6)
      .slice(0, 3)
      .map((m) => `${m.name} (${(m.value * 100).toFixed(0)}%)`);
    const weaknesses = sorted
      .filter((m) => m.value < 0.6)
      .slice(-3)
      .map((m) => `${m.name} (${(m.value * 100).toFixed(0)}%)`);

    // Model confidence: lower variance = higher confidence
    const scoreVariance =
      evaluations.reduce((s, e) => s + Math.pow(e.score - overallScore, 2), 0) / n;
    const maxVariance = 2500; // 50^2
    const confidence = Math.max(0, Math.min(1, 1 - scoreVariance / maxVariance));

    return {
      overallScore,
      avgCorrectness,
      avgSimilarity,
      avgCoverage,
      avgCommunication,
      avgTechnical,
      strengths,
      weaknesses,
      confidence,
    };
  }, [evaluations]);

  const chartData = evaluations.map((e) => ({
    name: `Q${e.questionIndex + 1}`,
    score: Math.round(e.score),
  }));

  const metricCards = [
    { label: 'Correctness', value: stats.avgCorrectness },
    { label: 'Similarity', value: stats.avgSimilarity },
    { label: 'Coverage', value: stats.avgCoverage },
    { label: 'Communication', value: stats.avgCommunication },
    { label: 'Technical', value: stats.avgTechnical },
  ];

  return (
    <div className="space-y-6">
      {/* Top row: Overall score + metric cards */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* Overall score */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 flex flex-col items-center justify-center">
          <span className="text-xs uppercase tracking-wider text-gray-500 mb-1">
            Overall Score
          </span>
          <span className={`text-5xl font-bold ${getScoreColor(stats.overallScore)}`}>
            {Math.round(stats.overallScore)}
          </span>
          <span className={`text-sm font-medium mt-1 ${getScoreColor(stats.overallScore)}`}>
            {getScoreLabel(stats.overallScore)}
          </span>
        </div>

        {/* Metric cards */}
        {metricCards.map((metric) => (
          <div
            key={metric.label}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 flex flex-col"
          >
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              {metric.label}
            </span>
            <span className={`text-2xl font-bold mt-1 ${getScoreColor(metric.value * 100)}`}>
              {(metric.value * 100).toFixed(0)}%
            </span>
            <div className="mt-2 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  metric.value >= 0.7
                    ? 'bg-green-500'
                    : metric.value >= 0.4
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${metric.value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Score distribution chart + strengths/weaknesses + confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Score Distribution by Question
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={getBarFill(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No evaluation data
            </div>
          )}
        </div>

        {/* Strengths, Weaknesses, Confidence */}
        <div className="space-y-4">
          {/* Strengths */}
          <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">Strengths</h4>
            </div>
            {stats.strengths.length > 0 ? (
              <ul className="space-y-1">
                {stats.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 bg-green-500 rounded-full shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No strong areas identified</p>
            )}
          </div>

          {/* Weaknesses */}
          <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h4 className="text-sm font-semibold text-red-800">Areas for Improvement</h4>
            </div>
            {stats.weaknesses.length > 0 ? (
              <ul className="space-y-1">
                {stats.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-1.5">
                    <span className="mt-1.5 w-1 h-1 bg-red-500 rounded-full shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No weak areas identified</p>
            )}
          </div>

          {/* Model Confidence */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Model Confidence</h4>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-2xl font-bold ${getConfidenceColor(stats.confidence)}`}
              >
                {(stats.confidence * 100).toFixed(0)}%
              </span>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.confidence >= 0.8
                      ? 'bg-green-500'
                      : stats.confidence >= 0.5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${stats.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
