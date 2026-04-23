import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { reportApi } from '../../api/report.api';
import { voiceApi } from '../../api/voice.api';
import { PdfExportButton } from '../../components/report/PdfExportButton';

interface QuestionFeedback {
  questionIndex: number;
  questionText: string;
  category: string;
  score: number;
  label: string;
  feedback: string;
  conceptsCovered: string[];
  conceptsMissed: string[];
  answerText: string;
  expectedAnswer: string | null;
  timeTaken: number;
  skipped: boolean;
}

interface ImprovementItem {
  area: string;
  suggestion: string;
  priority: number;
}

interface VoiceMetrics {
  speakingRate: number;
  fillerCount: number;
  pauseCount: number;
  totalDuration: number;
  pacing: string;
  clarity: string;
}

interface ReportData {
  overallScore: number;
  overallLabel: string;
  strengths: string[];
  weaknesses: string[];
  questionFeedback: QuestionFeedback[];
  voiceMetrics: VoiceMetrics | null;
  improvementPlan: ImprovementItem[];
  recommendations: string[];
}

/* ---------- Skeleton ---------- */
const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-6 p-6 max-w-5xl mx-auto">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
    <div className="space-y-4">
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  </div>
);

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400 border-blue-300 bg-blue-50 dark:bg-blue-900/20';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20';
  return 'text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20';
}

function getLabelBadge(label: string): string {
  if (label === 'strong') return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
  if (label === 'acceptable') return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
  return 'bg-red-100 dark:bg-red-900/40 text-red-800';
}

