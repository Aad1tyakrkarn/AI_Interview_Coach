import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../../api/user.api';
import { interviewApi } from '../../api/interview.api';
import {
  getStatusMeta,
  getPrimaryPath,
  normaliseStatus,
  InterviewStatus,
} from '../../utils/interviewStatus';

type ModeFilter = 'practice' | 'mock';

interface HistoryItem {
  id: string;
  title: string;
  mode: 'PRACTICE' | 'MOCK' | string;
  status: InterviewStatus;
  score: number;
  date: string;
  duration: number;
}

export const InterviewHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modeTab, setModeTab] = useState<ModeFilter>('practice');
  const [statusFilter, setStatusFilter] = useState<'all' | InterviewStatus>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;

  const loadHistory = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: res } = await userApi.getHistory(pageNum, limit);
      const raw = res?.data ?? res?.interviews ?? res?.history ?? res;
      const rawArray = Array.isArray(raw) ? raw : [];
      const items: HistoryItem[] = rawArray.map((item: any) => ({
        id: item.id,
        title: item.title || 'Interview Session',
        mode: (item.mode || 'PRACTICE').toUpperCase(),
        status: normaliseStatus(item.status),
        score: item.score ?? item.scores?.[0]?.overallScore ?? 0,
        date: item.date ?? item.completedAt ?? item.createdAt ?? item.startedAt ?? '',
        duration: item.duration ?? (item.durationMinutes ? item.durationMinutes * 60 : 0),
      }));
      setHistory(items);
      const pagination = res?.pagination;
      setTotalPages(pagination?.totalPages || Math.ceil((pagination?.total || items.length) / limit) || 1);
    } catch {
      setError('Failed to load interview history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(page);
  }, [page, loadHistory]);

  // Reset status filter when switching mode tabs
  useEffect(() => {
    setStatusFilter('all');
  }, [modeTab]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await interviewApi.remove(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to delete interview.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // ---------------------------- Split by mode ----------------------------
  const modeCounts = useMemo(
    () => ({
      practice: history.filter((h) => h.mode === 'PRACTICE').length,
      mock: history.filter((h) => h.mode === 'MOCK').length,
    }),
    [history],
  );

  const modeItems = useMemo(
    () => history.filter((h) => (modeTab === 'practice' ? h.mode === 'PRACTICE' : h.mode === 'MOCK')),
    [history, modeTab],
  );

  const statusCounts = useMemo(
    () => ({
      all: modeItems.length,
      created: modeItems.filter((h) => h.status === 'created').length,
      in_progress: modeItems.filter((h) => h.status === 'in_progress').length,
      paused: modeItems.filter((h) => h.status === 'paused').length,
      completed: modeItems.filter((h) => h.status === 'completed').length,
      abandoned: modeItems.filter((h) => h.status === 'abandoned').length,
    }),
    [modeItems],
  );

  const filtered = useMemo(
    () => (statusFilter === 'all' ? modeItems : modeItems.filter((h) => h.status === statusFilter)),
    [modeItems, statusFilter],
  );

  const statusChip = (value: 'all' | InterviewStatus, label: string, count: number) => (
    <button
      onClick={() => setStatusFilter(value)}
      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
        statusFilter === value
          ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {label} <span className="opacity-70">({count})</span>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Interview History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Continue an unfinished session or review a past one.
          </p>
        </div>
        <Link
          to="/interview/setup"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Interview
        </Link>
      </header>

      {error && (
        <div className="mb-4 flex items-start justify-between gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Mode tabs — Practice vs Mock */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-4">
        <nav className="-mb-px flex gap-6">
          <ModeTab
            active={modeTab === 'practice'}
            onClick={() => setModeTab('practice')}
            label="Practice"
            count={modeCounts.practice}
            accentClass="border-emerald-500 text-emerald-600 dark:text-emerald-400"
          />
          <ModeTab
            active={modeTab === 'mock'}
            onClick={() => setModeTab('mock')}
            label="Mock Interview"
            count={modeCounts.mock}
            accentClass="border-indigo-500 text-indigo-600 dark:text-indigo-400"
          />
        </nav>
      </div>

      {/* Status filter chips */}
      {modeItems.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {statusChip('all', 'All', statusCounts.all)}
          {statusCounts.created > 0 && statusChip('created', 'Not started', statusCounts.created)}
          {statusCounts.in_progress > 0 && statusChip('in_progress', 'In progress', statusCounts.in_progress)}
          {statusCounts.paused > 0 && statusChip('paused', 'Paused', statusCounts.paused)}
          {statusCounts.completed > 0 && statusChip('completed', 'Completed', statusCounts.completed)}
          {statusCounts.abandoned > 0 && statusChip('abandoned', 'Abandoned', statusCounts.abandoned)}
        </div>
      )}

      {/* Body */}
      {isLoading ? (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 animate-pulse border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="flex-1 h-3 w-40 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
              <div className="h-6 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState modeTab={modeTab} hasAnyInMode={modeItems.length > 0} />
      ) : (
        <div>
          {filtered.map((item) => (
            <Row
              key={item.id}
              item={item}
              formatDuration={formatDuration}
              confirming={confirmDeleteId === item.id}
              deleting={deletingId === item.id}
              onAskDelete={() => setConfirmDeleteId(item.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onConfirmDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Sub-components ---------- */

interface ModeTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  accentClass: string;
}

const ModeTab: React.FC<ModeTabProps> = ({ active, onClick, label, count, accentClass }) => (
  <button
    onClick={onClick}
    className={`-mb-px px-0.5 pb-3 pt-1 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 ${
      active
        ? accentClass
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
    }`}
  >
    {label}
    <span
      className={`text-xs px-1.5 py-0.5 rounded-full ${
        active
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
      }`}
    >
      {count}
    </span>
  </button>
);

interface RowProps {
  item: HistoryItem;
  formatDuration: (s: number) => string;
  confirming: boolean;
  deleting: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

const Row: React.FC<RowProps> = ({
  item,
  formatDuration,
  confirming,
  deleting,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}) => {
  const meta = getStatusMeta(item.status);
  const primary = getPrimaryPath(item.status, item.id);
  const canDelete = item.status !== 'completed';

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 -mx-2 px-2 rounded transition-colors group">
      <Link to={primary} className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
          {item.duration > 0 && <span>· {formatDuration(item.duration)}</span>}
        </div>
      </Link>

      {confirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs text-gray-600 dark:text-gray-300">Delete?</span>
          <button
            onClick={onCancelDelete}
            disabled={deleting}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded"
          >
            {deleting && (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {deleting ? 'Deleting' : 'Delete'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          {item.score > 0 && (
            <span className="hidden sm:inline text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
              {item.score}%
            </span>
          )}
          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${meta.badgeClass}`}>
            {meta.label}
          </span>
          <Link
            to={primary}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${meta.actionClass}`}
          >
            {meta.actionLabel}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          {canDelete && (
            <button
              onClick={onAskDelete}
              aria-label="Delete interview"
              title="Delete interview"
              className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface EmptyStateProps {
  modeTab: ModeFilter;
  hasAnyInMode: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ modeTab, hasAnyInMode }) => {
  const modeLabel = modeTab === 'practice' ? 'practice' : 'mock';
  return (
    <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {hasAnyInMode
          ? `No ${modeLabel} interviews match this filter.`
          : `No ${modeLabel} interviews yet.`}
      </p>
      {!hasAnyInMode && (
        <Link
          to="/interview/setup"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Start a {modeLabel} interview →
        </Link>
      )}
    </div>
  );
};
