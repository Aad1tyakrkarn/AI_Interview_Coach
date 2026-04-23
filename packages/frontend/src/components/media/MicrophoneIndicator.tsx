import React, { useEffect, useRef, useState, useCallback } from 'react';

interface MicrophoneIndicatorProps {
  stream?: MediaStream;
  isActive: boolean;
  onMute: () => void;
  onUnmute: () => void;
  onDeviceChange: (deviceId: string) => void;
}

export const MicrophoneIndicator: React.FC<MicrophoneIndicatorProps> = ({
  stream,
  isActive,
  onMute,
  onUnmute,
  onDeviceChange,
}) => {
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load available microphone devices
  const loadDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const micDevices = allDevices.filter((d) => d.kind === 'audioinput');
      setDevices(micDevices);
    } catch {
      // Devices not available
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Set up Web Audio API analyser for volume metering
  useEffect(() => {
    if (!stream || !isActive) {
      setVolume(0);
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVolume = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalized = Math.min(100, Math.round((average / 128) * 100));
      setVolume(normalized);

      animationRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();

    return () => {
      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      audioContext.close();
      analyserRef.current = null;
      audioContextRef.current = null;
    };
  }, [stream, isActive]);

  // Close device menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowDeviceMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onUnmute();
    } else {
      setIsMuted(true);
      onMute();
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    onDeviceChange(deviceId);
    setShowDeviceMenu(false);
  };

  const volumeColor =
    volume > 70
      ? 'bg-red-500'
      : volume > 40
        ? 'bg-yellow-500'
        : 'bg-green-500';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
      {/* Mute/Unmute button */}
      <button
        onClick={handleMuteToggle}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          isMuted || !isActive
            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200'
            : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200'
        }`}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMuted || !isActive ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
      </button>

      {/* Volume level bar */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isActive && !isMuted ? 'Listening...' : isMuted ? 'Muted' : 'Mic off'}
          </span>
          <span className="text-xs text-gray-400">{isActive ? `${volume}%` : '--'}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              isMuted ? 'bg-gray-400' : volumeColor
            }`}
            style={{ width: `${isMuted ? 0 : volume}%` }}
          />
        </div>
      </div>

      {/* Device selector */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowDeviceMenu(!showDeviceMenu)}
          className="flex h-8 w-8 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Select microphone device"
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
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showDeviceMenu && devices.length > 0 && (
          <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg">
            <div className="border-b border-gray-100 dark:border-gray-800 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Microphone
              </span>
            </div>
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => handleDeviceSelect(device.deviceId)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedDeviceId === device.deviceId
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {selectedDeviceId === device.deviceId && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span className={selectedDeviceId === device.deviceId ? '' : 'ml-6'}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
