import { useState, useEffect } from 'react';
import { Title } from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { MLDriftChart } from '../../components/charts/MLDriftChart';
import { API_URL } from '../../config/env';

interface DriftSummary {
  currentDrift: number;
  driftStatus: string;
  recommendation: string;
  lastChecked: string;
}

export const DriftDashboard = () => {
  const [summary, setSummary] = useState<DriftSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriftSummary = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_URL}/admin/ml-models/drift`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch drift data');

        const json = await response.json();
        setSummary({
          currentDrift: json.currentDrift ?? json.drift ?? 0,
          driftStatus: json.driftStatus || json.status || 'unknown',
          recommendation: json.recommendation || json.message || '',
          lastChecked: json.lastChecked || json.timestamp || '',
        });
      } catch {
        // Chart component handles its own errors
      } finally {
        setLoading(false);
      }
    };
    fetchDriftSummary();
  }, []);

  const getDriftColor = (
    status: string,
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'normal':
      case 'ok':
        return 'success';
      case 'warning':
      case 'moderate':
        return 'warning';
      case 'critical':
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Title title="ML Model Drift Dashboard" />
      <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
        Model Drift Monitoring
      </Typography>

      {!loading && summary && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Current Drift
              </Typography>
              <Typography variant="h4">
                {(summary.currentDrift * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Drift Status
              </Typography>
              <Chip
                label={summary.driftStatus}
                color={getDriftColor(summary.driftStatus)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
          {summary.lastChecked && (
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Last Checked
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {new Date(summary.lastChecked).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {!loading && summary?.recommendation && (
        <Alert
          severity={
            getDriftColor(summary.driftStatus) === 'error'
              ? 'error'
              : getDriftColor(summary.driftStatus) === 'warning'
                ? 'warning'
                : 'info'
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>Recommendation:</strong> {summary.recommendation}
          </Typography>
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Score Timeline & Drift Detection
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <MLDriftChart />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
