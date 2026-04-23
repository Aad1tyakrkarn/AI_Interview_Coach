import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { InterviewConfig } from '../../store/interviewStore';

interface InterviewControlsProps {
  mode: 'PRACTICE' | 'MOCK';
  config: InterviewConfig;
  isPaused: boolean;
  isLoading: boolean;
  isListening: boolean;
  isAISpeaking?: boolean;
  onToggleMic: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onEnd: () => void;
  onNextQuestion?: () => void;
  hasTranscript?: boolean;
}

export const InterviewControls: React.FC<InterviewControlsProps> = ({
  mode,
  config,
  isPaused,
  isLoading,
  isListening,
  onToggleMic,
  onPause,
  onResume,
  onSkip,
  onEnd,
  onNextQuestion,
  hasTranscript = false,
  isAISpeaking = false,
}) => {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const isPractice = mode === 'PRACTICE';

  const canPause =
    config.allowPause &&
    (config.maxPauses === null || config.pauseCount < config.maxPauses);

  const pauseLabel =
    config.maxPauses !== null
      ? `Pause (${config.pauseCount}/${config.maxPauses})`
      : 'Pause';

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Mic Toggle - Large and Prominent */}
        <button
          onClick={onToggleMic}
          disabled={isPaused}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
            isListening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 hover:bg-red-600 ring-2 ring-red-400/50'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isListening ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isListening ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* Practice Coach: Pause, Skip, Next */}
        {isPractice && (
          <>
            {/* Pause / Resume */}
            {config.allowPause && (
              <>
                {isPaused ? (
                  <button
                    onClick={onResume}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={onPause}
                    disabled={isLoading || !canPause}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    {pauseLabel}
                  </button>
                )}
              </>
            )}

            {/* Skip */}
            {config.allowSkip && (
              <button
                onClick={onSkip}
                disabled={isLoading || isPaused}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
                Skip
              </button>
            )}

            {/* Next Question */}
            {onNextQuestion && hasTranscript && (
              <button
                onClick={onNextQuestion}
                disabled={isLoading || isPaused}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
                Next
              </button>
            )}
          </>
        )}

        {/* End Interview */}
        <button
          onClick={() => setShowEndConfirm(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/80 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
          End
        </button>
      </div>

      {/* End Confirmation Modal — rendered via portal to ensure true center */}
      {showEndConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="rounded-2xl bg-gray-800 border border-gray-700 shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
              <svg className="h-7 w-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {isPractice ? 'End Practice Session?' : 'End Interview?'}
            </h3>
            <p className="text-sm text-gray-400 mb-8">
              {isPractice
                ? 'Sarah will give you a coaching summary before wrapping up. Your progress has been saved.'
                : 'Any unanswered questions will not be scored. This action cannot be undone.'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false);
                  onEnd();
                }}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {isPractice ? 'End Session' : 'End Interview'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
