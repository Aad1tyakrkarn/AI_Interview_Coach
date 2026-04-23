import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Typography, CircularProgress, Box } from '@mui/material';
import { API_URL } from '../../config/env';

interface ScoreRange {
  name: string;
  value: number;
}

const COLORS = ['#f44336', '#ff9800', '#4caf50'];

export const ScoreDistribution = () => {
  const [data, setData] = useState<ScoreRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_URL}/admin/system/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch analytics');

        const json = await response.json();
        const distribution = json.scoreDistribution;

        if (distribution && Array.isArray(distribution)) {
          setData(distribution);
        } else {
          // Build distribution from available data
          setData([
            { name: 'Low (0-40)', value: json.lowScoreCount || 0 },
            { name: 'Medium (40-70)', value: json.medScoreCount || 0 },
            { name: 'High (70-100)', value: json.highScoreCount || 0 },
          ]);
        }
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
        Error loading chart: {error}
      </Typography>
    );
  }

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
        No score data available.
      </Typography>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
