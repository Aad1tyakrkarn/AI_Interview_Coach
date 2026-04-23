import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface StrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

export const StrengthsWeaknesses: React.FC<StrengthsWeaknessesProps> = ({
  strengths,
  weaknesses,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Strengths */}
      <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-green-50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800">
          <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Strengths
          </h4>
        </div>
        <ul className="divide-y divide-green-100">
          {strengths.map((s, i) => (
            <li
              key={i}
              className="px-5 py-3 flex items-start gap-3 text-sm text-green-800 dark:text-green-300"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="leading-snug">{s}</span>
            </li>
          ))}
          {strengths.length === 0 && (
            <li className="px-5 py-4 text-sm text-gray-400 italic">
              No strengths identified yet.
            </li>
          )}
        </ul>
      </div>

      {/* Weaknesses */}
      <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
          <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Areas for Improvement
          </h4>
        </div>
        <ul className="divide-y divide-red-100">
          {weaknesses.map((w, i) => (
            <li
              key={i}
              className="px-5 py-3 flex items-start gap-3 text-sm text-red-800"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="leading-snug">{w}</span>
            </li>
          ))}
          {weaknesses.length === 0 && (
            <li className="px-5 py-4 text-sm text-gray-400 italic">
              No weaknesses identified.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
