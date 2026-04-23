import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { voiceApi } from '../../api/voice.api';

interface TranscriptSegment {
  id: string;
  questionIndex: number;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

interface VoiceMetrics {
  speakingRate: number;
  pauseCount: number;
  fillerWords: number;
  averageConfidence: number;
  totalDuration: number;
  silencePercentage: number;
  clarity?: string;
  pacing?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const TranscriptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [metrics, setMetrics] = useState<VoiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [transcriptRes, metricsRes] = await Promise.all([
        voiceApi.getTranscripts(id),
        voiceApi.getMetrics(id).catch(() => null),
      ]);
      // Backend returns an array of transcript records; use the latest one
      const rawTranscripts = transcriptRes.data;
      const transcriptData = Array.isArray(rawTranscripts) ? rawTranscripts[0] : rawTranscripts;
      if (transcriptData) {
        const segs = transcriptData.segments || [];
        // Segments may be stored as JSON; normalize to array
        const segArray = Array.isArray(segs) ? segs : [];
        setSegments(
          segArray.map((s: any, i: number) => ({
            ...s,
            id: s.id || `seg-${i}`,
          })),
        );
        setTranscriptId(transcriptData.id || null);
      }
      if (metricsRes?.data) {
        const raw = metricsRes.data;
        // Normalize: backend may return flat fields or nested overallMetrics
        const om = raw.overallMetrics || {};
        setMetrics({
          speakingRate: raw.speakingRate ?? om.avgSpeakingRate ?? 0,
          pauseCount: raw.pauseCount ?? 0,
          fillerWords: raw.fillerCount ?? om.totalFillerWords ?? 0,
          averageConfidence: raw.averageConfidence ?? 0.7,
          totalDuration: raw.totalDuration ?? om.totalDuration ?? 0,
          silencePercentage: raw.silencePercentage ?? 0,
          clarity: raw.clarity,
          pacing: raw.pacing,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transcript');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, autoScroll]);

  const handleEdit = (segment: TranscriptSegment) => {
    setEditingId(segment.id);
    setEditText(segment.text);
  };

  const handleEditSave = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, text: editText } : s)),
    );
    setEditingId(null);
    setEditText('');
    setHasChanges(true);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveAll = async () => {
    if (!transcriptId) return;
    setIsSaving(true);
    try {
      const fullText = segments.map((s) => s.text).join(' ');
      await voiceApi.updateTranscript(transcriptId, {
        segments,
        fullText,
      });
      setHasChanges(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const speakerColor = (speaker: string): string => {
    if (speaker.toLowerCase().includes('interviewer')) {
      return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 border-blue-200 dark:border-blue-800';
    }
    return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-gray-500">Loading transcript...</span>
        </div>
      </div>
    );
  }

  if (error && segments.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-6 text-center">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 rounded bg-red-100 dark:bg-red-900/40 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Main transcript area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/review/${id}`}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Review
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transcript</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-scroll toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400"
              />
              Auto-scroll
            </label>

            {/* Save button */}
            <button
              onClick={handleSaveAll}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-6 py-2">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Segments list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
          {segments.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No transcript segments found.
            </div>
          ) : (
            <div className="space-y-3">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${speakerColor(segment.speaker)}`}
                      >
                        {segment.speaker}
                      </span>
                      <span className="text-xs text-gray-400">
                        Q{segment.questionIndex + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </span>
                      <span
                        className={`text-xs ${
                          segment.confidence >= 0.9
                            ? 'text-green-600 dark:text-green-400'
                            : segment.confidence >= 0.7
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {Math.round(segment.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {editingId === segment.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSave(segment.id)}
                          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="rounded border border-gray-300 dark:border-gray-600 px-3 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onClick={() => handleEdit(segment)}
                      className="cursor-pointer rounded p-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                      title="Click to edit"
                    >
                      {segment.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics sidebar */}
      <div className="w-72 shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Voice Metrics</h2>
        </div>
        <div className="space-y-4 p-4">
          {metrics ? (
            <>
              <MetricCard
                label="Speaking Rate"
                value={`${metrics.speakingRate}`}
                unit="words/min"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                }
              />
              <MetricCard
                label="Pauses"
                value={`${metrics.pauseCount}`}
                unit="total"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                }
              />
              <MetricCard
                label="Filler Words"
                value={`${metrics.fillerWords}`}
                unit="detected"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                }
              />
              <MetricCard
                label="Avg. Confidence"
                value={`${Math.round(metrics.averageConfidence * 100)}%`}
                unit=""
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                }
              />
              <MetricCard
                label="Total Duration"
                value={formatTime(metrics.totalDuration)}
                unit=""
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
              />
              <MetricCard
                label="Silence"
                value={`${Math.round(metrics.silencePercentage)}%`}
                unit="of total"
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                }
              />
            </>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">
              No metrics available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, icon }) => (
  <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
    <div className="mb-1 flex items-center gap-2 text-gray-500 dark:text-gray-400">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-gray-900 dark:text-white">{value}</span>
      {unit && <span className="text-xs text-gray-400 dark:text-gray-500">{unit}</span>}
    </div>
  </div>
);
