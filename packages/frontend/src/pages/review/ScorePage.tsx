import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { evaluationApi } from '../../api/evaluation.api';
import { scoringApi } from '../../api/scoring.api';
import { voiceApi } from '../../api/voice.api';
import { ScoreCard } from '../../components/scoring/ScoreCard';
import { AlertTriangle } from 'lucide-react';

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
}

interface ScoringData {
  overallScore: number;
  label: string;
  dimensions: DimensionScore[];
  breakdown: Record<string, number> | null;
}

interface QuestionEval {
  questionIndex: number;
  question: string;
  answer: string;
  score: number;
  label: string;
  feedback: string;
  conceptsCovered: string[];
  conceptsMissed: string[];
}

interface VoiceHighlights {
  speakingRate: number;
  fillerCount: number;
  pauseCount: number;
}

type TabId = 'overview' | 'per-question' | 'dimensions';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'per-question', label: 'Per Question' },
  { id: 'dimensions', label: 'Score Breakdown' },
];

function getLabelColor(label: string): string {
  if (label === 'strong' || label === 'Excellent' || label === 'Good') return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
  if (label === 'acceptable' || label === 'Average') return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
  return 'bg-red-100 dark:bg-red-900/40 text-red-800';
}

function getScoreBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export const ScorePage: React.FC = () => {
  const { id: interviewId } = useParams<{ id: string }>();
  const [scoring, setScoring] = useState<ScoringData | null>(null);
  const [evaluations, setEvaluations] = useState<QuestionEval[]>([]);
  const [voiceHighlights, setVoiceHighlights] = useState<VoiceHighlights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!interviewId) return;
    setLoading(true);
    setError(null);

    try {
      const [scoreRes, evalRes, voiceRes] = await Promise.allSettled([
        scoringApi.getByInterviewId(interviewId),
        evaluationApi.getByInterviewId(interviewId),
        voiceApi.getMetrics(interviewId),
      ]);

      // Process scoring data
      if (scoreRes.status === 'fulfilled') {
        const raw = scoreRes.value?.data;
        setScoring({
          overallScore: raw.overallScore ?? 0,
          label: raw.label ?? 'Unknown',
          dimensions: raw.dimensions ?? [],
          breakdown: raw.breakdown ?? null,
        });
      }

      // Process evaluation data
      if (evalRes.status === 'fulfilled') {
        const raw = evalRes.value?.data;
        const evals = raw?.evaluations ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
        if (Array.isArray(evals)) {
          setEvaluations(evals.map((e: any) => {
            const metrics = e.metrics || {};
            return {
              questionIndex: e.questionIndex ?? 0,
              question: metrics.question || e.question || `Question ${(e.questionIndex ?? 0) + 1}`,
              answer: e.answerText || '',
              score: metrics.correctness != null ? Math.round(metrics.correctness * 100) : 0,
              label: metrics.label || 'not_evaluated',
              feedback: metrics.feedback || 'No evaluation available.',
              conceptsCovered: metrics.concepts_covered || metrics.conceptsCovered || [],
              conceptsMissed: metrics.concepts_missed || metrics.conceptsMissed || [],
            };
          }));
        }
      }

      // Process voice highlights
      if (voiceRes.status === 'fulfilled') {
        const raw = voiceRes.value?.data;
        const om = raw.overallMetrics || {};
        setVoiceHighlights({
          speakingRate: raw.speakingRate ?? om.avgSpeakingRate ?? 0,
          fillerCount: raw.fillerCount ?? om.totalFillerWords ?? 0,
          pauseCount: raw.pauseCount ?? 0,
        });
      }
    } catch {
      setError('An unexpected error occurred while fetching score data.');
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!interviewId) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">No interview ID provided.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="flex justify-center">
            <div className="h-36 w-36 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header with back link */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to={`/review/${interviewId}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Review
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scores & Evaluations</h1>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            <button onClick={fetchData} className="text-sm text-red-600 dark:text-red-400 underline hover:text-red-800 mt-1">Retry</button>
          </div>
        </div>
      )}

      {/* Overall Score */}
      {scoring && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreCard label="Overall Score" value={scoring.overallScore} size="lg" />
            <div className="flex-1">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getLabelColor(scoring.label)}`}>
                {scoring.label}
              </span>
              {/* Key metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {voiceHighlights && (
                  <>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{voiceHighlights.speakingRate}</p>
                      <p className="text-xs text-gray-500">Words/min</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{voiceHighlights.fillerCount}</p>
                      <p className="text-xs text-gray-500">Filler Words</p>
                    </div>
                  </>
                )}
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{evaluations.length}</p>
                  <p className="text-xs text-gray-500">Questions Evaluated</p>
                </div>
                {scoring.dimensions.length > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{scoring.dimensions.length}</p>
                    <p className="text-xs text-gray-500">Dimensions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!scoring && !error && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center mb-6">
          <p className="text-gray-400">No score data available for this interview.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-6" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Dimension scores as compact bars */}
          {scoring && scoring.dimensions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Dimensions</h2>
              <div className="space-y-3">
                {scoring.dimensions.map(dim => (
                  <div key={dim.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{dim.name}</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{dim.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getScoreBarColor(dim.score)}`} style={{ width: `${dim.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick per-question summary */}
          {evaluations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Scores</h2>
              <div className="space-y-2">
                {evaluations.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-sm font-medium text-gray-500 w-8">Q{e.questionIndex + 1}</span>
                    <div className="flex-1">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreBarColor(e.score)}`} style={{ width: `${e.score}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">{e.score}%</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getLabelColor(e.label)}`}>{e.label.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'per-question' && (
        <div className="space-y-4">
          {evaluations.length > 0 ? (
            evaluations.map((e, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300">
                      {e.questionIndex + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{e.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getLabelColor(e.label)}`}>{e.label.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">Score: {e.score}%</span>
                      </div>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-gray-400 transition-transform ${expandedQuestion === i ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {expandedQuestion === i && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                    {/* Answer */}
                    {e.answer && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Your Answer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{e.answer}</p>
                      </div>
                    )}

                    {/* Feedback */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Feedback</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{e.feedback}</p>
                    </div>

                    {/* Concepts */}
                    {(e.conceptsCovered.length > 0 || e.conceptsMissed.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {e.conceptsCovered.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Concepts Covered</p>
                            <div className="flex flex-wrap gap-1">
                              {e.conceptsCovered.map((c, ci) => (
                                <span key={ci} className="text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-2 py-0.5 rounded">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {e.conceptsMissed.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Concepts Missed</p>
                            <div className="flex flex-wrap gap-1">
                              {e.conceptsMissed.map((c, ci) => (
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
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              No per-question evaluations available.
            </div>
          )}
        </div>
      )}

      {activeTab === 'dimensions' && (
        <div className="space-y-6">
          {scoring && scoring.dimensions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scoring.dimensions.map(dim => (
                <div key={dim.name} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{dim.name}</h3>
                    <span className="text-xs text-gray-400">Weight: {dim.weight}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreCard label="" value={dim.score} size="sm" />
                    <div className="flex-1">
                      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreBarColor(dim.score)}`} style={{ width: `${dim.score}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No score breakdown data available.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
