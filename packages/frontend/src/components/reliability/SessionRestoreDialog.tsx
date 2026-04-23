import React, { useEffect, useState, useCallback } from 'react';
import { reliabilityApi } from '../../api/reliability.api';
import { useReliabilityStore } from '../../store/reliabilityStore';

interface SessionRestoreDialogProps {
  onRestore: (sessionId: string) => void;
  onDismiss: () => void;
}

function formatTimeAgo(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const DISMISS_KEY = 'session_restore_dismissed';

export const SessionRestoreDialog: React.FC<SessionRestoreDialogProps> = ({
  onRestore,
  onDismiss,
}) => {
  const { restorableSessions, setRestorableSessions } = useReliabilityStore();
  const [loading, setLoading] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously chose "Don't show again"
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    if (wasDismissed === 'true') {
      setDismissed(true);
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      try {
        const response = await reliabilityApi.getRestorableSessions();
        const sessions = response.data?.sessions ?? response.data ?? [];
        setRestorableSessions(Array.isArray(sessions) ? sessions : []);
      } catch {
        setRestorableSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [setRestorableSessions]);

  const handleRestore = useCallback(
    (sessionId: string) => {
      onRestore(sessionId);
    },
    [onRestore]
  );

  const handleDismiss = useCallback(() => {
    if (dontShowAgain) {
      localStorage.setItem(DISMISS_KEY, 'true');
    }
    setDismissed(true);
    onDismiss();
  }, [dontShowAgain, onDismiss]);

  // Don't render if loading, dismissed, or no sessions
  if (loading || dismissed || restorableSessions.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-restore-title"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 id="session-restore-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Restore Previous Session?
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                We found {restorableSessions.length} unfinished interview{restorableSessions.length > 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {restorableSessions.map((session) => {
            const progress = session.totalQuestions > 0
              ? Math.round((session.currentQuestionIndex / session.totalQuestions) * 100)
              : 0;

            return (
              <div
                key={session.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{session.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                        {session.mode}
                      </span>
                      <span>
                        Q{session.currentQuestionIndex + 1}/{session.totalQuestions}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span>Saved {formatTimeAgo(session.lastSnapshot)}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestore(session.id)}
                    className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Resume
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
            />
            Don&apos;t show again
          </label>

          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};
