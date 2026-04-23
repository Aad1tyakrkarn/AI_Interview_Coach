import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ConceptCoverageProps {
  conceptsCovered: string[];
  conceptsMissed: string[];
}

export const ConceptCoverage: React.FC<ConceptCoverageProps> = ({
  conceptsCovered,
  conceptsMissed,
}) => {
  const total = conceptsCovered.length + conceptsMissed.length;
  const coveragePercent = total > 0 ? Math.round((conceptsCovered.length / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Concept Coverage</h4>
        <span className="text-sm font-medium text-gray-500">
          {conceptsCovered.length}/{total} topics covered
        </span>
      </div>

      {/* Coverage percentage bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Coverage</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{coveragePercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              coveragePercent >= 70
                ? 'bg-green-500'
                : coveragePercent >= 40
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
      </div>

      {/* Topic list */}
      <div className="space-y-2">
        {conceptsCovered.map((concept, i) => (
          <div key={`covered-${i}`} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{concept}</span>
          </div>
        ))}
        {conceptsMissed.map((concept, i) => (
          <div key={`missed-${i}`} className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-sm text-gray-500">{concept}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
