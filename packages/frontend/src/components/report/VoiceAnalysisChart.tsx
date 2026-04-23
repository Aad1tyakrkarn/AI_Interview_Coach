import React from 'react';
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
import { Mic, Activity, Volume2 } from 'lucide-react';

interface VoiceSummary {
  avgSpeakingRate: number;
  avgPauseCount: number;
  totalFillerWords: number;
  dominantTone: string;
  topFillerWords: Array<{ word: string; count: number }>;
  speakingRateAssessment: string;
}

interface VoiceAnalysisChartProps {
  voiceSummary: VoiceSummary;
}

const FILLER_COLORS = [
  '#8b5cf6',
  '#a78bfa',
  '#c4b5fd',
  '#ddd6fe',
  '#ede9fe',
];

function getRateColor(rate: number): string {
  if (rate >= 130 && rate <= 160) return 'text-green-600 dark:text-green-400';
  if ((rate >= 110 && rate < 130) || (rate > 160 && rate <= 180))
    return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getToneEmoji(tone: string): string {
  switch (tone.toLowerCase()) {
    case 'confident':
      return '💪';
    case 'nervous':
      return '😰';
    case 'calm':
      return '😌';
    case 'enthusiastic':
      return '🔥';
    case 'monotone':
      return '😐';
    default:
      return '🎤';
  }
}

export const VoiceAnalysisChart: React.FC<VoiceAnalysisChartProps> = ({
  voiceSummary,
}) => {
  const {
    avgSpeakingRate,
    avgPauseCount,
    totalFillerWords,
    dominantTone,
    topFillerWords,
    speakingRateAssessment,
  } = voiceSummary;

  const fillerData = topFillerWords.map((fw) => ({
    name: fw.word,
    count: fw.count,
  }));

  // Speaking rate bar calculation
  const maxRate = 220;
  const ratePercent = Math.min((avgSpeakingRate / maxRate) * 100, 100);
  const idealStart = (130 / maxRate) * 100;
  const idealEnd = (160 / maxRate) * 100;

  return (
    <div className="space-y-6">
      {/* Speaking Rate */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Speaking Rate
          </h4>
        </div>

        <div className="relative mb-3">
          {/* Background bar */}
          <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
            {/* Ideal range highlight */}
            <div
              className="absolute top-0 h-full bg-green-100 dark:bg-green-900/40 border-x-2 border-green-300 dark:border-green-700"
              style={{
                left: `${idealStart}%`,
                width: `${idealEnd - idealStart}%`,
              }}
            />
            {/* Current rate bar */}
            <div
              className={`absolute top-0 h-full rounded-full transition-all ${
                avgSpeakingRate >= 130 && avgSpeakingRate <= 160
                  ? 'bg-green-500'
                  : avgSpeakingRate >= 110 && avgSpeakingRate <= 180
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${ratePercent}%`, opacity: 0.7 }}
            />
          </div>
          {/* Labels */}
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>0</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              130-160 (ideal)
            </span>
            <span>{maxRate}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${getRateColor(avgSpeakingRate)}`}>
            {avgSpeakingRate}
          </span>
          <span className="text-sm text-gray-500">words/min</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{speakingRateAssessment}</p>
      </div>

      {/* Filler Words Chart */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Filler Words
            </h4>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
            Total: {totalFillerWords}
          </span>
        </div>

        {fillerData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fillerData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {fillerData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={FILLER_COLORS[index % FILLER_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">
            No filler words detected.
          </p>
        )}
      </div>

      {/* Tone & Pauses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <Mic className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Dominant Tone
          </p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-200 capitalize">
            {getToneEmoji(dominantTone)} {dominantTone}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 text-center">
          <Activity className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Avg Pauses / Answer
          </p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{avgPauseCount}</p>
        </div>
      </div>
    </div>
  );
};
