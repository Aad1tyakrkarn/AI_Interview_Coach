import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { CameraAnalysisState } from '../../hooks/useCameraAnalysis';

interface CameraPreviewProps {
  stream?: MediaStream | null;
  isActive: boolean;
  analysisState?: CameraAnalysisState | null;
  showOverlays?: boolean;
  mirrored?: boolean;
  onReady?: () => void;
  /** External video ref — when provided, the component uses this ref for the <video> element
   *  so that other hooks (e.g. useCameraAnalysis) can read from the same element. */
  externalVideoRef?: React.RefObject<HTMLVideoElement | null>;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  stream,
  isActive,
  analysisState,
  showOverlays = true,
  mirrored: initialMirrored = true,
  onReady,
  externalVideoRef,
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef ?? internalVideoRef;
  const [mirrored, setMirrored] = useState(initialMirrored);
  const [warmupState, setWarmupState] = useState<'loading' | 'ready' | 'idle'>('idle');
  const [frameRate, setFrameRate] = useState(0);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Attach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      setWarmupState('loading');

      const handleCanPlay = () => {
        setWarmupState('ready');
        onReady?.();
      };

      video.addEventListener('canplay', handleCanPlay);
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.srcObject = null;
      };
    } else {
      setWarmupState('idle');
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream, onReady]);

  // Track frame rate from analysis state or estimate from video
  useEffect(() => {
    if (analysisState) {
      setFrameRate(analysisState.fps);
    }
  }, [analysisState?.fps]);

  // Estimate FPS if no analysis state
  useEffect(() => {
    if (!analysisState && isActive && stream) {
      frameCountRef.current = 0;
      fpsIntervalRef.current = setInterval(() => {
        setFrameRate(frameCountRef.current);
        frameCountRef.current = 0;
      }, 1000);

      const video = videoRef.current;
      const countFrame = () => {
        frameCountRef.current++;
        if (isActive) requestAnimationFrame(countFrame);
      };
      if (video) requestAnimationFrame(countFrame);

      return () => {
        if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
      };
    }
  }, [isActive, stream, analysisState]);

  const faceDetected = analysisState?.faceDetected ?? false;
  const eyeContact = analysisState?.eyeContact ?? 0;
  const postureScore = analysisState?.postureScore ?? 0;
  const lightingQuality = analysisState?.lightingQuality ?? 'unknown';

  const getBorderColor = useCallback(() => {
    if (!showOverlays || !analysisState) return 'border-transparent';
    return faceDetected ? 'border-green-500' : 'border-red-500';
  }, [showOverlays, analysisState, faceDetected]);

  const getLightingBadgeColor = () => {
    switch (lightingQuality) {
      case 'good': return 'bg-green-500';
      case 'poor': return 'bg-red-500';
      case 'dim': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPostureIcon = () => {
    if (postureScore >= 0.7) return 'text-green-400';
    if (postureScore >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isActive || !stream) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg bg-gray-900" style={{ aspectRatio: '16/9' }}>
        <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-600 dark:text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
          </svg>
          <span className="text-sm text-gray-500">Camera off</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg bg-gray-900 border-2 transition-colors duration-300 ${getBorderColor()}`}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Warm-up overlay */}
      {warmupState === 'loading' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900/80">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-sm text-gray-300">Checking camera...</span>
          </div>
        </div>
      )}

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
      />

      {/* Overlays */}
      {showOverlays && analysisState && warmupState === 'ready' && (
        <>
          {/* Eye contact indicator */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                eyeContact > 50 ? 'bg-green-400' : eyeContact > 20 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
            />
            <span className="text-xs font-medium text-white">
              Eye {Math.round(eyeContact)}%
            </span>
          </div>

          {/* Posture indicator */}
          <div className={`absolute right-3 top-11 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 ${getPostureIcon()}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
              <path d="M12 10v12" />
              <path d="M8 22h8" />
            </svg>
            <span className="text-xs font-medium">
              {Math.round(postureScore * 100)}%
            </span>
          </div>

          {/* Lighting quality badge */}
          <div className="absolute left-3 bottom-12 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1">
            <span className={`h-2 w-2 rounded-full ${getLightingBadgeColor()}`} />
            <span className="text-xs font-medium text-white capitalize">
              {lightingQuality} light
            </span>
          </div>

          {/* Frame rate display */}
          <div className="absolute left-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1">
            <span className="text-xs font-medium text-gray-300">
              {frameRate} fps
            </span>
          </div>
        </>
      )}

      {/* Active / Live indicator */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="text-xs font-medium text-white">
          {warmupState === 'ready' ? 'Live' : 'Starting...'}
        </span>
      </div>

      {/* Mirror toggle */}
      <button
        onClick={() => setMirrored(!mirrored)}
        className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        aria-label={mirrored ? 'Disable mirror' : 'Enable mirror'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      </button>
    </div>
  );
};
