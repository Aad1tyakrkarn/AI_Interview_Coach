import { useState, useEffect, useCallback } from 'react';
import { Title } from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from '@mui/material';
import {
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { API_URL } from '../../config/env';
import { formatDate } from '../../utils/formatters';

interface ActiveInterview {
  id: string;
  userId: string;
  userEmail?: string;
  mode: string;
  status: string;
  startedAt: string;
  duration?: number;
  jobRole?: string;
}

const getElapsedMinutes = (startedAt: string): string => {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
};

export const LiveMonitor = () => {
  const [interviews, setInterviews] = useState<ActiveInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchActive = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `${API_URL}/admin/interviews?status=in_progress&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) throw new Error('Failed to fetch active interviews');

      const json = await response.json();
      setInterviews(json.data || []);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 10000);
    return () => clearInterval(interval);
  }, [fetchActive]);

  return (
    <Box>
      <Title title="Live Interview Monitor" />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4">Live Interview Monitor</Typography>
          <Chip
            icon={<DotIcon sx={{ fontSize: 12, color: 'success.main' }} />}
            label="Live"
            variant="outlined"
            color="success"
            size="small"
          />
        </Box>
        <Typography variant="body2" color="textSecondary">
          Auto-refreshes every 10s | Last: {lastRefreshed.toLocaleTimeString()}
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">Active Interviews</Typography>
            <Chip
              label={loading ? '...' : interviews.length}
              color="primary"
              size="small"
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ py: 2 }}>
              Error: {error}
            </Typography>
          ) : interviews.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: 'center',
                border: '1px dashed #ccc',
                borderRadius: 1,
              }}
            >
              <Typography variant="h6" color="textSecondary">
                No active interviews at this time.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                This view will update automatically when interviews begin.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Job Role</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview.id} hover>
                    <TableCell>
                      {interview.userEmail || interview.userId || '--'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={interview.mode}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{interview.jobRole || '--'}</TableCell>
                    <TableCell>
                      {interview.startedAt
                        ? formatDate(interview.startedAt)
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {interview.startedAt
                        ? getElapsedMinutes(interview.startedAt)
                        : '--'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<DotIcon sx={{ fontSize: 10 }} />}
                        label="In Progress"
                        size="small"
                        color="warning"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
