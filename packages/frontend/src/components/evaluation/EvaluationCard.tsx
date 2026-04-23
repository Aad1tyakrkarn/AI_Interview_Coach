import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { MetricBar } from './MetricBar';
import { ConceptCoverage } from './ConceptCoverage';
import { SHAPExplanation } from './SHAPExplanation';

interface FeatureImportance {
  feature: string;
  importance: number;
  direction: 'positive' | 'negative';
}

interface ShapExplanation {
  shapValues: Record<string, number>;
  featureImportances: FeatureImportance[];
  baseValue: number;
}

interface EvaluationMetrics {
  correctness: number;
  similarity: number;
  communication: number;
  technicalDepth: number;
}

interface EvaluationData {
  questionIndex: number;
  question: string;
  answer?: string;
  score: number;
  label: 'strong' | 'acceptable' | 'needs_improvement';
  metrics: EvaluationMetrics;
  conceptsCovered: string[];
  conceptsMissed: string[];
  feedback: string;
  shapExplanation?: ShapExplanation;
}

interface EvaluationCardProps {
  evaluation: EvaluationData;
}

function getLabelConfig(label: string): { text: string; bg: string; textColor: string } {
  switch (label) {
    case 'strong':
      return { text: 'Strong', bg: 'bg-green-100 dark:bg-green-900/40', textColor: 'text-green-800 dark:text-green-300' };
    case 'acceptable':
      return { text: 'Acceptable', bg: 'bg-yellow-100 dark:bg-yellow-900/40', textColor: 'text-yellow-800 dark:text-yellow-300' };
    case 'needs_improvement':
      return { text: 'Needs Improvement', bg: 'bg-red-100 dark:bg-red-900/40', textColor: 'text-red-800' };
    default:
      return { text: label, bg: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-800 dark:text-gray-200' };
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getStrokeColor(score: number): string {
  if (score >= 70) return 'stroke-green-500';
  if (score >= 40) return 'stroke-yellow-500';
  return 'stroke-red-500';
}

function getTrackColor(score: number): string {
  if (score >= 70) return 'stroke-green-100';
  if (score >= 40) return 'stroke-yellow-100';
  return 'stroke-red-100';
}

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
          className={getTrackColor(score)}
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${getStrokeColor(score)} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl font-bold ${getScoreColor(score)}`}>{Math.round(score)}</span>
      </div>
    </div>
  );
};

export const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluation }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const labelConfig = getLabelConfig(evaluation.label);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-start gap-5">
        <ScoreGauge score={evaluation.score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              Question {evaluation.questionIndex + 1}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${labelConfig.bg} ${labelConfig.textColor}`}
            >
              {labelConfig.text}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{evaluation.question}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 pb-4 space-y-2.5">
        <MetricBar label="Correctness" value={evaluation.metrics?.correctness || 0} />
        <MetricBar label="Similarity" value={evaluation.metrics?.similarity || 0} />
        <MetricBar label="Communication" value={evaluation.metrics?.communication || 0} />
        <MetricBar label="Technical Depth" value={evaluation.metrics?.technicalDepth || 0} />
      </div>

      {/* Concept Coverage */}
      <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4">
        <ConceptCoverage
          conceptsCovered={evaluation.conceptsCovered || []}
          conceptsMissed={evaluation.conceptsMissed || []}
        />
      </div>

      {/* Feedback */}
      <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4">
        <div className="flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Feedback</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{evaluation.feedback}</p>
          </div>
        </div>
      </div>

      {/* SHAP Explanation Toggle */}
      {evaluation.shapExplanation && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span>Show Explanation</span>
            {showExplanation ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showExplanation && (
            <div className="px-5 pb-5">
              <SHAPExplanation
                shapValues={evaluation.shapExplanation.shapValues}
                featureImportances={evaluation.shapExplanation.featureImportances}
                baseValue={evaluation.shapExplanation.baseValue}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
