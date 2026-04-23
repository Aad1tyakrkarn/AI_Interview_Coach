import React from 'react';

export type AvatarState = 'idle' | 'speaking' | 'thinking' | 'listening' | 'coaching';

interface AIInterviewerAvatarProps {
  state: AvatarState;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showStatus?: boolean;
  mode?: 'PRACTICE' | 'MOCK';
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 'h-10 w-10', text: 'text-sm', nameText: 'text-xs', titleText: 'text-[10px]' },
  md: { container: 'h-14 w-14', text: 'text-lg', nameText: 'text-sm', titleText: 'text-xs' },
  lg: { container: 'h-20 w-20', text: 'text-2xl', nameText: 'text-base', titleText: 'text-sm' },
};

const STATUS_LABELS: Record<AvatarState, string> = {
  idle: '',
  speaking: 'Speaking...',
  thinking: 'Thinking...',
  listening: 'Listening',
  coaching: 'Coaching...',
};

const STATUS_COLORS: Record<AvatarState, string> = {
  idle: 'text-gray-400',
  speaking: 'text-indigo-400',
  thinking: 'text-amber-400',
  listening: 'text-green-400',
  coaching: 'text-emerald-400',
};

/** Sound-wave bars that animate when the AI is speaking. */
function SpeakingBars() {
  return (
    <div className="flex items-end justify-center gap-[2px] h-5">
      <span
        className="w-[3px] rounded-full bg-white dark:bg-gray-800/90"
        style={{
          animation: 'speakBar 0.6s ease-in-out infinite',
          animationDelay: '0ms',
          height: '40%',
        }}
      />
      <span
        className="w-[3px] rounded-full bg-white dark:bg-gray-800/90"
        style={{
          animation: 'speakBar 0.6s ease-in-out infinite',
          animationDelay: '150ms',
          height: '70%',
        }}
      />
      <span
        className="w-[3px] rounded-full bg-white dark:bg-gray-800/90"
        style={{
          animation: 'speakBar 0.6s ease-in-out infinite',
          animationDelay: '300ms',
          height: '100%',
        }}
      />
      <span
        className="w-[3px] rounded-full bg-white dark:bg-gray-800/90"
        style={{
          animation: 'speakBar 0.6s ease-in-out infinite',
          animationDelay: '150ms',
          height: '60%',
        }}
      />
      <span
        className="w-[3px] rounded-full bg-white dark:bg-gray-800/90"
        style={{
          animation: 'speakBar 0.6s ease-in-out infinite',
          animationDelay: '0ms',
          height: '30%',
        }}
      />
    </div>
  );
}

/** Animated dots for the "thinking" state. */
function ThinkingDots() {
  return (
    <div className="flex items-center justify-center gap-1">
      <span
        className="h-1.5 w-1.5 rounded-full bg-white dark:bg-gray-800/80"
        style={{ animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '0ms' }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-white dark:bg-gray-800/80"
        style={{ animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '200ms' }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-white dark:bg-gray-800/80"
        style={{ animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: '400ms' }}
      />
    </div>
  );
}

/** Coaching icon for the coaching state */
function CoachingIcon() {
  return (
    <svg className="h-5 w-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

export const AIInterviewerAvatar: React.FC<AIInterviewerAvatarProps> = ({
  state,
  size = 'md',
  showName = true,
  showStatus = true,
  mode,
  className = '',
}) => {
  const s = SIZE_MAP[size];
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';
  const isIdle = state === 'idle';
  const isCoaching = state === 'coaching';
  const isPractice = mode === 'PRACTICE';

  // Mode-specific colors
  const gradientClass = isPractice
    ? 'from-emerald-500 via-teal-500 to-cyan-500'
    : 'from-indigo-500 via-purple-500 to-pink-500';

  const shadowClass = isPractice
    ? 'shadow-emerald-500/30'
    : 'shadow-indigo-500/30';

  const ringSpeakingClass = isPractice
    ? 'border-emerald-400'
    : 'border-indigo-400';

  const ringPulseClass = isPractice
    ? 'border-teal-300/40'
    : 'border-purple-300/40';

  const badgeLabel = isPractice ? 'Coach' : 'Interviewer';
  const badgeClass = isPractice
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

  const roleText = isPractice
    ? 'Practice Coach'
    : 'Senior Technical Interviewer';

  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes speakBar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes thinkDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>

      <div className={`flex items-center gap-3 ${className}`}>
        {/* Avatar circle */}
        <div className="relative flex-shrink-0">
          <div
            className={`${s.container} relative flex items-center justify-center rounded-full bg-gradient-to-br ${gradientClass} shadow-lg ${shadowClass}`}
            style={{
              animation: isIdle ? 'breathe 3s ease-in-out infinite' : 'none',
            }}
          >
            {/* Inner content */}
            {isCoaching ? (
              <CoachingIcon />
            ) : isSpeaking ? (
              <SpeakingBars />
            ) : isThinking ? (
              <ThinkingDots />
            ) : (
              <span className={`font-bold text-white ${s.text}`}>S</span>
            )}

            {/* Speaking ring animation */}
            {isSpeaking && (
              <>
                <span className={`absolute inset-0 rounded-full border-2 ${ringSpeakingClass} animate-ping opacity-30`} />
                <span className={`absolute inset-[-3px] rounded-full border ${ringPulseClass} animate-pulse`} />
              </>
            )}

            {/* Coaching ring */}
            {isCoaching && (
              <span className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-pulse" />
            )}

            {/* Thinking pulse */}
            {isThinking && (
              <span className="absolute inset-0 rounded-full border-2 border-amber-400/50 animate-pulse" />
            )}

            {/* Online indicator dot */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-gray-900 bg-green-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-200" />
            </span>
          </div>
        </div>

        {/* Name and status */}
        {showName && (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-white ${s.nameText}`}>Sarah</span>
              {/* Mode badge */}
              {mode && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${badgeClass}`}>
                  {badgeLabel}
                </span>
              )}
              {showStatus && state !== 'idle' && (
                <span className={`${s.titleText} font-medium ${STATUS_COLORS[state]}`}>
                  {STATUS_LABELS[state]}
                </span>
              )}
            </div>
            <p className={`${s.titleText} text-gray-400 truncate`}>
              {roleText}
            </p>
          </div>
        )}
      </div>
    </>
  );
};
