import { useState, useRef, useCallback, useEffect } from 'react';
import { ML_URL } from '../config/env';

export interface CameraAnalysisState {
  isAnalyzing: boolean;
  faceDetected: boolean;
  eyeContact: number;       // 0-100 percentage
  postureScore: number;     // 0-1 score
  lightingQuality: string;
  frameQuality: string;
  lastWarning: string | null;
  framesAnalyzed: number;
  fps: number;
  blinkRate: number;
  expression: string;
  tensionScore: number;     // 0-1 score
}

interface UseCameraAnalysisOptions {
  interviewId: string;
  questionIndex: number;
  captureIntervalMs?: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
}

const DEFAULT_CAPTURE_INTERVAL = 3000; // 3 seconds — good balance of responsiveness and load
const FACE_LOST_THRESHOLD_MS = 5000;

function captureFrameAsBase64(video: HTMLVideoElement): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;

  const canvas = document.createElement('canvas');
  // Downscale for speed — 320x240 is plenty for face/posture analysis
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, 320, 240);
  // Return base64 without the data URI prefix
  const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
  return dataUrl.split(',')[1] || null;
}

export function useCameraAnalysis(options: UseCameraAnalysisOptions) {
  const {
    interviewId,
    questionIndex,
    captureIntervalMs = DEFAULT_CAPTURE_INTERVAL,
    videoRef,
    enabled = true,
  } = options;

  const [state, setState] = useState<CameraAnalysisState>({
    isAnalyzing: false,
    faceDetected: false,
    eyeContact: 0,
    postureScore: 0,
    lightingQuality: 'unknown',
    frameQuality: 'unknown',
    lastWarning: null,
    framesAnalyzed: 0,
    fps: 0,
    blinkRate: 0,
    expression: 'neutral',
    tensionScore: 0,
  });

  const captureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fpsCounterRef = useRef<number>(0);
  const fpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceLostTimestampRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const isSendingRef = useRef(false);

  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    // Skip if previous request is still in flight
    if (isSendingRef.current) return;

    const frame = captureFrameAsBase64(video);
    if (!frame) return;

    fpsCounterRef.current += 1;
    isSendingRef.current = true;

    try {
      // Send directly to ML service for lowest latency
      const mlUrl = ML_URL || 'http://localhost:8000';
      const response = await fetch(`${mlUrl}/ml/camera/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: [frame],
          interview_id: interviewId || undefined,
          question_index: questionIndex ?? undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // ML returns: eye_contact_percentage (0-100), avg_posture_score (0-1),
        // dominant_expression, avg_tension_score (0-1), lighting_quality, blink_rate, face_detected
        const faceDetected = data.face_detected ?? false;
        const eyeContact = data.eye_contact_percentage ?? 0;
        const postureScore = data.avg_posture_score ?? 0;
        const lightingQuality = data.lighting_quality ?? 'unknown';
        const blinkRate = data.blink_rate ?? 0;
        const expression = data.dominant_expression ?? 'neutral';
        const tensionScore = data.avg_tension_score ?? 0;

        // Determine warnings
        let warning: string | null = null;

        if (!faceDetected) {
          if (faceLostTimestampRef.current === null) {
            faceLostTimestampRef.current = Date.now();
          } else if (Date.now() - faceLostTimestampRef.current > FACE_LOST_THRESHOLD_MS) {
            warning = 'Face not detected for an extended period';
          }
        } else {
          faceLostTimestampRef.current = null;
        }

        if (!warning && (lightingQuality === 'poor' || lightingQuality === 'dim')) {
          warning = 'Poor lighting detected — try facing a window or adding a light source';
        }

        if (!warning && postureScore < 0.4) {
          warning = 'Poor posture detected — sit up straight';
        }

        setState(prev => ({
          ...prev,
          faceDetected,
          eyeContact,
          postureScore,
          lightingQuality,
          blinkRate,
          expression,
          tensionScore,
          lastWarning: warning,
          framesAnalyzed: prev.framesAnalyzed + 1,
        }));
      }
    } catch (err) {
      console.error('[CameraAnalysis] Error:', err);
      setState(prev => ({
        ...prev,
        lastWarning: 'Analysis temporarily unavailable',
      }));
    } finally {
      isSendingRef.current = false;
    }
  }, [videoRef, interviewId, questionIndex]);

  const startAnalysis = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    setState(prev => ({ ...prev, isAnalyzing: true }));
    faceLostTimestampRef.current = null;

    // Start capturing and analyzing frames at interval
    captureTimerRef.current = setInterval(captureAndAnalyze, captureIntervalMs);

    // Also run once immediately
    captureAndAnalyze();

    // Start FPS counter
    fpsCounterRef.current = 0;
    fpsTimerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, fps: fpsCounterRef.current }));
      fpsCounterRef.current = 0;
    }, 1000);
  }, [captureAndAnalyze, captureIntervalMs]);

  const stopAnalysis = useCallback(() => {
    isRunningRef.current = false;

    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
      fpsTimerRef.current = null;
    }

    setState(prev => ({ ...prev, isAnalyzing: false, fps: 0 }));
  }, []);

  // Auto-start/stop based on enabled prop
  // We use an interval to wait for the video element to be ready, since the ref
  // may not be attached yet when enabled first becomes true.
  useEffect(() => {
    if (!enabled) {
      stopAnalysis();
      return;
    }

    // Check periodically if video element is available and ready
    const checkAndStart = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        startAnalysis();
        return true;
      }
      return false;
    };

    // Try immediately
    if (checkAndStart()) return () => stopAnalysis();

    // If not ready, poll every 500ms until video is available
    const pollId = setInterval(() => {
      if (checkAndStart()) {
        clearInterval(pollId);
      }
    }, 500);

    return () => {
      clearInterval(pollId);
      stopAnalysis();
    };
  }, [enabled, startAnalysis, stopAnalysis, videoRef]);

  return {
    ...state,
    startAnalysis,
    stopAnalysis,
  };
}
