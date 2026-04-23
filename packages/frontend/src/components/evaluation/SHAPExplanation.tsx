import React, { useMemo } from 'react';

interface FeatureImportance {
  feature: string;
  importance: number;
  direction: 'positive' | 'negative';
}

interface SHAPExplanationProps {
  shapValues: Record<string, number>;
  featureImportances: FeatureImportance[];
  baseValue: number;
}

export const SHAPExplanation: React.FC<SHAPExplanationProps> = ({
  shapValues,
  featureImportances,
  baseValue,
}) => {
  const sortedFeatures = useMemo(() => {
    return [...featureImportances].sort(
      (a, b) => Math.abs(b.importance) - Math.abs(a.importance)
    );
  }, [featureImportances]);

  const maxAbsImportance = useMemo(() => {
    if (sortedFeatures.length === 0) return 1;
    return Math.max(...sortedFeatures.map((f) => Math.abs(f.importance)));
  }, [sortedFeatures]);

  const finalValue = useMemo(() => {
    const shapSum = Object.values(shapValues).reduce((sum, v) => sum + v, 0);
    return baseValue + shapSum;
  }, [shapValues, baseValue]);

  if (sortedFeatures.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-6">
        No SHAP explanation data available.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Feature Importances (SHAP)</h4>
      </div>

      {/* Base value and final prediction */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Base value:</span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{baseValue.toFixed(3)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Prediction:</span>
          <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">{finalValue.toFixed(3)}</span>
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div className="space-y-2">
        {sortedFeatures.map((feature) => {
          const barPercent =
            maxAbsImportance > 0
              ? (Math.abs(feature.importance) / maxAbsImportance) * 100
              : 0;
          const isPositive = feature.direction === 'positive';

          return (
            <div key={feature.feature} className="flex items-center gap-3">
              <span
                className="text-xs text-gray-600 dark:text-gray-400 w-36 shrink-0 truncate text-right"
                title={feature.feature}
              >
                {feature.feature}
              </span>
              <div className="flex-1 flex items-center">
                {/* Center axis layout: negative bars grow left, positive grow right */}
                <div className="w-1/2 flex justify-end">
                  {!isPositive && (
                    <div
                      className="h-5 bg-red-400 rounded-l transition-all duration-500"
                      style={{ width: `${barPercent}%` }}
                      title={`${feature.importance.toFixed(4)}`}
                    />
                  )}
                </div>
                <div className="w-px h-6 bg-gray-400 shrink-0" />
                <div className="w-1/2 flex justify-start">
                  {isPositive && (
                    <div
                      className="h-5 bg-green-400 rounded-r transition-all duration-500"
                      style={{ width: `${barPercent}%` }}
                      title={`+${feature.importance.toFixed(4)}`}
                    />
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-mono w-16 shrink-0 text-right ${
                  isPositive ? 'text-green-700' : 'text-red-700 dark:text-red-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {feature.importance.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-400 rounded-sm" />
          <span className="text-xs text-gray-500">Positive contribution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-400 rounded-sm" />
          <span className="text-xs text-gray-500">Negative contribution</span>
        </div>
      </div>
    </div>
  );
};
