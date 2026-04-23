import React from 'react';

interface CoachingPanelProps {
  eyeContact: number;
  postureScore: number;
  lightingQuality: string;
  speakingRate: number;
  fillerCount: number;
  blinkRate: number;
  tips: string[];
}

function getColor(value: number): { dot: string; text: string; label: string } {
  if (value >= 70) return { dot: 'bg-green-400', text: 'text-green-400', label: 'text-green-300' };
  if (value >= 40) return { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'text-yellow-300' };
  return { dot: 'bg-red-400', text: 'text-red-400', label: 'text-red-300' };
}

function getLightingColor(quality: string): { dot: string; text: string; label: string } {
  if (quality === 'good' || quality === 'excellent') return { dot: 'bg-green-400', text: 'text-green-400', label: 'text-green-300' };
  if (quality === 'fair' || quality === 'moderate') return { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'text-yellow-300' };
  return { dot: 'bg-red-400', text: 'text-red-400', label: 'text-red-300' };
}

function getFillerColor(count: number): { dot: string; text: string; label: string } {
  if (count <= 2) return { dot: 'bg-green-400', text: 'text-green-400', label: 'text-green-300' };
  if (count <= 5) return { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'text-yellow-300' };
  return { dot: 'bg-red-400', text: 'text-red-400', label: 'text-red-300' };
}

function getSpeakingRateColor(rate: number): { dot: string; text: string; label: string } {
  if (rate >= 120 && rate <= 160) return { dot: 'bg-green-400', text: 'text-green-400', label: 'text-green-300' };
  if ((rate >= 100 && rate < 120) || (rate > 160 && rate <= 180)) return { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'text-yellow-300' };
  return { dot: 'bg-red-400', text: 'text-red-400', label: 'text-red-300' };
}

function MetricBar({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string;
  suffix?: string;
  color: { dot: string; text: string; label: string };
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-b-0">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${color.text}`}>
          {value}
          {suffix && <span className="text-xs font-normal text-gray-500 ml-0.5">{suffix}</span>}
        </span>
        <span className={`h-2 w-2 rounded-full ${color.dot} transition-colors duration-500`} />
      </div>
    </div>
  );
}

export const CoachingPanel: React.FC<CoachingPanelProps> = ({
  eyeContact,
  postureScore,
  lightingQuality,
  speakingRate,
  fillerCount,
  blinkRate,
  tips,
}) => {
  const posturePercent = Math.round(postureScore * 100);

  const eyeColor = getColor(eyeContact);
  const postureColor = getColor(posturePercent);
  const lightColor = getLightingColor(lightingQuality);
  const rateColor = getSpeakingRateColor(speakingRate);
  const fillerColor = getFillerColor(fillerCount);
  const blinkColor = blinkRate >= 10 && blinkRate <= 20
    ? { dot: 'bg-green-400', text: 'text-green-400', label: 'text-green-300' }
    : { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'text-yellow-300' };

  const lightLabel = lightingQuality.charAt(0).toUpperCase() + lightingQuality.slice(1);

  return (
    <div className="flex flex-col h-full bg-gray-900/80 border-l border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-base" role="img" aria-label="coaching">&#127891;</span>
          <h3 className="text-sm font-semibold text-emerald-400">Coaching Panel</h3>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">Real-time performance metrics</p>
      </div>

      {/* Metrics */}
      <div className="px-4 py-2 flex-shrink-0">
        <MetricBar
          label="Eye Contact"
          value={`${Math.round(eyeContact)}%`}
          color={eyeColor}
        />
        <MetricBar
          label="Posture"
          value={`${posturePercent}%`}
          color={postureColor}
        />
        <MetricBar
          label="Voice"
          value={`${Math.round(speakingRate)}`}
          suffix="wpm"
          color={rateColor}
        />
        <MetricBar
          label="Fillers"
          value={`${fillerCount}`}
          color={fillerColor}
        />
        <MetricBar
          label="Lighting"
          value={lightLabel}
          color={lightColor}
        />
        <MetricBar
          label="Blink Rate"
          value={blinkRate > 0 ? `${Math.round(blinkRate)}/min` : 'Normal'}
          color={blinkColor}
        />
      </div>

      {/* Latest tip — single line */}
      {tips.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700/50">
          <div className="rounded-lg bg-amber-900/20 border border-amber-700/30 px-3 py-2">
            <p className="text-[11px] text-amber-200 leading-relaxed">{tips[tips.length - 1]}</p>
          </div>
        </div>
      )}
    </div>
  );
};
