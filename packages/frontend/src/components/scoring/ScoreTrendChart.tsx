import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface TrendDataPoint {
  date: string;
  score: number;
  mode: string;
}

interface ScoreTrendChartProps {
  data: TrendDataPoint[];
}

const MODE_COLORS: Record<string, string> = {
  Practice: '#22c55e',
  Mock: '#3b82f6',
  Assessment: '#8b5cf6',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TrendDataPoint; color: string }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      <p className="text-gray-600 dark:text-gray-400">
        Score: <span className="font-bold" style={{ color: MODE_COLORS[point.mode] || '#6b7280' }}>{point.score}</span>
      </p>
      <p className="text-gray-500">
        Mode: <span className="font-medium">{point.mode}</span>
      </p>
    </div>
  );
};

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ data }) => {
  const avgScore = useMemo(() => {
    if (!data.length) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);
  }, [data]);

  // Group data by mode for separate lines
  const modes = useMemo(() => [...new Set(data.map((d) => d.mode))], [data]);

  // Build chart data with separate keys per mode
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | string>>();
    data.forEach((d) => {
      const existing = dateMap.get(d.date) || { date: d.date };
      existing[d.mode] = d.score;
      dateMap.set(d.date, existing);
    });
    return Array.from(dateMap.values());
  }, [data]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No trend data available yet.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ minHeight: 300 }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <ReferenceLine
            y={avgScore}
            stroke="#9ca3af"
            strokeDasharray="6 4"
            label={{ value: `Avg: ${avgScore}`, position: 'right', fill: '#9ca3af', fontSize: 11 }}
          />
          {modes.map((mode) => (
            <Line
              key={mode}
              type="monotone"
              dataKey={mode}
              name={mode}
              stroke={MODE_COLORS[mode] || '#6b7280'}
              strokeWidth={2}
              dot={{ r: 4, fill: MODE_COLORS[mode] || '#6b7280' }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
