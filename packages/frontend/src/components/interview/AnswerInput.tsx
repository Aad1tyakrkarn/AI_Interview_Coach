import React, { useRef, useEffect } from 'react';

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
}

const MAX_CHARS = 5000;

export const AnswerInput: React.FC<AnswerInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isSubmitting = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (value.trim() && !disabled && !isSubmitting) {
        onSubmit();
      }
    }
  };

  const charCount = value.length;
  const isNearLimit = charCount > MAX_CHARS * 0.9;

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          className={`w-full p-4 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 resize-none transition-colors focus:outline-none focus:ring-0 ${
            disabled
              ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-not-allowed'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-indigo-500'
          }`}
          rows={8}
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              onChange(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSubmitting}
          placeholder="Type your answer here... (Ctrl+Enter to submit)"
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          <span
            className={`text-xs ${
              isNearLimit ? 'text-red-500 font-medium' : 'text-gray-400'
            }`}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" strokeWidth="2" fill="currentColor" />
            </svg>
            <span>Recording ready</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Ctrl+Enter to submit</span>
          <button
            onClick={onSubmit}
            disabled={!value.trim() || disabled || isSubmitting}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              !value.trim() || disabled || isSubmitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
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
                Submitting...
              </span>
            ) : (
              'Submit Answer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
