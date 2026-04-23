import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface Dimension {
  name: string;
  score: number;
  weight: number;
}

interface ScoreRadarChartProps {
  dimensions: Dimension[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Dimension }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const dim = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 dark:text-white">{dim.name}</p>
      <p className="text-gray-600 dark:text-gray-400">
        Score: <span className="font-medium text-indigo-600">{dim.score}</span>
      </p>
      <p className="text-gray-500">
        Weight: <span className="font-medium">{dim.weight}x</span>
      </p>
    </div>
  );
};

export const ScoreRadarChart: React.FC<ScoreRadarChartProps> = ({ dimensions }) => {
  const data = dimensions.map((d) => ({
    ...d,
    fullMark: 100,
  }));

  return (
    <div className="w-full" style={{ minHeight: 350 }}>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: '#4b5563', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={() => (
              <span className="text-gray-600 dark:text-gray-400 text-xs">
                {dimensions.map((d) => d.name).join(' | ')}
              </span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
