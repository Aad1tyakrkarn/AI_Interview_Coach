import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../api/user.api';
import { interviewApi } from '../../api/interview.api';
import {
  getStatusMeta,
  getPrimaryPath,
  normaliseStatus,
  InterviewStatus,
} from '../../utils/interviewStatus';

interface HistoryItem {
  id: string;
  title: string;
  mode: 'PRACTICE' | 'MOCK' | string;
  score: number;
  date: string;
  status: InterviewStatus;
  targetRole?: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalOnServer, setTotalOnServer] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await interviewApi.remove(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      setTotalOnServer((n) => Math.max(0, n - 1));
      setConfirmDeleteId(null);
    } catch { /* user can retry */ } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: res } = await userApi.getHistory(1, 10);
        if (!alive) return;
        const raw = res?.data ?? res?.interviews ?? res?.history ?? res;
        const rawArray = Array.isArray(raw) ? raw : [];
        const items: HistoryItem[] = rawArray.map((item: any) => ({
          id: item.id,
          title: item.title || 'Interview Session',
          mode: item.mode || 'PRACTICE',
          score: item.score ?? item.scores?.[0]?.overallScore ?? 0,
          date: item.date ?? item.completedAt ?? item.startedAt ?? item.createdAt ?? '',
          status: normaliseStatus(item.status),
          targetRole: item.targetRole,
        }));
        setHistory(items);
        setTotalOnServer(res?.pagination?.total ?? items.length);
      } catch { /* empty state is fine */ } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const completed = history.filter((h) => h.status === 'completed' && h.score > 0);
    const avg = completed.length > 0
      ? Math.round(completed.reduce((s, h) => s + h.score, 0) / completed.length)
      : 0;
    const best = completed.length > 0 ? Math.max(...completed.map((h) => h.score)) : 0;
    return { total: totalOnServer || history.length, avg, best };
  }, [history, totalOnServer]);

  const allUnfinished = useMemo(
    () => history.filter((h) => h.status === 'created' || h.status === 'in_progress' || h.status === 'paused'),
    [history],
  );

  const recent = history.slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Hero banner (soft cool tones) ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-gray-900 dark:from-slate-800 dark:via-gray-900 dark:to-gray-950 px-6 py-8 sm:px-8 sm:py-10">
        {/* decorative soft glows */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-sky-400/8 rounded-full blur-2xl" />
        <div className="absolute right-1/3 top-1/2 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-slate-400 text-sm font-medium">{getGreeting()}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              {user?.firstName ? `Welcome back, ${user.firstName}` : 'Welcome back'}
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-md">
              Pick up where you left off or start a new session with Sarah.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/interview/setup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/95 text-slate-800 text-sm font-semibold rounded-lg shadow-sm hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Interview
            </Link>
          </div>
        </div>
      </section>

      {/* ── Unfinished interviews (auto-swipe if multiple) ── */}
      {allUnfinished.length > 0 && <UnfinishedCarousel items={allUnfinished} />}

      {/* ── Stats ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Sessions"
          value={isLoading ? '—' : String(stats.total)}
          subtitle={isLoading ? '' : `${history.filter((h) => h.mode === 'PRACTICE').length} practice · ${history.filter((h) => h.mode === 'MOCK').length} mock`}
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          iconColor="text-blue-600 dark:text-blue-400"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
        />
        <StatCard
          label="Average Score"
          value={isLoading ? '—' : stats.avg > 0 ? `${stats.avg}%` : '—'}
          subtitle={stats.avg >= 70 ? 'Strong performance' : stats.avg >= 40 ? 'Room to improve' : 'After first session'}
          iconBg="bg-emerald-100 dark:bg-emerald-900/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
        <StatCard
          label="Best Score"
          value={isLoading ? '—' : stats.best > 0 ? `${stats.best}%` : '—'}
          subtitle={stats.best > 0 ? 'Personal best' : 'After first session'}
          iconBg="bg-amber-100 dark:bg-amber-900/40"
          iconColor="text-amber-600 dark:text-amber-400"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
          }
        />
      </section>

      {/* ── Recent Interviews ── */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Interviews</h2>
          {stats.total > 0 && (
            <Link
              to="/history"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all ({stats.total})
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-44 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyRecent />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recent.map((item) => (
              <RecentRow
                key={item.id}
                item={item}
                confirming={confirmDeleteId === item.id}
                deleting={deletingId === item.id}
                onAskDelete={() => setConfirmDeleteId(item.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
                onConfirmDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

/* ===================================================================== */
/*                           Sub-components                               */
/* ===================================================================== */

interface StatCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtitle, icon, iconBg, iconColor }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-start gap-4">
    <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{subtitle}</p>
    </div>
  </div>
);

const UnfinishedCarousel: React.FC<{ items: HistoryItem[] }> = ({ items }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const count = items.length;
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  // Drag / swipe state
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const goTo = useCallback((idx: number) => {
    setActiveIdx(((idx % count) + count) % count);
  }, [count]);

  const goNext = useCallback(() => goTo(activeIdx + 1), [activeIdx, goTo]);
  const goPrev = useCallback(() => goTo(activeIdx - 1), [activeIdx, goTo]);

  // Auto-swipe every 5 seconds
  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(goNext, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count, goNext]);

  // Reset auto-timer after any manual interaction
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count > 1) timerRef.current = setInterval(goNext, 5000);
  }, [count, goNext]);

  // Mouse / touch drag handlers
  const onDragStart = (clientX: number) => {
    setDragStartX(clientX);
    setIsDragging(true);
  };
  const onDragMove = (clientX: number) => {
    if (dragStartX === null) return;
    setDragDelta(clientX - dragStartX);
  };
  const onDragEnd = () => {
    if (dragStartX === null) return;
    const threshold = 60;
    if (dragDelta < -threshold) { goNext(); resetTimer(); }
    else if (dragDelta > threshold) { goPrev(); resetTimer(); }
    setDragStartX(null);
    setDragDelta(0);
    setIsDragging(false);
  };

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { goPrev(); resetTimer(); }
    else if (e.key === 'ArrowRight') { goNext(); resetTimer(); }
  };

  // Accent colors per card index for visual distinction
  const accents = [
    { bg: 'bg-amber-50/80 dark:bg-amber-900/15', border: 'border-amber-200/80 dark:border-amber-800/30', icon: 'bg-amber-100 dark:bg-amber-900/40', iconText: 'text-amber-600 dark:text-amber-400', title: 'text-amber-900 dark:text-amber-100', sub: 'text-amber-700/70 dark:text-amber-300/60', btn: 'text-amber-800 dark:text-amber-100 bg-amber-200/50 dark:bg-amber-800/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-700/40', dot: 'bg-amber-500 dark:bg-amber-400', dotOff: 'bg-amber-300/60 dark:bg-amber-700/60' },
    { bg: 'bg-sky-50/80 dark:bg-sky-900/15', border: 'border-sky-200/80 dark:border-sky-800/30', icon: 'bg-sky-100 dark:bg-sky-900/40', iconText: 'text-sky-600 dark:text-sky-400', title: 'text-sky-900 dark:text-sky-100', sub: 'text-sky-700/70 dark:text-sky-300/60', btn: 'text-sky-800 dark:text-sky-100 bg-sky-200/50 dark:bg-sky-800/30 group-hover:bg-sky-200 dark:group-hover:bg-sky-700/40', dot: 'bg-sky-500 dark:bg-sky-400', dotOff: 'bg-sky-300/60 dark:bg-sky-700/60' },
    { bg: 'bg-violet-50/80 dark:bg-violet-900/15', border: 'border-violet-200/80 dark:border-violet-800/30', icon: 'bg-violet-100 dark:bg-violet-900/40', iconText: 'text-violet-600 dark:text-violet-400', title: 'text-violet-900 dark:text-violet-100', sub: 'text-violet-700/70 dark:text-violet-300/60', btn: 'text-violet-800 dark:text-violet-100 bg-violet-200/50 dark:bg-violet-800/30 group-hover:bg-violet-200 dark:group-hover:bg-violet-700/40', dot: 'bg-violet-500 dark:bg-violet-400', dotOff: 'bg-violet-300/60 dark:bg-violet-700/60' },
    { bg: 'bg-emerald-50/80 dark:bg-emerald-900/15', border: 'border-emerald-200/80 dark:border-emerald-800/30', icon: 'bg-emerald-100 dark:bg-emerald-900/40', iconText: 'text-emerald-600 dark:text-emerald-400', title: 'text-emerald-900 dark:text-emerald-100', sub: 'text-emerald-700/70 dark:text-emerald-300/60', btn: 'text-emerald-800 dark:text-emerald-100 bg-emerald-200/50 dark:bg-emerald-800/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-700/40', dot: 'bg-emerald-500 dark:bg-emerald-400', dotOff: 'bg-emerald-300/60 dark:bg-emerald-700/60' },
  ];

  return (
    <div
      className="relative select-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="region"
      aria-label="Unfinished interviews"
      aria-roledescription="carousel"
    >
      {/* Track — all cards laid out horizontally, CSS transform slides */}
      <div className="overflow-hidden rounded-2xl">
        <div
          ref={trackRef}
          className={`flex ${isDragging ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{
            transform: `translateX(calc(-${activeIdx * 100}% + ${isDragging ? dragDelta : 0}px))`,
          }}
          onMouseDown={(e) => { if (count > 1) { e.preventDefault(); onDragStart(e.clientX); } }}
          onMouseMove={(e) => { if (isDragging) onDragMove(e.clientX); }}
          onMouseUp={onDragEnd}
          onMouseLeave={() => { if (isDragging) onDragEnd(); }}
          onTouchStart={(e) => { if (count > 1) onDragStart(e.touches[0].clientX); }}
          onTouchMove={(e) => { if (isDragging) onDragMove(e.touches[0].clientX); }}
          onTouchEnd={onDragEnd}
        >
          {items.map((itm, i) => {
            const m = getStatusMeta(itm.status);
            const href = getPrimaryPath(itm.status, itm.id);
            const a = accents[i % accents.length];
            return (
              <Link
                key={itm.id}
                to={href}
                onClick={(e) => { if (isDragging && Math.abs(dragDelta) > 5) e.preventDefault(); }}
                className={`flex-shrink-0 w-full flex items-center justify-between gap-4 px-5 py-4 ${a.bg} border ${a.border} rounded-2xl hover:shadow-md transition-shadow group`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`shrink-0 w-10 h-10 rounded-xl ${a.icon} flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${a.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${a.title} truncate`}>
                        {itm.title}
                      </p>
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${m.badgeClass}`}>
                        {m.label}
                      </span>
                    </div>
                    <p className={`text-xs ${a.sub} mt-0.5`}>
                      {m.description.split('.')[0]}
                      {itm.date && ` · ${new Date(itm.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold ${a.btn} rounded-lg transition-colors`}>
                  {m.actionLabel}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Dot indicators — only when multiple */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {items.map((_, i) => {
            const a = accents[i % accents.length];
            return (
              <button
                key={i}
                onClick={() => { goTo(i); resetTimer(); }}
                aria-label={`Show interview ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? `w-6 h-2 ${a.dot}`
                    : `w-2 h-2 ${a.dotOff} hover:scale-125`
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

interface RecentRowProps {
  item: HistoryItem;
  confirming: boolean;
  deleting: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

const RecentRow: React.FC<RecentRowProps> = ({
  item,
  confirming,
  deleting,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}) => {
  const meta = getStatusMeta(item.status);
  const primary = getPrimaryPath(item.status, item.id);
  const canDelete = item.status !== 'completed';
  const isPractice = item.mode === 'PRACTICE';

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      {/* Mode indicator bar */}
      <div className={`shrink-0 w-1 h-12 rounded-full ${isPractice ? 'bg-emerald-500' : 'bg-indigo-500'}`} />

      <Link to={primary} className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            isPractice
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
          }`}>
            {isPractice ? 'Practice' : 'Mock'}
          </span>
          {item.date && (
            <span>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          )}
        </div>
      </Link>

      {confirming ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">Delete?</span>
          <button
            onClick={onCancelDelete}
            disabled={deleting}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg"
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
            <span className={`text-sm font-bold tabular-nums ${
              item.score >= 70
                ? 'text-emerald-600 dark:text-emerald-400'
                : item.score >= 40
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400'
            }`}>
              {item.score}%
            </span>
          )}
          <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full ${meta.badgeClass}`}>
            {meta.label}
          </span>
          {canDelete && (
            <button
              onClick={onAskDelete}
              aria-label="Delete"
              title="Delete"
              className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
          <svg
            className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

const EmptyRecent: React.FC = () => (
  <div className="p-10 text-center">
    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    </div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No interviews yet</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-xs mx-auto">
      Start your first session with Sarah — it takes less than a minute to set up.
    </p>
    <Link
      to="/interview/setup"
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
    >
      Start your first interview
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  </div>
);
