import { useState, useEffect } from 'react';
import { Title } from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Chip,
  TextField,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { API_URL } from '../config/env';

interface HourlyData {
  hour: number;
  count: number;
}

interface DailyData {
  date: string;
  count: number;
}

interface PeakUsageData {
  hourly: HourlyData[];
  daily: DailyData[];
  peakHour: number;
  peakCount: number;
}

const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
};

export const PeakUsage = () => {
  const [data, setData] = useState<PeakUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('admin_token');
        const query = new URLSearchParams({
          startDate,
          endDate,
        });
        const response = await fetch(
          `${API_URL}/admin/system/peak-usage?${query}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!response.ok) throw new Error('Failed to fetch peak usage data');

        const json = await response.json();
        const hourlyRaw = json.hourly || [];
        const dailyRaw = json.daily || json.data || [];

        const hourly = hourlyRaw.map((item: any) => ({
          hour: item.hour ?? item.h ?? 0,
          count: item.count ?? item.value ?? 0,
        }));

        const daily = dailyRaw.map((item: any) => ({
          date: item.date || item.day || item.label,
          count: item.count || item.interviews || item.value || 0,
        }));

        let peakHour = 0;
        let peakCount = 0;
        hourly.forEach((h: HourlyData) => {
          if (h.count > peakCount) {
            peakCount = h.count;
            peakHour = h.hour;
          }
        });

        setData({ hourly, daily, peakHour, peakCount });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Title title="Peak Usage Analytics" />
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  const peakData = data!;

  return (
    <Box>
      <Title title="Peak Usage Analytics" />
      <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
        Peak Usage Analytics
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        {peakData.hourly.length > 0 && (
          <Chip
            label={`Peak Hour: ${formatHour(peakData.peakHour)} (${peakData.peakCount} interviews)`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hourly Usage Distribution
              </Typography>
              {peakData.hourly.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={peakData.hourly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={formatHour}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => formatHour(value as number)}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Interviews">
                      {peakData.hourly.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.hour === peakData.peakHour
                              ? '#f44336'
                              : '#1976d2'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
                  No hourly data available for selected range.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Usage Trend
              </Typography>
              {peakData.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={peakData.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1976d2"
                      name="Interviews"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
                  No daily data available for selected range.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
