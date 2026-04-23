import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
  Mic,
  Camera,
} from 'lucide-react';

interface VoiceMetrics {
  speakingRate?: number;
  fillerCount?: number;
  tone?: string;
}

interface CameraMetrics {
  eyeContactPercent?: number;
  posture?: string;
}

interface FeedbackData {
  questionIndex: number;
  questionText: string;
  category: string;
  score: number;
  label: string;
  feedback: string;
  conceptsCovered: string[];
  conceptsMissed: string[];
  voiceMetrics?: VoiceMetrics;
  cameraMetrics?: CameraMetrics;
  answerText?: string;
  expectedAnswer?: string;
  timeTaken?: number;
  skipped?: boolean;
}

interface FeedbackCardProps {
  feedback: FeedbackData;
}

const scoreLabelColor: Record<string, string> = {
  excellent: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
  good: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 border-blue-300',
  average: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  'needs improvement': 'bg-orange-100 text-orange-800 border-orange-300',
  poor: 'bg-red-100 dark:bg-red-900/40 text-red-800 border-red-300 dark:border-red-700',
};

function getScoreBadgeClasses(label: string): string {
  const key = label.toLowerCase();
  return scoreLabelColor[key] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExpected, setShowExpected] = useState(false);

  const {
    questionIndex,
    questionText,
    category,
    score,
    label,
    feedback: feedbackText,
    conceptsCovered,
    conceptsMissed,
    voiceMetrics,
    cameraMetrics,
    answerText,
    expectedAnswer,
    timeTaken,
    skipped,
  } = feedback;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-500">
              Q{questionIndex + 1}
            </span>
            <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {category}
            </span>
            {timeTaken !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timeTaken)}
              </span>
            )}
            {skipped && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                <SkipForward className="w-3.5 h-3.5" />
                Skipped
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-white leading-snug">
            {questionText}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span
            className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-lg border ${getScoreBadgeClasses(label)}`}
          >
            {score}/10 &middot; {label}
          </span>
        </div>
      </div>

      {/* Feedback body */}
      <div className="px-6 py-4 space-y-4">
        {/* Feedback text */}
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{feedbackText}</p>

        {/* Concepts */}
        {(conceptsCovered.length > 0 || conceptsMissed.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {conceptsCovered.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1.5">
                  Concepts Covered
                </p>
                <ul className="space-y-1">
                  {conceptsCovered.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {conceptsMissed.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-800 mb-1.5">
                  Concepts Missed
                </p>
                <ul className="space-y-1">
                  {conceptsMissed.map((c, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400"
                    >
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Collapsible: Your Answer */}
        {answerText && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Your Answer
              {showAnswer ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showAnswer && (
              <div className="px-4 pb-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
                {answerText}
              </div>
            )}
          </div>
        )}

        {/* Collapsible: Model Answer */}
        {expectedAnswer && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => setShowExpected(!showExpected)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Model Answer
              {showExpected ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showExpected && (
              <div className="px-4 pb-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
                {expectedAnswer}
              </div>
            )}
          </div>
        )}

        {/* Voice Metrics */}
        {voiceMetrics && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Voice Metrics
            </p>
            <div className="grid grid-cols-3 gap-2">
              {voiceMetrics.speakingRate !== undefined && (
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-purple-800">
                    {voiceMetrics.speakingRate}
                  </p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    words/min
                  </p>
                </div>
              )}
              {voiceMetrics.fillerCount !== undefined && (
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-purple-800">
                    {voiceMetrics.fillerCount}
                  </p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    fillers
                  </p>
                </div>
              )}
              {voiceMetrics.tone && (
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-purple-800 capitalize">
                    {voiceMetrics.tone}
                  </p>
                  <p className="text-xs text-purple-600 mt-0.5">tone</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Camera Metrics */}
        {cameraMetrics && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Camera Metrics
            </p>
            <div className="grid grid-cols-2 gap-2">
              {cameraMetrics.eyeContactPercent !== undefined && (
                <div className="bg-sky-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-sky-800">
                    {cameraMetrics.eyeContactPercent}%
                  </p>
                  <p className="text-xs text-sky-600 mt-0.5">
                    Eye Contact
                  </p>
                </div>
              )}
              {cameraMetrics.posture && (
                <div className="bg-sky-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-sky-800 capitalize">
                    {cameraMetrics.posture}
                  </p>
                  <p className="text-xs text-sky-600 mt-0.5">Posture</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
