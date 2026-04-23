import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { voiceApi } from '../../api/voice.api';
import { scoringApi } from '../../api/scoring.api';
import { getStatusMeta, normaliseStatus } from '../../utils/interviewStatus';

interface InterviewSummary {
  id: string;
  mode: string;
  duration: number;
  questionsAnswered: number;
  totalQuestions: number;
  completedAt: string;
  status: string;
  targetRole: string;
}

interface ScoreSummary {
  overallScore: number;
  label: string;
  dimensions: Array<{ name: string; score: number; weight: number }>;
}

interface VoiceSummary {
  speakingRate: number;
  pauseCount: number;
  fillerWords: number;
  clarity: string;
  pacing: string;
}

type Tab = 'overview' | 'transcript' | 'scores' | 'report';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export const ReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from current path
  const getActiveTab = (): Tab => {
    if (location.pathname.includes('/transcript')) return 'transcript';
    if (location.pathname.includes('/score')) return 'scores';
    if (location.pathname.includes('/report')) return 'report';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<Tab>(getActiveTab());
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [scoreSummary, setScoreSummary] = useState<ScoreSummary | null>(null);
  const [voiceSummary, setVoiceSummary] = useState<VoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [interviewRes, scoreRes, metricsRes] = await Promise.allSettled([
          apiClient.get(`/interviews/${id}`),
          scoringApi.getByInterviewId(id),
          voiceApi.getMetrics(id),
        ]);

        if (interviewRes.status === 'fulfilled') {
          const data = interviewRes.value.data?.data ?? interviewRes.value.data;
          const answeredCount = data.interviewQuestions?.filter((q: any) => q.answerText || q.isAnswered).length
            ?? data.questionsAnswered ?? 0;
          setSummary({
            id: data.id,
            mode: data.mode || 'Standard',
            duration: data.durationMinutes ? data.durationMinutes * 60 : (data.duration || 0),
            questionsAnswered: answeredCount,
            totalQuestions: data.totalQuestions || 0,
            completedAt: data.completedAt || data.endedAt || '',
            status: data.status || 'completed',
            targetRole: data.targetRole || '',
          });
        }

        if (scoreRes.status === 'fulfilled') {
          const raw = scoreRes.value.data;
          setScoreSummary({
            overallScore: raw.overallScore ?? 0,
            label: raw.label ?? 'Unknown',
            dimensions: raw.dimensions ?? [],
          });
        }

        if (metricsRes.status === 'fulfilled') {
          const raw = metricsRes.value.data;
          const om = raw.overallMetrics || {};
          setVoiceSummary({
            speakingRate: raw.speakingRate ?? om.avgSpeakingRate ?? 0,
            pauseCount: raw.pauseCount ?? 0,
            fillerWords: raw.fillerCount ?? om.totalFillerWords ?? 0,
            clarity: raw.clarity ?? 'unknown',
            pacing: raw.pacing ?? 'unknown',
          });
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load review data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const tabs: { key: Tab; label: string; path: string }[] = [
    { key: 'overview', label: 'Overview', path: `/review/${id}` },
    { key: 'transcript', label: 'Transcript', path: `/review/${id}/transcript` },
    { key: 'scores', label: 'Scores', path: `/review/${id}/score` },
    { key: 'report', label: 'Report', path: `/review/${id}/report` },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-500">Loading review...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-6 text-center">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => navigate(0)}
            className="mt-3 rounded bg-red-100 dark:bg-red-900/40 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="mb-4 flex items-center gap-2">
            <Link
              to="/dashboard"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-900 dark:text-white">Interview Review</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Interview Review
            {summary?.targetRole && (
              <span className="text-base font-normal text-gray-500 ml-2">- {summary.targetRole}</span>
            )}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Status banner — shown when the interview is not yet completed */}
        {summary && normaliseStatus(summary.status) !== 'completed' && normaliseStatus(summary.status) !== 'abandoned' && (() => {
          const meta = getStatusMeta(summary.status);
          return (
            <div className="mb-6 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                      This interview isn't finished yet
                    </h3>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                    {meta.description} The review will be available once the interview is completed.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 sm:ml-4">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-amber-900 dark:text-amber-200 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to dashboard
                </Link>
                <Link
                  to={`/interview/${summary.id}`}
                  className={`inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${meta.actionClass}`}
                >
                  {meta.actionLabel}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Summary cards */}
        {summary && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label="Mode" value={summary.mode} />
            <SummaryCard label="Duration" value={formatDuration(summary.duration)} />
            <SummaryCard label="Questions" value={`${summary.questionsAnswered} / ${summary.totalQuestions}`} />
            <SummaryCard label="Status" value={getStatusMeta(summary.status).label} />
            {scoreSummary && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Overall Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(scoreSummary.overallScore)}`}>
                  {scoreSummary.overallScore}%
                </p>
                <p className="text-xs text-gray-400">{scoreSummary.label}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key !== 'overview') {
                    navigate(tab.path);
                  } else {
                    navigate(`/review/${id}`);
                  }
                }}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview content (only shown when on overview tab) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Score overview */}
            {scoreSummary && scoreSummary.dimensions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Score Highlights</h2>
                  <Link
                    to={`/review/${id}/score`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                  >
                    View Details
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {scoreSummary.dimensions.slice(0, 4).map(dim => (
                    <div key={dim.name} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className={`text-xl font-bold ${getScoreColor(dim.score)}`}>{dim.score}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dim.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice analysis summary */}
            {voiceSummary && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Analysis</h2>
                  <Link
                    to={`/review/${id}/transcript`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800"
                  >
                    View Transcript
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{voiceSummary.speakingRate}</p>
                    <p className="text-xs text-gray-500">Words/min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{voiceSummary.fillerWords}</p>
                    <p className="text-xs text-gray-500">Filler Words</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">{voiceSummary.clarity}</p>
                    <p className="text-xs text-gray-500">Clarity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">{voiceSummary.pacing}</p>
                    <p className="text-xs text-gray-500">Pacing</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickLink
                to={`/review/${id}/transcript`}
                title="Transcript"
                description="View and edit the interview transcript with voice metrics."
              />
              <QuickLink
                to={`/review/${id}/score`}
                title="Scores"
                description="See per-question evaluations and score breakdown."
              />
              <QuickLink
                to={`/review/${id}/report`}
                title="Full Report"
                description="Strengths, weaknesses, feedback, and improvement plan."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- Helper Components ---------- */
interface SummaryCardProps {
  label: string;
  value: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

interface QuickLinkProps {
  to: string;
  title: string;
  description: string;
}

const QuickLink: React.FC<QuickLinkProps> = ({ to, title, description }) => (
  <Link
    to={to}
    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md transition-shadow group"
  >
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600">{title}</h3>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-400 group-hover:text-blue-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </Link>
);
