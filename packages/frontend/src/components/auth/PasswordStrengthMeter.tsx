import React, { useMemo } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  width: string;
}

function evaluateStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: '', color: 'bg-gray-200 dark:bg-gray-700', width: 'w-0' };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500', width: 'w-2/4' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500', width: 'w-3/4' };
  return { score, label: 'Strong', color: 'bg-green-500', width: 'w-full' };
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const strength = useMemo(() => evaluateStrength(password), [password]);

  if (!password) return null;

  const ok = (pass: boolean) =>
    pass
      ? 'text-green-600 dark:text-green-400'
      : 'text-gray-500 dark:text-gray-500';

  return (
    <div className="mt-2">
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
        />
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
        Password strength: <span className="font-medium">{strength.label}</span>
      </p>
      <ul className="text-xs mt-1 space-y-0.5">
        <li className={ok(password.length >= 8)}>
          {password.length >= 8 ? '\u2713' : '\u2022'} At least 8 characters
        </li>
        <li className={ok(/[A-Z]/.test(password) && /[a-z]/.test(password))}>
          {/[A-Z]/.test(password) && /[a-z]/.test(password) ? '\u2713' : '\u2022'} Upper and lowercase letters
        </li>
        <li className={ok(/\d/.test(password))}>
          {/\d/.test(password) ? '\u2713' : '\u2022'} At least one number
        </li>
        <li className={ok(/[^a-zA-Z0-9]/.test(password))}>
          {/[^a-zA-Z0-9]/.test(password) ? '\u2713' : '\u2022'} At least one special character
        </li>
      </ul>
    </div>
  );
};
