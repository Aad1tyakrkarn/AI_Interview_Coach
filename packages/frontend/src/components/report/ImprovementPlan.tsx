import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface PlanItem {
  area: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

interface ImprovementPlanProps {
  plan: PlanItem[];
}

const priorityConfig: Record<
  string,
  { bg: string; text: string; border: string; badge: string; icon: React.ReactNode }
> = {
  high: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-800',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  low: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
    icon: <Info className="w-4 h-4" />,
  },
};

export const ImprovementPlan: React.FC<ImprovementPlanProps> = ({ plan }) => {
  return (
    <div className="space-y-4">
      {plan.map((item, index) => {
        const config = priorityConfig[item.priority] || priorityConfig.low;
        const progress =
          item.priority === 'high' ? 100 : item.priority === 'medium' ? 60 : 30;

        return (
          <div
            key={index}
            className={`relative bg-white dark:bg-gray-800 border ${config.border} rounded-xl overflow-hidden shadow-sm`}
          >
            {/* Progress-like bar at top */}
            <div className="h-1 bg-gray-100 dark:bg-gray-700">
              <div
                className={`h-full ${
                  item.priority === 'high'
                    ? 'bg-red-400'
                    : item.priority === 'medium'
                      ? 'bg-yellow-400'
                      : 'bg-green-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="px-5 py-4 flex items-start gap-4">
              {/* Step number */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${config.bg} ${config.text}`}
              >
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.area}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${config.badge}`}
                  >
                    {config.icon}
                    {item.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.suggestion}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {plan.length === 0 && (
        <div className="text-center py-8 text-sm text-gray-400">
          No improvement steps available.
        </div>
      )}
    </div>
  );
};
