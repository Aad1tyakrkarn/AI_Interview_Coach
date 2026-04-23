import { useState, useEffect, useCallback } from 'react';
import { Title } from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { API_URL } from '../config/env';
import { formatDate } from '../utils/formatters';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  details?: string;
}

const ACTION_CHOICES = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'VIEW', label: 'View' },
];

const getActionColor = (action: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  switch (action?.toUpperCase()) {
    case 'CREATE':
      return 'success';
    case 'UPDATE':
      return 'warning';
    case 'DELETE':
      return 'error';
    case 'LOGIN':
    case 'LOGOUT':
      return 'info';
    default:
      return 'default';
  }
};

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (search) params.set('q', search);
      if (actionFilter) params.set('action', actionFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`${API_URL}/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const json = await response.json();
      setLogs(json.data || []);
      setTotal(json.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, actionFilter, startDate, endDate]);

  useEffect(() => {
    const debounce = setTimeout(fetchLogs, 300);
    return () => clearTimeout(debounce);
  }, [fetchLogs]);

  return (
    <Box>
      <Title title="Audit Logs" />
      <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
        Audit Logs
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              label="Search logs"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by user, action, or resource..."
              sx={{ minWidth: 250, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={actionFilter}
                label="Action"
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(0);
                }}
              >
                {ACTION_CHOICES.map((choice) => (
                  <MenuItem key={choice.value} value={choice.value}>
                    {choice.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
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
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Resource</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ py: 4 }}
                        >
                          No audit logs found for current filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          {log.timestamp ? formatDate(log.timestamp) : '--'}
                        </TableCell>
                        <TableCell>{log.userEmail || log.userId || '--'}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            color={getActionColor(log.action)}
                          />
                        </TableCell>
                        <TableCell>
                          {log.resource}
                          {log.resourceId ? ` #${log.resourceId}` : ''}
                        </TableCell>
                        <TableCell>{log.ipAddress || '--'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50, 100]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
