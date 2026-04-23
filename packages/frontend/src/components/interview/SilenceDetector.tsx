import React, { useEffect, useRef, useState, useCallback } from 'react';

interface SilenceDetectorProps {
  isActive: boolean;
  lastInputTime: number;
  onSilenceThreshold: (durationSeconds: number) => void;
}

type SilenceLevel = 'none' | 'gentle' | 'encouraging' | 'offer_skip';

const THRESHOLDS = {
  gentle: 5,
  encouraging: 10,
  offer_skip: 20,
} as const;

export const SilenceDetector: React.FC<SilenceDetectorProps> = ({
  isActive,
  lastInputTime,
  onSilenceThreshold,
}) => {
  const [silenceDuration, setSilenceDuration] = useState(0);
  const [level, setLevel] = useState<SilenceLevel>('none');
  const triggeredRef = useRef<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when lastInputTime changes (new input received)
  useEffect(() => {
    setSilenceDuration(0);
    setLevel('none');
    triggeredRef.current.clear();
  }, [lastInputTime]);

  const tick = useCallback(() => {
    const elapsed = Math.floor((Date.now() - lastInputTime) / 1000);
    setSilenceDuration(elapsed);

    // Determine current level
    if (elapsed >= THRESHOLDS.offer_skip) {
      setLevel('offer_skip');
    } else if (elapsed >= THRESHOLDS.encouraging) {
      setLevel('encouraging');
    } else if (elapsed >= THRESHOLDS.gentle) {
      setLevel('gentle');
    } else {
      setLevel('none');
    }

    // Trigger callbacks at thresholds
    for (const [, threshold] of Object.entries(THRESHOLDS)) {
      if (elapsed >= threshold && !triggeredRef.current.has(threshold)) {
        triggeredRef.current.add(threshold);
        onSilenceThreshold(elapsed);
      }
    }
  }, [lastInputTime, onSilenceThreshold]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, tick]);

  if (!isActive) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400" />
        </span>
        <span>Waiting for response...</span>
      </div>
    );
  }

  if (level === 'none') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span>Recording your answer...</span>
      </div>
    );
  }

  const levelConfig: Record<
    Exclude<SilenceLevel, 'none'>,
    { dotColor: string; pingColor: string; textColor: string; bgColor: string; borderColor: string; label: string }
  > = {
    gentle: {
      dotColor: 'bg-yellow-400',
      pingColor: 'bg-yellow-300',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      label: 'Take your time...',
    },
    encouraging: {
      dotColor: 'bg-amber-500',
      pingColor: 'bg-amber-400',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      label: 'Would you like a hint or to rephrase?',
    },
    offer_skip: {
      dotColor: 'bg-orange-500',
      pingColor: 'bg-orange-400',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      label: 'You can skip this question if needed.',
    },
  };

  const config = levelConfig[level];

  // Pulsing speed increases with silence duration
  const pulseClass =
    level === 'offer_skip'
      ? 'animate-[ping_0.6s_cubic-bezier(0,0,0.2,1)_infinite]'
      : level === 'encouraging'
        ? 'animate-[ping_0.9s_cubic-bezier(0,0,0.2,1)_infinite]'
        : 'animate-ping';

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-500 ${config.bgColor} ${config.borderColor}`}
    >
      <span className="relative flex h-3 w-3">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${config.pingColor} opacity-75 ${pulseClass}`}
        />
        <span className={`relative inline-flex rounded-full h-3 w-3 ${config.dotColor}`} />
      </span>
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
      </div>
      <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">{silenceDuration}s</span>
    </div>
  );
};
