import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Typography, CircularProgress, Box } from '@mui/material';
import { API_URL } from '../../config/env';

interface DriftDataPoint {
  date: string;
  score: number;
  drift: number;
}

const DRIFT_THRESHOLD = 0.1;

export const MLDriftChart = () => {
  const [data, setData] = useState<DriftDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_URL}/admin/ml-models/drift`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch drift data');

        const json = await response.json();
        const timeline = json.timeline || json.data || [];
        setData(
          timeline.map((item: any) => ({
            date: item.date || item.timestamp || item.label,
            score: item.score ?? item.accuracy ?? 0,
            drift: item.drift ?? item.driftScore ?? 0,
          })),
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ py: 2 }}>
        Error loading drift chart: {error}
      </Typography>
    );
  }

  if (data.length === 0) {
    return (
      <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
        No drift data available.
      </Typography>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" domain={[0, 100]} label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 0.3]} label={{ value: 'Drift', angle: 90, position: 'insideRight' }} />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="score"
          stroke="#1976d2"
          name="Average Score"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="drift"
          stroke="#f44336"
          name="Drift Magnitude"
          strokeWidth={2}
        />
        <ReferenceLine
          yAxisId="right"
          y={DRIFT_THRESHOLD}
          stroke="#ff9800"
          strokeDasharray="5 5"
          label="Drift Threshold"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
