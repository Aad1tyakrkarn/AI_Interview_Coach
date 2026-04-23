import { useState, useEffect, useCallback } from 'react';
import { Title } from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as ErrorIcon,
} from '@mui/icons-material';
import { API_URL } from '../config/env';

interface HealthData {
  status: string;
  database: string;
  uptime: number;
  nodeVersion: string;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  counts: {
    users: number;
    interviews: number;
    questions: number;
  };
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const MemoryBar = ({
  label,
  used,
  total,
}: {
  label: string;
  used: number;
  total: number;
}) => {
  const percent = total > 0 ? (used / total) * 100 : 0;
  const color = percent > 90 ? 'error' : percent > 70 ? 'warning' : 'primary';

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="textSecondary">
          {formatBytes(used)} / {formatBytes(total)} ({percent.toFixed(1)}%)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(percent, 100)}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
};

const StatusIndicator = ({ healthy, label }: { healthy: boolean; label: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
    {healthy ? (
      <CheckIcon sx={{ color: 'success.main' }} />
    ) : (
      <ErrorIcon sx={{ color: 'error.main' }} />
    )}
    <Typography variant="body1">{label}</Typography>
    <Chip
      label={healthy ? 'Online' : 'Offline'}
      color={healthy ? 'success' : 'error'}
      size="small"
    />
  </Box>
);

export const SystemHealth = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchHealth = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/system/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch system health');

      const json = await response.json();
      setHealth({
        status: json.status || 'unknown',
        database: json.database || json.db || 'unknown',
        uptime: json.uptime || 0,
        nodeVersion: json.nodeVersion || json.node || 'unknown',
        memory: {
          heapUsed: json.memory?.heapUsed || 0,
          heapTotal: json.memory?.heapTotal || 0,
          rss: json.memory?.rss || 0,
        },
        counts: {
          users: json.counts?.users ?? json.userCount ?? 0,
          interviews: json.counts?.interviews ?? json.interviewCount ?? 0,
          questions: json.counts?.questions ?? json.questionCount ?? 0,
        },
      });
      setError(null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !health) {
    return (
      <Box sx={{ p: 3 }}>
        <Title title="System Health" />
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  const data = health!;
  const serverHealthy = data.status === 'ok' || data.status === 'healthy';
  const dbHealthy = data.database === 'connected' || data.database === 'ok' || data.database === 'healthy';

  return (
    <Box>
      <Title title="System Health" />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 3 }}>
        <Typography variant="h4">System Health</Typography>
        <Typography variant="body2" color="textSecondary">
          Auto-refreshes every 30s | Last: {lastRefreshed.toLocaleTimeString()}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Status
              </Typography>
              <StatusIndicator healthy={serverHealthy} label="API Server" />
              <StatusIndicator healthy={dbHealthy} label="Database" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Server Info
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body1">
                  <strong>Uptime:</strong> {formatUptime(data.uptime)}
                </Typography>
                <Typography variant="body1">
                  <strong>Node Version:</strong> {data.nodeVersion}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage
              </Typography>
              <MemoryBar
                label="Heap Used / Heap Total"
                used={data.memory.heapUsed}
                total={data.memory.heapTotal}
              />
              <MemoryBar
                label="RSS (Resident Set Size)"
                used={data.memory.rss}
                total={data.memory.rss * 1.5}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Record Counts
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Users
                  </Typography>
                  <Typography variant="h5">
                    {data.counts.users.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Interviews
                  </Typography>
                  <Typography variant="h5">
                    {data.counts.interviews.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Questions
                  </Typography>
                  <Typography variant="h5">
                    {data.counts.questions.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
