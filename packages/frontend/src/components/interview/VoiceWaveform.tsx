import React, { useEffect, useRef, useCallback } from 'react';

interface VoiceWaveformProps {
  stream?: MediaStream | null;
  isActive: boolean;
  barCount?: number;
  width?: string;
  height?: string;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  stream,
  isActive,
  barCount = 24,
  width = 'w-full',
  height = 'h-16',
  activeColor = 'bg-green-500',
  inactiveColor = 'bg-gray-300',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const barsRef = useRef<number[]>(new Array(barCount).fill(0));
  const prevBarsRef = useRef<number[]>(new Array(barCount).fill(0));

  // Parse Tailwind color to actual CSS color for canvas
  const getCanvasColor = useCallback(
    (tailwindClass: string, fallback: string): string => {
      const colorMap: Record<string, string> = {
        'bg-green-500': '#22c55e',
        'bg-green-400': '#4ade80',
        'bg-green-600': '#16a34a',
        'bg-blue-500': '#3b82f6',
        'bg-indigo-500': '#6366f1',
        'bg-red-500': '#ef4444',
        'bg-gray-300': '#d1d5db',
        'bg-gray-400': '#9ca3af',
        'bg-gray-200': '#e5e7eb',
      };
      return colorMap[tailwindClass] || fallback;
    },
    [],
  );

  // Connect to the audio stream
  useEffect(() => {
    if (!stream || !isActive) {
      analyserRef.current = null;
      return;
    }

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    analyserRef.current = analyser;

    return () => {
      analyserRef.current = null;
      audioCtx.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, [stream, isActive]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activeHex = getCanvasColor(activeColor, '#22c55e');
    const inactiveHex = getCanvasColor(inactiveColor, '#d1d5db');

    const draw = () => {
      const { width: w, height: h } = canvas.getBoundingClientRect();
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      ctx.clearRect(0, 0, w, h);

      const barWidth = Math.max(2, (w - (barCount - 1) * 2) / barCount);
      const gap = 2;
      const maxBarHeight = h * 0.9;
      const minBarHeight = 3;

      if (analyserRef.current && isActive) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Map frequency data to bar count
        const step = Math.floor(dataArray.length / barCount);
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j];
          }
          const avg = sum / step;
          const target = (avg / 255) * maxBarHeight;

          // Smooth interpolation
          prevBarsRef.current[i] = prevBarsRef.current[i] || 0;
          barsRef.current[i] =
            prevBarsRef.current[i] + (target - prevBarsRef.current[i]) * 0.3;
          prevBarsRef.current[i] = barsRef.current[i];
        }
      } else {
        // Idle: decay bars to minimum
        for (let i = 0; i < barCount; i++) {
          prevBarsRef.current[i] = prevBarsRef.current[i] || 0;
          barsRef.current[i] =
            prevBarsRef.current[i] +
            (minBarHeight - prevBarsRef.current[i]) * 0.15;
          prevBarsRef.current[i] = barsRef.current[i];
        }
      }

      // Draw bars centered vertically
      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.max(minBarHeight, barsRef.current[i]);
        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;

        const color =
          isActive && barHeight > minBarHeight + 2 ? activeHex : inactiveHex;

        ctx.fillStyle = color;
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 3);
        roundRect(ctx, x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [barCount, isActive, activeColor, inactiveColor, getCanvasColor]);

  return (
    <div className={`${width} ${height} ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};

// Helper: draw a rounded rectangle on canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
