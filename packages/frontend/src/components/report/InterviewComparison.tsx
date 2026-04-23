import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { reportApi } from '../../api/report.api';

interface InterviewComparisonProps {
  interviewIdA: string;
  interviewIdB: string;
}

interface ReportSummary {
  interviewId: string;
  overallScore: number;
  overallLabel: string;
  strengths: string[];
  weaknesses: string[];
  categoryScores?: Record<string, number>;
  voiceSummary?: {
    avgSpeakingRate: number;
    totalFillerWords: number;
  };
  questionFeedback?: Array<{ category: string; score: number }>;
}

interface DimensionComparison {
  dimension: string;
  scoreA: number;
  scoreB: number;
}

function buildCategoryScores(report: ReportSummary): Record<string, number> {
  if (report.categoryScores) return report.categoryScores;
  if (!report.questionFeedback) return {};
  const map: Record<string, { total: number; count: number }> = {};
  for (const fb of report.questionFeedback) {
    if (!map[fb.category]) map[fb.category] = { total: 0, count: 0 };
    map[fb.category].total += fb.score;
    map[fb.category].count += 1;
  }
  const result: Record<string, number> = {};
  for (const [cat, { total, count }] of Object.entries(map)) {
    result[cat] = Math.round((total / count) * 10) / 10;
  }
  return result;
}

function DiffIndicator({ diff }: { diff: number }) {
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600 dark:text-green-400">
        <ArrowUp className="w-3.5 h-3.5" />+{diff.toFixed(1)}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600 dark:text-red-400">
        <ArrowDown className="w-3.5 h-3.5" />{diff.toFixed(1)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-400">
      <Minus className="w-3.5 h-3.5" />0
    </span>
  );
}

const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-6 bg-gray-200 rounded w-1/3" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-32 bg-gray-200 rounded-xl" />
    </div>
    <div className="h-64 bg-gray-200 rounded-xl" />
  </div>
);

export const InterviewComparison: React.FC<InterviewComparisonProps> = ({
  interviewIdA,
  interviewIdB,
}) => {
  const [reportA, setReportA] = useState<ReportSummary | null>(null);
  const [reportB, setReportB] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoth = async () => {
      setLoading(true);
      setError(null);
      try {
        const [resA, resB] = await Promise.all([
          reportApi.getByInterviewId(interviewIdA),
          reportApi.getByInterviewId(interviewIdB),
        ]);
        setReportA(resA.data);
        setReportB(resB.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'Failed to load reports for comparison.',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchBoth();
  }, [interviewIdA, interviewIdB]);

  if (loading) return <Skeleton />;

  if (error || !reportA || !reportB) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">{error || 'Unable to compare interviews.'}</p>
      </div>
    );
  }

  // Build dimension data
  const catA = buildCategoryScores(reportA);
  const catB = buildCategoryScores(reportB);
  const allCategories = Array.from(
    new Set([...Object.keys(catA), ...Object.keys(catB)]),
  );
  const dimensionData: DimensionComparison[] = allCategories.map((dim) => ({
    dimension: dim,
    scoreA: catA[dim] ?? 0,
    scoreB: catB[dim] ?? 0,
  }));

  const overallDiff = reportB.overallScore - reportA.overallScore;

  // Metric rows
  const metrics: Array<{ label: string; valueA: string; valueB: string; diff: number }> = [
    {
      label: 'Overall Score',
      valueA: `${reportA.overallScore}/10`,
      valueB: `${reportB.overallScore}/10`,
      diff: overallDiff,
    },
  ];

  if (reportA.voiceSummary && reportB.voiceSummary) {
    metrics.push({
      label: 'Speaking Rate (wpm)',
      valueA: String(reportA.voiceSummary.avgSpeakingRate),
      valueB: String(reportB.voiceSummary.avgSpeakingRate),
      diff:
        reportB.voiceSummary.avgSpeakingRate -
        reportA.voiceSummary.avgSpeakingRate,
    });
    metrics.push({
      label: 'Filler Words',
      valueA: String(reportA.voiceSummary.totalFillerWords),
      valueB: String(reportB.voiceSummary.totalFillerWords),
      // Fewer fillers is better, so invert
      diff: -(
        reportB.voiceSummary.totalFillerWords -
        reportA.voiceSummary.totalFillerWords
      ),
    });
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        Interview Comparison
      </h3>

      {/* Side-by-side score cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 mb-1">Interview A</p>
          <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-200">
            {reportA.overallScore}/10
          </p>
          <p className="text-sm text-gray-500 capitalize mt-1">
            {reportA.overallLabel}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 mb-1">Interview B</p>
          <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-200">
            {reportB.overallScore}/10
          </p>
          <p className="text-sm text-gray-500 capitalize mt-1">
            {reportB.overallLabel}
          </p>
          <div className="mt-1">
            <DiffIndicator diff={overallDiff} />
          </div>
        </div>
      </div>

      {/* Metrics table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                Metric
              </th>
              <th className="text-center px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                Interview A
              </th>
              <th className="text-center px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                Interview B
              </th>
              <th className="text-center px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {metrics.map((m, i) => (
              <tr key={i}>
                <td className="px-5 py-3 text-gray-800 dark:text-gray-200 font-medium">
                  {m.label}
                </td>
                <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">
                  {m.valueA}
                </td>
                <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">
                  {m.valueB}
                </td>
                <td className="px-5 py-3 text-center">
                  <DiffIndicator diff={m.diff} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grouped Bar Chart */}
      {dimensionData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Category Score Comparison
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dimensionData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="dimension"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="scoreA"
                  name="Interview A"
                  fill="#818cf8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="scoreB"
                  name="Interview B"
                  fill="#34d399"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
