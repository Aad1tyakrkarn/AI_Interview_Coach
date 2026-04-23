import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean;
  onError?: (error: string) => void;
}

export function useCamera(options: UseCameraOptions = {}) {
  const { video = true, audio = false, onError } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoDevices);
      return videoDevices;
    } catch {
      return [];
    }
  }, []);

  const start = useCallback(
    async (deviceId?: string) => {
      try {
        setError(null);
        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : video,
          audio,
        };

        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        setIsActive(true);

        // Track current device
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          setCurrentDeviceId(videoTrack.getSettings().deviceId || '');
        }

        // Attach to video element if ref is set
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        await getDevices();
      } catch (err: any) {
        const message =
          err.name === 'NotAllowedError'
            ? 'Camera permission denied'
            : err.name === 'NotFoundError'
              ? 'No camera found'
              : `Camera error: ${err.message}`;
        setError(message);
        onError?.(message);
        setIsActive(false);
      }
    },
    [video, audio, onError, getDevices],
  );

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setStream(null);
    setIsActive(false);
  }, [stream]);

  const switchCamera = useCallback(async () => {
    const videoDevices = await getDevices();
    if (videoDevices.length < 2) return;

    const currentIndex = videoDevices.findIndex(
      (d) => d.deviceId === currentDeviceId,
    );
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    stop();
    await start(videoDevices[nextIndex].deviceId);
  }, [currentDeviceId, getDevices, stop, start]);

  const requestPermission = useCallback(async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      tempStream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    stream,
    isActive,
    error,
    devices,
    currentDeviceId,
    videoRef,
    start,
    stop,
    switchCamera,
    requestPermission,
    getDevices,
  };
}
