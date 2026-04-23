import React, { useEffect, useState } from 'react';
import type { ConversationPhase } from '../../hooks/useConversationalInterview';

interface ConversationStatusProps {
  phase: ConversationPhase;
  silenceSeconds: number;
  isAutoSubmitCountdown: boolean;
  autoSubmitDelay?: number;
  mode?: 'PRACTICE' | 'MOCK';
  onCancelAutoSubmit: () => void;
}

function AnimatedDots() {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <span>{'.'.repeat(dotCount)}</span>;
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-3 w-3">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${color}`}
      />
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${color}`}
      />
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-blue-500"
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
  );
}

function MicIcon() {
  return (
    <svg
      className="h-5 w-5 text-green-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg
      className="h-5 w-5 text-indigo-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
      />
    </svg>
  );
}

export const ConversationStatus: React.FC<ConversationStatusProps> = ({
  phase,
  silenceSeconds,
  isAutoSubmitCountdown,
  autoSubmitDelay = 3,
  mode,
  onCancelAutoSubmit,
}) => {
  const isPractice = mode === 'PRACTICE';

  const countdownRemaining = isAutoSubmitCountdown
    ? Math.max(0, autoSubmitDelay + 3 - silenceSeconds)
    : 0;

  if (phase === 'ended') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-gray-100 dark:bg-gray-700 px-5 py-3 text-gray-600 dark:text-gray-400">
        <svg
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium">
          {isPractice
            ? 'Great session! Your coaching summary is ready.'
            : 'Interview complete. Your results are being prepared.'}
        </span>
      </div>
    );
  }

  if (phase === 'paused') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 px-5 py-3 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
        <svg
          className="h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 5.25v13.5m-7.5-13.5v13.5"
          />
        </svg>
        <span className="text-sm font-medium">Interview paused -- take your time</span>
      </div>
    );
  }

  if (phase === 'coaching') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-5 py-3 text-emerald-700 border border-emerald-200">
        <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span className="text-sm font-medium">
          Sarah is coaching you<AnimatedDots />
        </span>
      </div>
    );
  }

  if (phase === 'ai-speaking') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-5 py-3 text-indigo-700 border border-indigo-200">
        <SpeakerIcon />
        <span className="text-sm font-medium">
          {isPractice
            ? <>Sarah is sharing feedback<AnimatedDots /></>
            : <>Sarah is speaking<AnimatedDots /></>}
        </span>
      </div>
    );
  }

  if (phase === 'processing') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 px-5 py-3 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        <Spinner />
        <span className="text-sm font-medium">
          {isPractice
            ? <>Sarah is reviewing your answer<AnimatedDots /></>
            : <>Sarah is evaluating<AnimatedDots /></>}
        </span>
      </div>
    );
  }

  // phase === 'user-turn'
  if (isAutoSubmitCountdown) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-orange-50 px-5 py-3 text-orange-700 border border-orange-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-200 text-orange-800 text-sm font-bold">
          {countdownRemaining}
        </div>
        <span className="text-sm font-medium">
          Got it, processing your answer...
        </span>
        <button
          onClick={onCancelAutoSubmit}
          className="ml-auto rounded-lg bg-orange-200 px-3 py-1 text-xs font-semibold text-orange-800 hover:bg-orange-300 transition-colors"
        >
          Keep talking
        </button>
      </div>
    );
  }

  // Normal user turn
  const isActivelySpeaking = silenceSeconds < 1;

  if (isActivelySpeaking) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/30 px-5 py-3 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
        <PulsingDot color="bg-red-500" />
        <span className="text-sm font-medium">I'm listening...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/30 px-5 py-3 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
      <MicIcon />
      <span className="text-sm font-medium">
        {isPractice ? "Go ahead, I'm listening. Take your time!" : "Go ahead, I'm listening"}
      </span>
    </div>
  );
};
