import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Typography, CircularProgress, Box } from '@mui/material';
import { API_URL } from '../../config/env';

interface UsageData {
  date: string;
  count: number;
}

export const UsageChart = () => {
  const [data, setData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_URL}/admin/system/peak-usage`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch usage data');

        const json = await response.json();
        const dailyData = json.daily || json.data || [];
        setData(
          dailyData.map((item: any) => ({
            date: item.date || item.day || item.label,
            count: item.count || item.interviews || item.value || 0,
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
        Error loading chart: {error}
      </Typography>
    );
  }

  if (data.length === 0) {
    return (
      <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
        No usage data available.
      </Typography>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#1976d2" name="Interviews" />
      </BarChart>
    </ResponsiveContainer>
  );
};
