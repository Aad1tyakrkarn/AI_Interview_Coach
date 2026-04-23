import { useState, useRef, useCallback, useEffect } from 'react';

const ML_URL = import.meta.env.VITE_ML_URL || 'http://localhost:8000';

interface UseTTSOptions {
  rate?: number;
  volume?: number;
  lang?: string;
  onEnd?: () => void;
  onStart?: () => void;
  onError?: (error: string) => void;
}

interface TTSItem {
  text: string;
  onEnd?: () => void;
  /** Pre-fetched audio URL, if available */
  preloadedUrl?: string;
  /** Pre-created Audio element with data already loading */
  preloadedAudio?: HTMLAudioElement;
}

export function useTTS(options: UseTTSOptions = {}) {
  const {
    volume = 1.0,
    onEnd,
    onStart,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<TTSItem[]>([]);
  const isProcessingRef = useRef(false);
  const stoppedRef = useRef(false);
  const volumeRef = useRef(volume);
  const rateRef = useRef('-5%');
  const onEndRef = useRef(onEnd);
  const onStartRef = useRef(onStart);
  const onErrorRef = useRef(onError);

  // Keep refs in sync
  volumeRef.current = volume;
  onEndRef.current = onEnd;
  onStartRef.current = onStart;
  onErrorRef.current = onError;

  // ---- Audio URL cache to avoid re-synthesizing the same text ----
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  // ---- Fetch TTS audio URL from backend ----
  const fetchAudioUrl = useCallback(async (text: string): Promise<string> => {
    // Check cache first
    const cached = audioCacheRef.current.get(text);
    if (cached) return cached;

    const response = await fetch(`${ML_URL}/ml/tts/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'sarah-in', rate: rateRef.current }),
    });

    if (!response.ok) throw new Error('TTS synthesis failed');

    const data = await response.json();
    const audioUrl = `${ML_URL}${data.audio_url}`;

    // Cache it
    audioCacheRef.current.set(text, audioUrl);
    return audioUrl;
  }, []);

  // ---- Create a preloaded Audio element ----
  const createPreloadedAudio = useCallback((url: string): HTMLAudioElement => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volumeRef.current;
    audio.src = url;
    // Start loading immediately
    audio.load();
    return audio;
  }, []);

  // ---- Preload next item in queue while current is playing ----
  const preloadNextInQueue = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    const nextItem = queueRef.current[0];
    if (nextItem.preloadedUrl) return; // Already preloaded

    try {
      const url = await fetchAudioUrl(nextItem.text);
      nextItem.preloadedUrl = url;
      nextItem.preloadedAudio = createPreloadedAudio(url);
    } catch {
      // Non-critical — will fetch when it's time to play
    }
  }, [fetchAudioUrl, createPreloadedAudio]);

  // Fallback to browser TTS if server fails
  const fallbackBrowserTTS = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.volume = volumeRef.current;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Process the speech queue
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0 || stoppedRef.current) return;

    isProcessingRef.current = true;
    const item = queueRef.current.shift()!;

    console.log('[TTS] Processing neural speech:', item.text.substring(0, 60) + '...');

    try {
      setIsLoading(true);
      setCurrentText(item.text);
      onStartRef.current?.();

      // Use preloaded URL if available, otherwise fetch now
      let audioUrl: string;
      let audio: HTMLAudioElement;

      if (item.preloadedUrl && item.preloadedAudio) {
        audioUrl = item.preloadedUrl;
        audio = item.preloadedAudio;
        audio.volume = volumeRef.current;
        console.log('[TTS] Using preloaded audio');
      } else {
        audioUrl = await fetchAudioUrl(item.text);
        audio = createPreloadedAudio(audioUrl);
      }

      setIsLoading(false);
      setIsSpeaking(true);
      audioRef.current = audio;

      // Start preloading the next item in the queue while this one plays
      preloadNextInQueue();

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));

        if (stoppedRef.current) {
          resolve();
          return;
        }

        audio.play().catch(reject);
      });

    } catch (error) {
      console.error('[TTS] Neural TTS error, falling back to browser TTS:', error);
      setIsLoading(false);
      onErrorRef.current?.('Neural TTS failed, using fallback');
      // Fallback to browser TTS if server fails
      await fallbackBrowserTTS(item.text);
    } finally {
      audioRef.current = null;

      if (!stoppedRef.current) {
        if (item.onEnd) {
          // Item has its own onEnd handler — let it manage the flow
          // (e.g., intro → followUp chaining). Skip the global onEnd
          // to avoid premature phase transitions like unmuting the mic.
          item.onEnd();
        } else {
          // No per-item handler: fire the global onEnd (which typically
          // transitions phase to 'user-turn' and unmutes the mic).
          onEndRef.current?.();
        }
      }

      isProcessingRef.current = false;
      setIsSpeaking(false);
      setIsLoading(false);
      setCurrentText('');

      // Process next item in queue
      if (queueRef.current.length > 0 && !stoppedRef.current) {
        processQueue();
      }
    }
  }, [fallbackBrowserTTS, fetchAudioUrl, createPreloadedAudio, preloadNextInQueue]);

  // Speak a given text, optionally with a per-item onEnd callback
  const speak = useCallback(
    (text: string, itemOnEnd?: () => void) => {
      if (!text.trim()) {
        itemOnEnd?.();
        return;
      }

      console.log('[TTS] speak() called:', text.substring(0, 80) + (text.length > 80 ? '...' : ''));
      stoppedRef.current = false;
      queueRef.current.push({ text: text.trim(), onEnd: itemOnEnd });

      if (!isProcessingRef.current) {
        processQueue();
      }
    },
    [processQueue],
  );

  // Stop all speech immediately and clear the queue
  const stop = useCallback(() => {
    stoppedRef.current = true;
    queueRef.current = [];

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Also stop browser TTS fallback if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    isProcessingRef.current = false;
    setIsSpeaking(false);
    setIsLoading(false);
    setIsPaused(false);
    setCurrentText('');
  }, []);

  // Pause current speech
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  // Resume paused speech
  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
      setIsPaused(false);
    }
  }, []);

  // Update rate dynamically (edge-tts format: '-5%', '+10%', etc.)
  const setRate = useCallback((newRate: number | string) => {
    if (typeof newRate === 'number') {
      // Convert numeric rate to edge-tts percentage format
      // 1.0 = normal, 0.85 = -15%, 1.2 = +20%
      const pct = Math.round((newRate - 1.0) * 100);
      rateRef.current = `${pct >= 0 ? '+' : ''}${pct}%`;
    } else {
      rateRef.current = newRate;
    }
  }, []);

  // Update volume dynamically
  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    volumeRef.current = clamped;
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      queueRef.current = [];
      isProcessingRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      audioCacheRef.current.clear();
    };
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isLoading,
    isPaused,
    isSupported: true, // Server-side TTS is always available
    currentText,
    setRate,
    setVolume,
    queueLength: queueRef.current.length,
  };
}
