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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { UsageChart } from '../components/charts/UsageChart';
import { ScoreDistribution } from '../components/charts/ScoreDistribution';
import { API_URL } from '../config/env';
import { formatDate } from '../utils/formatters';

interface Analytics {
  totalUsers: number;
  totalInterviews: number;
  avgScore: number;
  completionRate: number;
  activeInterviews: number;
  recentInterviews: any[];
  systemHealthy: boolean;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ title, value, subtitle, icon, color }: StatCardProps) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="subtitle2" color="textSecondary">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ my: 1, fontWeight: 'bold' }}>
            {value}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: color,
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_URL}/admin/system/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch analytics');

        const json = await response.json();
        setAnalytics({
          totalUsers: json.totalUsers ?? 0,
          totalInterviews: json.totalInterviews ?? 0,
          avgScore: json.avgScore ?? json.averageScore ?? 0,
          completionRate: json.completionRate ?? 0,
          activeInterviews: json.activeInterviews ?? 0,
          recentInterviews: json.recentInterviews ?? [],
          systemHealthy: json.systemHealthy ?? true,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

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
        <Typography color="error">Error loading dashboard: {error}</Typography>
      </Box>
    );
  }

  const data = analytics!;

  return (
    <Box>
      <Title title="Admin Dashboard" />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Chip
          icon={<DotIcon sx={{ fontSize: 12 }} />}
          label={data.systemHealthy ? 'System Healthy' : 'System Issues'}
          color={data.systemHealthy ? 'success' : 'error'}
          size="small"
          variant="outlined"
        />
        {data.activeInterviews > 0 && (
          <Chip
            label={`${data.activeInterviews} Active Interview${data.activeInterviews !== 1 ? 's' : ''}`}
            color="info"
            size="small"
          />
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={data.totalUsers.toLocaleString()}
            subtitle="Registered users"
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Interviews"
            value={data.totalInterviews.toLocaleString()}
            subtitle="All time"
            icon={<AssignmentIcon />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Score"
            value={`${data.avgScore.toFixed(1)}%`}
            subtitle="Across all interviews"
            icon={<TrendingUpIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completion Rate"
            value={`${data.completionRate.toFixed(1)}%`}
            subtitle="Interviews completed"
            icon={<CheckCircleIcon />}
            color="#2e7d32"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Interview Volume
              </Typography>
              <UsageChart />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Score Distribution
              </Typography>
              <ScoreDistribution />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {data.recentInterviews.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Interviews
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recentInterviews.slice(0, 10).map((interview: any) => (
                  <TableRow key={interview.id}>
                    <TableCell>{interview.userEmail || interview.userId || '--'}</TableCell>
                    <TableCell>
                      <Chip label={interview.mode || '--'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={interview.status || '--'}
                        size="small"
                        color={
                          interview.status === 'completed'
                            ? 'success'
                            : interview.status === 'in_progress'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{interview.difficulty || '--'}</TableCell>
                    <TableCell>
                      {interview.overallScore != null
                        ? `${interview.overallScore.toFixed(1)}%`
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {interview.startedAt ? formatDate(interview.startedAt) : '--'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
