import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../hooks/useAIInterviewer';

interface AIInterviewerChatProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  silenceWarning: {
    type: 'nudge' | 'encouragement' | 'offer_skip' | null;
    message: string | null;
    duration: number;
  };
  onRephrase: () => void;
  onSkip?: () => void;
  isRephraseDisabled?: boolean;
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const colorMap: Record<string, string> = {
    EASY: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    HARD: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    EXPERT: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  const colors = colorMap[difficulty.toUpperCase()] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors}`}>
      {difficulty}
    </span>
  );
};

const TopicBadge: React.FC<{ topic: string }> = ({ topic }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
    {topic}
  </span>
);

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-3 mb-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
        />
      </svg>
    </div>
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%]">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const InterviewerMessage: React.FC<{ message: ChatMessage; onRephrase: () => void; isRephraseDisabled?: boolean }> = ({
  message,
  onRephrase,
  isRephraseDisabled,
}) => {
  const { metadata } = message;
  const isQuestion = metadata && !metadata.isAcknowledgement;

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
          />
        </svg>
      </div>
      <div className="flex flex-col gap-2 max-w-[75%]">
        {isQuestion && (metadata.topic || metadata.difficulty) && (
          <div className="flex items-center gap-2 flex-wrap">
            {metadata.topic && <TopicBadge topic={metadata.topic} />}
            {metadata.difficulty && <DifficultyBadge difficulty={metadata.difficulty} />}
            {metadata.isFollowUp && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">
                Follow-up
              </span>
            )}
          </div>
        )}
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 ${
            metadata?.isAcknowledgement
              ? 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 italic'
              : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-gray-800 dark:text-gray-200'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        {isQuestion && !metadata.isFollowUp && (
          <button
            onClick={onRephrase}
            disabled={isRephraseDisabled}
            className="self-start text-xs text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Rephrase question
          </button>
        )}
        {metadata?.expectedDuration && !metadata.isAcknowledgement && (
          <span className="text-xs text-gray-400">
            Expected time: ~{Math.ceil(metadata.expectedDuration / 60)} min
          </span>
        )}
      </div>
    </div>
  );
};

const CandidateMessage: React.FC<{ message: ChatMessage }> = ({ message }) => (
  <div className="flex items-start gap-3 mb-4 justify-end">
    <div className="max-w-[75%]">
      <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tr-sm px-4 py-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">{message.content}</p>
      </div>
      <span className="block text-right text-xs text-gray-400 mt-1">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      </svg>
    </div>
  </div>
);

const SilenceBanner: React.FC<{
  type: 'nudge' | 'encouragement' | 'offer_skip' | null;
  message: string | null;
  onSkip?: () => void;
}> = ({ type, message, onSkip }) => {
  if (!type || !message) return null;

  const bannerStyles: Record<string, string> = {
    nudge: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
    encouragement: 'bg-amber-50 border-amber-200 text-amber-800',
    offer_skip: 'bg-orange-50 border-orange-200 text-orange-800',
  };

  const iconByType: Record<string, React.ReactNode> = {
    nudge: (
      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
    encouragement: (
      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
        />
      </svg>
    ),
    offer_skip: (
      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z"
        />
      </svg>
    ),
  };

  return (
    <div className={`mx-4 mb-3 px-4 py-3 rounded-lg border flex items-center gap-3 animate-fade-in ${bannerStyles[type] || ''}`}>
      {iconByType[type]}
      <span className="text-sm flex-1">{message}</span>
      {type === 'offer_skip' && onSkip && (
        <button
          onClick={onSkip}
          className="px-3 py-1 text-xs font-medium bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md transition-colors"
        >
          Skip question
        </button>
      )}
    </div>
  );
};

export const AIInterviewerChat: React.FC<AIInterviewerChatProps> = ({
  messages,
  isGenerating,
  silenceWarning,
  onRephrase,
  onSkip,
  isRephraseDisabled,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isGenerating, silenceWarning.message]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-white">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Interviewer</h3>
          <p className="text-xs text-gray-500">
            {isGenerating ? 'Thinking...' : 'Ready'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}
          />
          <span className="text-xs text-gray-400">{isGenerating ? 'Generating' : 'Online'}</span>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {messages.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3 py-12">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
            <p className="text-sm">The interview will begin shortly.</p>
            <p className="text-xs">Your AI interviewer is preparing questions tailored to your profile.</p>
          </div>
        )}

        {messages.map((message) =>
          message.role === 'interviewer' ? (
            <InterviewerMessage
              key={message.id}
              message={message}
              onRephrase={onRephrase}
              isRephraseDisabled={isRephraseDisabled || isGenerating}
            />
          ) : (
            <CandidateMessage key={message.id} message={message} />
          ),
        )}

        {isGenerating && <TypingIndicator />}
      </div>

      {/* Silence warning banner */}
      <SilenceBanner type={silenceWarning.type} message={silenceWarning.message} onSkip={onSkip} />
    </div>
  );
};