/* ---------- Report Page ---------- */
export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = (idx: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const normalizeReport = (raw: any, voiceData: VoiceMetrics | null): ReportData => {
    const summary = raw.summary || {};
    const score = raw.overallScore ?? summary.overallScore ?? 0;
    const scoreNormalized = score > 10 ? score : score * 10;

    const label = scoreNormalized >= 85 ? 'Excellent' : scoreNormalized >= 70 ? 'Good' : scoreNormalized >= 55 ? 'Average' : scoreNormalized >= 40 ? 'Below Average' : 'Needs Improvement';

    const rawFeedback = raw.questionFeedback ?? [];
    const questionFeedback: QuestionFeedback[] = rawFeedback.map((fb: any, i: number) => ({
      questionIndex: fb.questionIndex ?? i,
      questionText: fb.questionText ?? `Question ${i + 1}`,
      category: fb.category ?? 'General',
      score: fb.score ?? 0,
      label: fb.label ?? 'not_evaluated',
      feedback: fb.feedback ?? 'No evaluation available.',
      conceptsCovered: fb.conceptsCovered ?? [],
      conceptsMissed: fb.conceptsMissed ?? [],
      answerText: fb.answerText ?? '',
      expectedAnswer: fb.expectedAnswer ?? null,
      timeTaken: fb.timeTaken ?? 0,
      skipped: fb.skipped ?? false,
    }));

    const rawPlan = raw.improvementPlan ?? summary.improvementPlan ?? [];
    const improvementPlan: ImprovementItem[] = rawPlan.map((p: any) => ({
      area: p.area ?? 'General',
      suggestion: p.suggestion ?? '',
      priority: p.priority ?? 0,
    }));

    return {
      overallScore: Math.round(scoreNormalized),
      overallLabel: raw.overallLabel ?? label,
      strengths: raw.strengths ?? summary.strengths ?? [],
      weaknesses: raw.weaknesses ?? summary.weaknesses ?? [],
      questionFeedback,
      voiceMetrics: voiceData,
      improvementPlan,
      recommendations: raw.recommendations ?? (raw.practiceRecommendations || []).map((r: any) =>
        typeof r === 'string' ? r : r.reason || r.topic || ''
      ),
    };
  };

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch report and voice metrics in parallel
        const [reportRes, voiceRes] = await Promise.allSettled([
          reportApi.getByInterviewId(id).catch(async () => {
            // If not found, try to generate
            return reportApi.generateReport(id);
          }),
          voiceApi.getMetrics(id),
        ]);

        let voiceData: VoiceMetrics | null = null;
        if (voiceRes.status === 'fulfilled') {
          const vRaw = voiceRes.value?.data;
          const om = vRaw?.overallMetrics || {};
          voiceData = {
            speakingRate: vRaw?.speakingRate ?? om.avgSpeakingRate ?? 0,
            fillerCount: vRaw?.fillerCount ?? om.totalFillerWords ?? 0,
            pauseCount: vRaw?.pauseCount ?? 0,
            totalDuration: vRaw?.totalDuration ?? om.totalDuration ?? 0,
            pacing: vRaw?.pacing ?? 'unknown',
            clarity: vRaw?.clarity ?? 'unknown',
          };
        }

        if (reportRes.status === 'fulfilled') {
          setReport(normalizeReport(reportRes.value.data, voiceData));
        } else {
          setError('Failed to load report. Please try again later.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) return <Skeleton />;

  if (error || !report) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error || 'Report unavailable.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/review/${id}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Review
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Report</h1>
        </div>
        {id && <PdfExportButton interviewId={id} />}
      </div>

      {/* ========== 1. OVERALL SCORE ========== */}
      <div className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 ${getScoreColor(report.overallScore)}`}>
        <span className="text-6xl font-extrabold">{report.overallScore}</span>
        <span className="text-lg font-semibold mt-1">/100</span>
        <span className="mt-2 text-sm font-medium capitalize">{report.overallLabel}</span>
      </div>

      {/* ========== 2. STRENGTHS & WEAKNESSES ========== */}
      {(report.strengths.length > 0 || report.weaknesses.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report.strengths.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">Strengths</h2>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.weaknesses.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-3">Areas for Improvement</h2>
              <ul className="space-y-2">
                {report.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ========== 3. PER-QUESTION FEEDBACK ========== */}
      {report.questionFeedback.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Per-Question Feedback</h2>
          <div className="space-y-3">
            {report.questionFeedback.map((fb, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleQuestion(i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 shrink-0">
                      {fb.questionIndex + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{fb.questionText}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getLabelBadge(fb.label)}`}>
                          {fb.label.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">Score: {fb.score}%</span>
                        {fb.skipped && <span className="text-xs text-orange-500">Skipped</span>}
                      </div>
                    </div>
                  </div>
                  {expandedQuestions.has(i) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>

                {expandedQuestions.has(i) && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                    {/* Your Answer */}
                    {fb.answerText && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Your Answer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          {fb.answerText}
                        </p>
                      </div>
                    )}

                    {/* Model Answer */}
                    {fb.expectedAnswer && (
                      <div>
                        <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Model Answer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          {fb.expectedAnswer}
                        </p>
                      </div>
                    )}

                    {/* Feedback */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Feedback</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{fb.feedback}</p>
                    </div>

                    {/* Concepts */}
                    {(fb.conceptsCovered.length > 0 || fb.conceptsMissed.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {fb.conceptsCovered.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Covered</p>
                            <div className="flex flex-wrap gap-1">
                              {fb.conceptsCovered.map((c, ci) => (
                                <span key={ci} className="text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {fb.conceptsMissed.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Missed</p>
                            <div className="flex flex-wrap gap-1">
                              {fb.conceptsMissed.map((c, ci) => (
                                <span key={ci} className="text-xs bg-red-100 dark:bg-red-900/40 text-red-800 px-2 py-0.5 rounded">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== 4. VOICE ANALYSIS ========== */}
      {report.voiceMetrics && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Voice Analysis</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <VoiceMetricCard
              label="Speaking Rate"
              value={`${report.voiceMetrics.speakingRate}`}
              unit="wpm"
              quality={report.voiceMetrics.speakingRate >= 120 && report.voiceMetrics.speakingRate <= 160 ? 'good' : 'warning'}
            />
            <VoiceMetricCard
              label="Filler Words"
              value={`${report.voiceMetrics.fillerCount}`}
              unit="detected"
              quality={report.voiceMetrics.fillerCount <= 5 ? 'good' : report.voiceMetrics.fillerCount <= 15 ? 'warning' : 'poor'}
            />
            <VoiceMetricCard
              label="Pauses"
              value={`${report.voiceMetrics.pauseCount}`}
              unit="total"
              quality={report.voiceMetrics.pauseCount <= 10 ? 'good' : 'warning'}
            />
            <VoiceMetricCard
              label="Clarity"
              value={report.voiceMetrics.clarity}
              unit=""
              quality={report.voiceMetrics.clarity === 'good' ? 'good' : 'warning'}
            />
            <VoiceMetricCard
              label="Pacing"
              value={report.voiceMetrics.pacing}
              unit=""
              quality={report.voiceMetrics.pacing === 'good' ? 'good' : 'warning'}
            />
          </div>
        </div>
      )}

      {/* ========== 5. IMPROVEMENT PLAN ========== */}
      {report.improvementPlan.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Improvement Plan</h2>
          <div className="space-y-3">
            {report.improvementPlan.map((item, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                  {item.priority || i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.area}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{item.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h2>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <svg className="w-4 h-4 mt-0.5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Voice Metric Card ---------- */
interface VoiceMetricCardProps {
  label: string;
  value: string;
  unit: string;
  quality: 'good' | 'warning' | 'poor';
}

const VoiceMetricCard: React.FC<VoiceMetricCardProps> = ({ label, value, unit, quality }) => {
  const styles = {
    good: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
    warning: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    poor: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
  };
  const dotStyles = { good: 'bg-green-500', warning: 'bg-yellow-500', poor: 'bg-red-500' };

  return (
    <div className={`rounded-xl border p-4 ${styles[quality]}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotStyles[quality]}`} />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-gray-900 dark:text-white capitalize">{value}</span>
        {unit && <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
    </div>
  );
};
