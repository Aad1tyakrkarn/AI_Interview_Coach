import React, { useEffect, useRef, useState, useCallback } from 'react';

interface VoiceAnswerInputProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  silenceCountdown: number | null;
  autoSubmitSeconds?: number;
}

export const VoiceAnswerInput: React.FC<VoiceAnswerInputProps> = ({
  transcript,
  interimTranscript,
  isListening,
  isSupported,
  onSubmit,
  disabled = false,
  isSubmitting = false,
  silenceCountdown,
  autoSubmitSeconds = 3,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTypeFallback, setShowTypeFallback] = useState(false);
  const [typedText, setTypedText] = useState('');

  // Auto-scroll transcript area
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  const handleTypedSubmit = useCallback(() => {
    if (typedText.trim() && !disabled && !isSubmitting) {
      onSubmit(typedText.trim());
      setTypedText('');
      setShowTypeFallback(false);
    }
  }, [typedText, disabled, isSubmitting, onSubmit]);

  const handleManualSubmit = useCallback(() => {
    if (transcript.trim() && !disabled && !isSubmitting) {
      onSubmit(transcript.trim());
    }
  }, [transcript, disabled, isSubmitting, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleTypedSubmit();
    }
  };

  const hasTranscript = transcript.trim().length > 0;
  const hasInterim = interimTranscript.trim().length > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Live Transcript Display */}
      <div
        ref={scrollRef}
        className="relative min-h-[60px] max-h-[120px] overflow-y-auto rounded-lg bg-gray-900/80 px-4 py-3 backdrop-blur-sm"
      >
        {!hasTranscript && !hasInterim && !isListening && (
          <p className="text-sm text-gray-500 italic">
            Waiting to start listening...
          </p>
        )}
        {!hasTranscript && !hasInterim && isListening && (
          <p className="text-sm text-gray-400 italic">
            Start speaking to answer the question...
          </p>
        )}
        {(hasTranscript || hasInterim) && (
          <p className="text-sm leading-relaxed">
            <span className="text-white">{transcript}</span>
            {hasInterim && (
              <span className="text-gray-400 italic">
                {transcript ? ' ' : ''}{interimTranscript}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Silence countdown & manual submit row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Silence countdown indicator */}
          {silenceCountdown !== null && hasTranscript && (
            <div className="flex items-center gap-2">
              <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-300"
                  style={{
                    width: `${((autoSubmitSeconds - silenceCountdown) / autoSubmitSeconds) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-amber-400 tabular-nums font-medium">
                Auto-submit in {silenceCountdown}s
              </span>
            </div>
          )}

          {/* Type fallback link */}
          {!isSupported && !showTypeFallback && (
            <span className="text-xs text-red-400">
              Speech recognition not supported.{' '}
              <button
                onClick={() => setShowTypeFallback(true)}
                className="underline hover:text-red-300"
              >
                Type instead
              </button>
            </span>
          )}
          {isSupported && !showTypeFallback && (
            <button
              onClick={() => setShowTypeFallback(true)}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              Type instead
            </button>
          )}
        </div>

        {/* Manual submit button */}
        {hasTranscript && !isSubmitting && (
          <button
            onClick={handleManualSubmit}
            disabled={disabled || isSubmitting}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            Submit Now
          </button>
        )}
        {isSubmitting && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </div>
        )}
      </div>

      {/* Type fallback textarea */}
      {showTypeFallback && (
        <div className="flex gap-2">
          <textarea
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSubmitting}
            placeholder="Type your answer here... (Ctrl+Enter to submit)"
            className="flex-1 resize-none rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            rows={3}
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleTypedSubmit}
              disabled={!typedText.trim() || disabled || isSubmitting}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
            <button
              onClick={() => {
                setShowTypeFallback(false);
                setTypedText('');
              }}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
