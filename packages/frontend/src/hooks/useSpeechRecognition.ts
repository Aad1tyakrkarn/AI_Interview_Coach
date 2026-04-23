import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onResult,
    onError,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
            onResultRef.current?.({
              transcript: result[0].transcript,
              confidence: result[0].confidence,
              isFinal: true,
            });
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + (prev ? ' ' : '') + final.trim());
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still supposed to be listening
        if (recognitionRef.current?._shouldRestart) {
          try {
            recognition.start();
          } catch {
            /* ignore */
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current._shouldRestart = false;
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [continuous, interimResults, language]);

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported');
      return;
    }
    setError(null);
    recognitionRef.current._shouldRestart = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Already started
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current._shouldRestart = false;
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, [stop]);

  return {
    transcript,
    interimTranscript,
    fullTranscript: transcript + (interimTranscript ? ' ' + interimTranscript : ''),
    isListening,
    isSupported,
    error,
    start,
    stop,
    reset,
  };
}
