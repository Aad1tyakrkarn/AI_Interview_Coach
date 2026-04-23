import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInterviewStore } from '../../store/interviewStore';
import { scoringApi } from '../../api/scoring.api';
import { reportApi } from '../../api/report.api';
import { ScoreCard } from '../../components/scoring/ScoreCard';

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
}

interface ScorePreviewData {
  overall: number;
  dimensions: DimensionScore[];
}

export const InterviewCompletePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { interview, isLoading, loadInterview, reset } = useInterviewStore();

  const [scoreData, setScoreData] = useState<ScorePreviewData | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreCalculating, setScoreCalculating] = useState(false);
  const [reportStrengths, setReportStrengths] = useState<string[]>([]);
  const [reportWeaknesses, setReportWeaknesses] = useState<string[]>([]);

  useEffect(() => {
    if (id && !interview) {
      loadInterview(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-generate report in background for both modes
  useEffect(() => {
    if (!id) return;
    const generateReport = async () => {
      try {
        let res;
        try {
          res = await reportApi.getByInterviewId(id);
        } catch {
          res = await reportApi.generateReport(id);
        }
        const data = res.data;
        const summary = data.summary || {};
        setReportStrengths(summary.strengths || data.strengths || []);
        setReportWeaknesses(summary.weaknesses || data.weaknesses || []);
      } catch {
        // Non-critical -- report page will handle generation
      }
    };
    generateReport();
  }, [id]);

  const normalizeScore = (data: any): ScorePreviewData => ({
    overall: data.overall ?? data.overallScore ?? 0,
    dimensions: data.dimensions || [],
  });

  const calculateScore = useCallback(async () => {
    if (!id) return;
    try {
      setScoreCalculating(true);
      setScoreError(null);
      const { data } = await scoringApi.calculateScore(id);
      setScoreData(normalizeScore(data));
    } catch {
      setScoreError('Could not calculate your score right now.');
    } finally {
      setScoreCalculating(false);
    }
  }, [id]);

  const fetchExistingScore = useCallback(async () => {
    if (!id) return;
    try {
      setScoreLoading(true);
      const { data } = await scoringApi.getByInterviewId(id);
      setScoreData(normalizeScore(data));
    } catch {
      // Score doesn't exist yet -- auto-calculate
      try {
        const { data } = await scoringApi.calculateScore(id);
        setScoreData(normalizeScore(data));
      } catch {
        // Score calculation failed, user can click Calculate button
      }
    } finally {
      setScoreLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExistingScore();
  }, [fetchExistingScore]);

  if (isLoading && !interview) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading results...
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Interview not found</h2>
          <button
            onClick={() => navigate('/interview/setup')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  const isPractice = interview.mode === 'PRACTICE';

  const answeredCount = interview.questions.filter((q) => q.answeredAt).length;
  const skippedCount = interview.questions.filter((q) => q.skipped).length;
  const unansweredCount = interview.totalQuestions - answeredCount - skippedCount;

  const startedAt = interview.startedAt ? new Date(interview.startedAt) : null;
  const completedAt = interview.completedAt ? new Date(interview.completedAt) : null;
  const durationMs =
    startedAt && completedAt ? completedAt.getTime() - startedAt.getTime() : 0;
  const durationMinutes = Math.round(durationMs / 60000);
  const durationSeconds = Math.round((durationMs % 60000) / 1000);

  const modeLabel = isPractice ? 'Practice Coach' : 'Mock Interview';

  // Derive strengths and weaknesses from dimensions
  const sortedDimensions = scoreData
    ? [...scoreData.dimensions].sort((a, b) => b.score - a.score)
    : [];
  const topStrengths = sortedDimensions.slice(0, 3);
  const topWeaknesses = [...sortedDimensions].reverse().slice(0, 3);

  // ====================================================================
  // PRACTICE COACH COMPLETE PAGE
  // ====================================================================
  if (isPractice) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-4xl" role="img" aria-label="coaching complete">&#127891;</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Coaching Session Complete!</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Great job! Here is your coaching summary from today's session with Sarah.
            </p>
          </div>

          {/* Session Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5">Session Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">{interview.totalQuestions}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Questions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{answeredCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Answered</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-500">{skippedCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Skipped</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                  {durationMinutes}:{String(durationSeconds).padStart(2, '0')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Duration</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-700 mt-1.5">{modeLabel}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mode</p>
              </div>
            </div>
          </div>

          {/* Score Preview (if available) */}
          {scoreData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Session Score</h2>
              <div className="flex justify-center mb-4">
                <ScoreCard label="Overall Score" value={scoreData.overall} size="lg" />
              </div>
              {sortedDimensions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 p-4">
                    <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">Top Strengths</h3>
                    <ul className="space-y-1">
                      {topStrengths.map((dim) => (
                        <li key={dim.name} className="flex justify-between text-sm">
                          <span className="text-green-900">{dim.name}</span>
                          <span className="font-semibold text-green-700 dark:text-green-400">{dim.score}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">Areas to Improve</h3>
                    <ul className="space-y-1">
                      {topWeaknesses.map((dim) => (
                        <li key={dim.name} className="flex justify-between text-sm">
                          <span className="text-red-900">{dim.name}</span>
                          <span className="font-semibold text-red-700 dark:text-red-400">{dim.score}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Coaching Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">Coaching Summary</h2>
            </div>

            {reportStrengths.length > 0 ? (
              <div className="space-y-3 mb-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800">
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium mb-2">Your strengths:</p>
                  <ul className="space-y-1.5">
                    {reportStrengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                {reportWeaknesses.length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-100 dark:border-orange-800">
                    <p className="text-sm text-orange-800 dark:text-orange-300 font-medium mb-2">Focus areas:</p>
                    <ul className="space-y-1.5">
                      {reportWeaknesses.slice(0, 3).map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-400">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-lg p-4 mb-4 border border-emerald-100">
                <p className="text-sm text-emerald-800 font-medium mb-2">
                  Keep up the great work! Here are the key takeaways from your session:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-emerald-700">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Practice answering with clear structure (situation, task, action, result)
                  </li>
                  <li className="flex items-start gap-2 text-sm text-emerald-700">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Maintain consistent eye contact with the camera
                  </li>
                  <li className="flex items-start gap-2 text-sm text-emerald-700">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Speak at a moderate pace and minimize filler words
                  </li>
                </ul>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Remember: every practice session makes you better. Keep coming back!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={`/review/${id}/report`}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-lg text-sm font-semibold text-center hover:bg-emerald-700 transition-colors shadow-sm"
            >
              View Full Report
            </Link>
            <button
              onClick={() => {
                reset();
                navigate('/interview/setup');
              }}
              className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Practice Again
            </button>
            <Link
              to="/dashboard"
              onClick={() => reset()}
              className="w-full sm:w-auto px-6 py-3 text-gray-500 text-sm font-medium text-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================================
  // MOCK INTERVIEW COMPLETE PAGE
  // ====================================================================
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-4xl" role="img" aria-label="interview complete">&#128188;</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Interview Complete!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for completing your interview. Here are your results.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-5">Session Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{interview.totalQuestions}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Questions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{answeredCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Answered</p>
            </div>
            {unansweredCount > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-400">{unansweredCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unanswered</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                {durationMinutes}:{String(durationSeconds).padStart(2, '0')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Duration</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-indigo-700 mt-1.5">{modeLabel}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mode</p>
            </div>
          </div>
        </div>

        {/* Score Preview Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Interview Score</h2>

          {scoreLoading && (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {!scoreLoading && !scoreData && !scoreError && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Your score has not been calculated yet.
              </p>
              <button
                onClick={calculateScore}
                disabled={scoreCalculating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {scoreCalculating && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {scoreCalculating ? 'Calculating...' : 'Calculate Score'}
              </button>
            </div>
          )}

          {scoreError && (
            <div className="text-center py-6">
              <p className="text-sm text-red-500 mb-3">{scoreError}</p>
              <button
                onClick={calculateScore}
                disabled={scoreCalculating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {scoreData && (
            <div className="space-y-6">
              {/* Overall score */}
              <div className="flex justify-center">
                <ScoreCard label="Overall Score" value={scoreData.overall} size="lg" />
              </div>

              {/* Strengths and weaknesses */}
              {sortedDimensions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 p-4">
                    <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Top Strengths
                    </h3>
                    <ul className="space-y-2">
                      {topStrengths.map((dim) => (
                        <li key={dim.name} className="flex items-center justify-between text-sm">
                          <span className="text-green-900">{dim.name}</span>
                          <span className="font-semibold text-green-700 dark:text-green-400">{dim.score}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4">
                    <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {topWeaknesses.map((dim) => (
                        <li key={dim.name} className="flex items-center justify-between text-sm">
                          <span className="text-red-900">{dim.name}</span>
                          <span className="font-semibold text-red-700 dark:text-red-400">{dim.score}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Link to full score page */}
              <div className="text-center">
                <Link
                  to={`/review/${id}/score`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View Full Score Report
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={`/review/${id}/report`}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold text-center hover:bg-indigo-700 transition-colors shadow-sm"
          >
            View Full Report
          </Link>
          <button
            onClick={() => {
              reset();
              navigate('/interview/setup');
            }}
            className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Start Another
          </button>
          <Link
            to="/dashboard"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 text-gray-500 text-sm font-medium text-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
