import React, { useState, useRef, useEffect } from 'react';

interface TwoFactorInputProps {
  onSubmit: (code: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const TwoFactorInput: React.FC<TwoFactorInputProps> = ({ onSubmit, isLoading = false, error }) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const code = newDigits.join('');
    if (code.length === 6 && newDigits.every((d) => d !== '')) {
      onSubmit(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      onSubmit(pasted);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Enter the 6-digit code from your authenticator app
      </label>
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isLoading}
            className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
              bg-white dark:bg-gray-900
              border-gray-300 dark:border-gray-600
              text-gray-900 dark:text-gray-100
              focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/50 outline-none
              disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500
              transition-colors"
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Verifying...
        </div>
      )}
    </div>
  );
};
