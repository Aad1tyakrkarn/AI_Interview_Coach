import React, { useEffect, useState } from 'react';
import { AIInterviewerAvatar } from './AIInterviewerAvatar';
import type { AvatarState } from './AIInterviewerAvatar';

interface QuestionDisplayProps {
  questionNumber: number;
  totalQuestions: number;
  text: string;
  category: string;
  difficulty: string;
  isAISpeaking?: boolean;
  isThinking?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-green-500/20 text-green-300',
  Intermediate: 'bg-yellow-500/20 text-yellow-300',
  Advanced: 'bg-orange-500/20 text-orange-300',
  Expert: 'bg-red-500/20 text-red-300',
};

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questionNumber,
  totalQuestions,
  text,
  category,
  difficulty,
  isAISpeaking = false,
  isThinking = false,
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timeout = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(timeout);
  }, [questionNumber]);

  const diffColor = DIFFICULTY_COLORS[difficulty] ?? 'bg-gray-500/20 text-gray-300';

  const avatarState: AvatarState = isThinking
    ? 'thinking'
    : isAISpeaking
      ? 'speaking'
      : 'idle';

  return (
    <div className="flex flex-col gap-3">
      {/* Sarah avatar + metadata */}
      <div className="flex items-center gap-3">
        <AIInterviewerAvatar
          state={avatarState}
          size="sm"
          showName={true}
          showStatus={true}
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
            {category}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${diffColor}`}>
            {difficulty}
          </span>
        </div>
      </div>

      {/* Question chat bubble */}
      <div
        className={`ml-13 relative rounded-2xl rounded-tl-sm bg-gray-800/70 p-4 border border-gray-700/50 shadow-lg transition-all duration-500 ${
          animate ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
        style={{ marginLeft: '3.25rem' }}
      >
        {/* Chat bubble tail */}
        <div className="absolute -left-2 top-3 h-3 w-3 rotate-45 bg-gray-800/70 border-l border-b border-gray-700/50" />

        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600/80 text-[10px] font-bold text-white">
            Q{questionNumber}
          </span>
          <p className="text-sm font-medium leading-relaxed text-gray-100">{text}</p>
        </div>
      </div>
    </div>
  );
};
