import React, { useState } from 'react';

interface HintPanelProps {
  mode: 'PRACTICE' | 'MOCK' | 'ASSESSMENT';
  hintCount: number;
  onLoadHints: () => Promise<string[]>;
}

export const HintPanel: React.FC<HintPanelProps> = ({ mode, hintCount, onLoadHints }) => {
  const [hints, setHints] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  if (mode !== 'PRACTICE') return null;

  const handleShowHint = async () => {
    if (hints.length === 0) {
      setIsLoading(true);
      try {
        const loadedHints = await onLoadHints();
        setHints(loadedHints);
        if (loadedHints.length > 0) {
          setRevealedCount(1);
        }
      } finally {
        setIsLoading(false);
      }
    } else if (revealedCount < hints.length) {
      setRevealedCount((prev) => prev + 1);
    }
  };

  const hasMoreHints = hints.length > 0 && revealedCount < hints.length;
  const allRevealed = hints.length > 0 && revealedCount >= hints.length;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
          </svg>
          Hints
          <span className="text-xs font-normal text-amber-600">
            ({hintCount} used this session)
          </span>
        </h3>
      </div>

      {revealedCount > 0 && (
        <ul className="space-y-2 mb-3">
          {hints.slice(0, revealedCount).map((hint, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-amber-900 bg-amber-100/60 rounded-lg p-2.5 animate-fadeIn"
            >
              <span className="shrink-0 w-5 h-5 rounded-full bg-amber-300 text-amber-800 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleShowHint}
        disabled={isLoading || allRevealed}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
          isLoading || allRevealed
            ? 'bg-amber-200 text-amber-500 cursor-not-allowed'
            : 'bg-amber-500 text-white hover:bg-amber-600'
        }`}
      >
        {isLoading
          ? 'Loading...'
          : allRevealed
          ? 'No more hints'
          : hasMoreHints
          ? `Show Next Hint (${revealedCount}/${hints.length})`
          : 'Show Hint'}
      </button>
    </div>
  );
};
