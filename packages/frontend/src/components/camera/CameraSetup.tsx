import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraPreview } from '../media/CameraPreview';
import { cameraApi } from '../../api/camera.api';

interface CameraSetupProps {
  onReady?: (stream: MediaStream) => void;
  onPermissionDenied?: () => void;
}

interface QualityCheckResult {
  blur_score: number;
  brightness: number;
  face_detected: boolean;
  quality: string;
}

type SetupStatus = 'idle' | 'requesting' | 'checking' | 'ready' | 'issues' | 'denied';

export const CameraSetup: React.FC<CameraSetupProps> = ({
  onReady,
  onPermissionDenied,
}) => {
  const [status, setStatus] = useState<SetupStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [qualityResult, setQualityResult] = useState<QualityCheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Enumerate camera devices
  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch {
      // Devices will be enumerated after permission is granted
    }
  }, [selectedDeviceId]);

  // Start camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    // Stop existing stream
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    setStatus('requesting');
    setErrorMessage(null);
    setQualityResult(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setStatus('checking');

      // Re-enumerate devices after permission granted (labels now available)
      await enumerateDevices();

      // Auto-run quality check after a short delay to let video stabilize
      setTimeout(() => {
        runQualityCheck(mediaStream);
      }, 1500);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('denied');
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings.');
        onPermissionDenied?.();
      } else if (err.name === 'NotFoundError') {
        setStatus('issues');
        setErrorMessage('No camera device found. Please connect a camera and try again.');
      } else {
        setStatus('issues');
        setErrorMessage(`Camera error: ${err.message || 'Unknown error'}`);
      }
    }
  }, [stream, enumerateDevices, onPermissionDenied]);

  // Run quality check by capturing a frame and sending to API
  const runQualityCheck = useCallback(async (mediaStream?: MediaStream) => {
    const activeStream = mediaStream || stream;
    if (!activeStream) return;

    setStatus('checking');

    try {
      // Create a temporary video element if needed
      const video = document.createElement('video');
      video.srcObject = activeStream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      // Wait for video to be ready
      await new Promise<void>(resolve => {
        if (video.videoWidth > 0) {
          resolve();
        } else {
          video.addEventListener('loadeddata', () => resolve(), { once: true });
        }
      });

      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot create canvas context');
      ctx.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      video.pause();
      video.srcObject = null;

      // Send to API
      const response = await cameraApi.checkQuality(base64 || '');
      const result: QualityCheckResult = response.data;
      setQualityResult(result);

      const hasIssues = !result.face_detected || result.quality === 'poor' || result.brightness < 0.3;
      setStatus(hasIssues ? 'issues' : 'ready');

      if (!hasIssues) {
        onReady?.(activeStream);
      }
    } catch {
      // If quality check fails, still mark as ready with unknown quality
      setQualityResult({
        blur_score: 0,
        brightness: 0,
        face_detected: false,
        quality: 'unknown',
      });
      setStatus('ready');
      onReady?.(activeStream);
    }
  }, [stream, onReady]);

  // Handle device change
  const handleDeviceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  }, [startCamera]);

  // Initial setup
  useEffect(() => {
    enumerateDevices();
  }, [enumerateDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'idle':
        return { label: 'Not Started', color: 'text-gray-400', bg: 'bg-gray-800' };
      case 'requesting':
        return { label: 'Requesting Permission...', color: 'text-blue-400', bg: 'bg-blue-900/30' };
      case 'checking':
        return { label: 'Checking Camera...', color: 'text-yellow-400', bg: 'bg-yellow-900/30' };
      case 'ready':
        return { label: 'Camera Ready', color: 'text-green-400', bg: 'bg-green-900/30' };
      case 'issues':
        return { label: 'Issues Found', color: 'text-red-400', bg: 'bg-red-900/30' };
      case 'denied':
        return { label: 'Permission Denied', color: 'text-red-400', bg: 'bg-red-900/30' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
      <h3 className="mb-4 text-lg font-semibold text-white">Camera Setup</h3>

      {/* Camera Preview */}
      <div className="mb-4">
        <CameraPreview
          stream={stream}
          isActive={!!stream}
          showOverlays={false}
        />
      </div>

      {/* Device Selector */}
      {devices.length > 0 && (
        <div className="mb-4">
          <label htmlFor="camera-select" className="mb-1.5 block text-sm font-medium text-gray-300">
            Camera Device
          </label>
          <select
            id="camera-select"
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${devices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quality Check Results */}
      {qualityResult && (
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Quality Check</h4>
          <div className="grid grid-cols-2 gap-2">
            {/* Face Detection */}
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${qualityResult.face_detected ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${qualityResult.face_detected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-200">
                Face {qualityResult.face_detected ? 'Detected' : 'Not Found'}
              </span>
            </div>

            {/* Lighting */}
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              qualityResult.brightness > 0.5 ? 'bg-green-900/30' : qualityResult.brightness > 0.3 ? 'bg-yellow-900/30' : 'bg-red-900/30'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                qualityResult.brightness > 0.5 ? 'text-green-400' : qualityResult.brightness > 0.3 ? 'text-yellow-400' : 'text-red-400'
              }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span className="text-xs text-gray-200">
                Lighting: {qualityResult.brightness > 0.5 ? 'Good' : qualityResult.brightness > 0.3 ? 'Dim' : 'Poor'}
              </span>
            </div>

            {/* Image Quality */}
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              qualityResult.quality === 'good' ? 'bg-green-900/30' : qualityResult.quality === 'poor' ? 'bg-red-900/30' : 'bg-gray-800'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                qualityResult.quality === 'good' ? 'text-green-400' : qualityResult.quality === 'poor' ? 'text-red-400' : 'text-gray-400'
              }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-xs text-gray-200 capitalize">
                Quality: {qualityResult.quality}
              </span>
            </div>

            {/* Blur Score */}
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              qualityResult.blur_score > 0.7 ? 'bg-green-900/30' : qualityResult.blur_score > 0.4 ? 'bg-yellow-900/30' : 'bg-red-900/30'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                qualityResult.blur_score > 0.7 ? 'text-green-400' : qualityResult.blur_score > 0.4 ? 'text-yellow-400' : 'text-red-400'
              }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="text-xs text-gray-200">
                Sharpness: {Math.round(qualityResult.blur_score * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-900/20 px-4 py-3">
          <p className="text-sm text-red-300">{errorMessage}</p>
        </div>
      )}

      {/* Status Bar */}
      <div className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-2.5 ${statusDisplay.bg}`}>
        {status === 'checking' || status === 'requesting' ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <span className={`h-2.5 w-2.5 rounded-full ${
            status === 'ready' ? 'bg-green-400' : status === 'issues' || status === 'denied' ? 'bg-red-400' : 'bg-gray-400'
          }`} />
        )}
        <span className={`text-sm font-medium ${statusDisplay.color}`}>
          {statusDisplay.label}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {(status === 'idle' || status === 'denied' || status === 'issues') && (
          <button
            onClick={() => startCamera(selectedDeviceId || undefined)}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {status === 'denied' ? 'Retry Permission' : status === 'issues' ? 'Retry Setup' : 'Start Camera'}
          </button>
        )}

        {stream && status !== 'checking' && status !== 'requesting' && (
          <button
            onClick={() => runQualityCheck()}
            className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Re-check Quality
          </button>
        )}
      </div>

      {/* Hidden elements for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
