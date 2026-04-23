import { useState, useEffect } from 'react';
import { Title, useNotify } from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { API_URL } from '../../config/env';

interface ModelInfo {
  id: string;
  modelName: string;
  version: string;
  isActive: boolean;
}

interface RetrainStatus {
  status: string;
  message: string;
  startedAt?: string;
}

export const RetrainTrigger = () => {
  const notify = useNotify();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [retrainStatus, setRetrainStatus] = useState<RetrainStatus | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(
          `${API_URL}/admin/ml-models?limit=50`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!response.ok) throw new Error('Failed to fetch models');

        const json = await response.json();
        const modelList = (json.data || []).map((m: any) => ({
          id: m.id,
          modelName: m.modelName,
          version: m.version,
          isActive: m.isActive,
        }));
        setModels(modelList);
        if (modelList.length > 0) {
          setSelectedModel(modelList[0].modelName);
        }
      } catch {
        // Models list failed, user can still type
      } finally {
        setModelsLoading(false);
      }
    };
    fetchModels();
  }, []);

  const handleRetrain = async () => {
    if (!selectedModel) {
      notify('Please select a model', { type: 'warning' });
      return;
    }

    setLoading(true);
    setRetrainStatus(null);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_URL}/admin/ml-models/retrain`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelName: selectedModel }),
      });

      if (!response.ok) {
        throw new Error('Retrain request failed');
      }

      const json = await response.json();
      setRetrainStatus({
        status: json.status || 'triggered',
        message: json.message || 'Model retraining has been triggered successfully.',
        startedAt: json.startedAt,
      });
      notify('Model retraining triggered successfully', { type: 'success' });
    } catch {
      setRetrainStatus({
        status: 'error',
        message: 'Failed to trigger model retraining. Please try again.',
      });
      notify('Failed to trigger model retraining', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Title title="Trigger Model Retraining" />
      <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
        Model Retraining
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Select a model and trigger a new training run using the latest
            labeled data to produce updated model weights.
          </Typography>

          <Box
            sx={{
              mt: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            {modelsLoading ? (
              <CircularProgress size={24} />
            ) : (
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Model</InputLabel>
                <Select
                  value={selectedModel}
                  label="Model"
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {models.map((model) => (
                    <MenuItem key={model.id} value={model.modelName}>
                      {model.modelName} (v{model.version})
                      {model.isActive && ' - Active'}
                    </MenuItem>
                  ))}
                  {models.length === 0 && (
                    <MenuItem value="" disabled>
                      No models found
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleRetrain}
              disabled={loading || !selectedModel}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                  Triggering...
                </>
              ) : (
                'Trigger Retraining'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {retrainStatus && (
        <Alert
          severity={retrainStatus.status === 'error' ? 'error' : 'success'}
          sx={{ mb: 3 }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="body2">
                <strong>Status:</strong>
              </Typography>
              <Chip
                label={retrainStatus.status}
                size="small"
                color={retrainStatus.status === 'error' ? 'error' : 'success'}
              />
            </Box>
            <Typography variant="body2">{retrainStatus.message}</Typography>
            {retrainStatus.startedAt && (
              <Typography variant="caption" color="textSecondary">
                Started at: {new Date(retrainStatus.startedAt).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Alert>
      )}
    </Box>
  );
};
