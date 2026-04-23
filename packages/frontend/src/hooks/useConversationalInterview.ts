import { useState, useCallback, useRef, useEffect } from 'react';
import { useTTS } from './useTTS';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useAIInterviewer, ChatMessage } from './useAIInterviewer';
import { useInterviewStore, Question } from '../store/interviewStore';
import { voiceApi } from '../api/voice.api';
import { cameraApi } from '../api/camera.api';
import type { ConversationHistoryEntry, CoachingMetrics } from '../api/ai-interviewer.api';

export type ConversationPhase =
  | 'ai-speaking'
  | 'user-turn'
  | 'processing'
  | 'paused'
  | 'ended'
  | 'coaching';

export interface ConversationMessage {
  role: 'ai' | 'user';
  text: string;
  timestamp: Date;
  spokenViaTTS: boolean;
  isCoaching?: boolean;
  isAnswerFeedback?: boolean;
}

interface UseConversationalInterviewOptions {
  interviewId: string | undefined;
  mode: 'PRACTICE' | 'MOCK';
  resumeId?: string;
  autoSubmitDelay?: number;
  micUnmuteDelay?: number;
}

export interface UseConversationalInterviewReturn {
  // State
  phase: ConversationPhase;
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;
  transcript: string;
  interimTranscript: string;
  conversationHistory: ConversationMessage[];
  silenceSeconds: number;
  isAutoSubmitCountdown: boolean;
  coachingTips: string[];

  // Actions
  startInterview: () => void;
  submitAnswer: () => void;
  skipQuestion: () => void;
  pauseInterview: () => void;
  resumeInterview: () => void;
  endInterview: () => void;
  toggleMic: () => void;
  cancelAutoSubmit: () => void;
  requestRephrase: () => void;
  updateMetrics: (metrics: Partial<CoachingMetrics>) => void;
  interruptSarah: () => void;

  // Media state
  isMicOn: boolean;
  isAISpeaking: boolean;
  micVolume: number;

  // Errors
  error: string | null;
}

// Silence comfort messages
const SILENCE_10S_MESSAGE = "Take your time, there's no rush.";
const SILENCE_20S_MESSAGE = 'Would you like me to rephrase that question?';

// Coaching check interval (ms)
const COACHING_CHECK_INTERVAL = 10000; // Check every 10s
// Minimum gap between coaching interruptions (ms)
const MIN_COACHING_GAP = 20000; // Min 20s between coaching tips

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useConversationalInterview(
  options: UseConversationalInterviewOptions,
): UseConversationalInterviewReturn {
  const {
    interviewId,
    mode,
    resumeId,
    autoSubmitDelay = 3,
    micUnmuteDelay = 500,
  } = options;

  const isPractice = mode === 'PRACTICE';
  const hasResume = !!resumeId;

  const [phase, setPhase] = useState<ConversationPhase>('paused');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [silenceSeconds, setSilenceSeconds] = useState(0);
  const [isAutoSubmitCountdown, setIsAutoSubmitCountdown] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [coachingTips, setCoachingTips] = useState<string[]>([]);

  // Dynamic question tracking
  const [dynamicQuestion, setDynamicQuestion] = useState<Question | null>(null);
  const [dynamicQuestionNumber, setDynamicQuestionNumber] = useState(0);
  const dynamicTotalRef = useRef(0);

  const autoSubmitCancelledRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTranscriptRef = useRef('');
  const phaseRef = useRef<ConversationPhase>('paused');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const volumeAnimRef = useRef<number>(0);
  const silenceSpokenRef = useRef<Set<number>>(new Set());
  const thinkingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Answer timing ref — tracks when user started answering
  const answerStartTimeRef = useRef<number>(Date.now());

  // Coaching-specific refs
  const lastCoachingTimeRef = useRef<number>(0);
  const coachingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserSpeakingRef = useRef(false);
  const metricsReceivedRef = useRef(false);
  const currentMetricsRef = useRef<CoachingMetrics>({
    eyeContact: 0,
    postureScore: 0,
    lightingQuality: 'unknown',
    speakingRate: 0,
    fillerCount: 0,
    blinkRate: 0,
  });

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
    // Track when user's turn begins for answer duration calculation
    if (phase === 'user-turn') {
      answerStartTimeRef.current = Date.now();
    }
  }, [phase]);

  const interview = useInterviewStore((s) => s.interview);
  const storeSubmitAnswer = useInterviewStore((s) => s.submitAnswer);
  const storeSkipQuestion = useInterviewStore((s) => s.skipQuestion);
  const storeStartInterview = useInterviewStore((s) => s.startInterview);
  const storePauseInterview = useInterviewStore((s) => s.pauseInterview);
  const storeResumeInterview = useInterviewStore((s) => s.resumeInterview);
  const storeEndInterview = useInterviewStore((s) => s.endInterview);

  const ai = useAIInterviewer(interviewId);

  // ---- TTS ----
  const tts = useTTS({
    rate: 0.85,
    volume: 1.0,
    onEnd: () => {
      if (phaseRef.current === 'ai-speaking' || phaseRef.current === 'coaching') {
        setTimeout(() => {
          if (phaseRef.current === 'ai-speaking' || phaseRef.current === 'coaching') {
            // Clear any stale transcript before enabling mic for user's turn
            userTranscriptRef.current = '';
            speech.reset();
            lastSpeechTimeRef.current = Date.now();
            setSilenceSeconds(0);
            silenceSpokenRef.current.clear();
            autoSubmitCancelledRef.current = false;
            setIsAutoSubmitCountdown(false);

            setPhase('user-turn');
            unmuteMic();
          }
        }, micUnmuteDelay);
      }
    },
    onError: (err) => {
      setError(err);
      if (phaseRef.current === 'ai-speaking' || phaseRef.current === 'coaching') {
        setPhase('user-turn');
        unmuteMic();
      }
    },
  });

  // ---- Speech Recognition ----
  const speech = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onResult: (result) => {
      if (result.isFinal) {
        userTranscriptRef.current =
          userTranscriptRef.current +
          (userTranscriptRef.current ? ' ' : '') +
          result.transcript.trim();
        // Only reset silence timer on final (actual speech), not interim noise
        lastSpeechTimeRef.current = Date.now();
        setSilenceSeconds(0);
        setIsAutoSubmitCountdown(false);
        autoSubmitCancelledRef.current = false;
        silenceSpokenRef.current.clear();
      }
      isUserSpeakingRef.current = true;
      ai.recordInput();
    },
    onError: (err) => {
      if (!err.includes('no-speech')) {
        setError(err);
      }
    },
  });

  // Track when user stops speaking
  useEffect(() => {
    if (silenceSeconds > 1) {
      isUserSpeakingRef.current = false;
    }
  }, [silenceSeconds]);

  // ---- Stop speech recognition during AI speech to prevent self-hearing ----
  // Speech recognition MUST be off while TTS plays so Sarah's voice doesn't
  // appear in the transcript. However, the mic STREAM stays active so we can
  // monitor volume levels and detect when the student speaks to interrupt.
  useEffect(() => {
    if (phase === 'ai-speaking' || phase === 'coaching') {
      speech.stop();
      setIsMicOn(false);
    }
  }, [phase, speech]);

  // ---- Smart mic-based interrupt detection during AI speaking ----
  // Uses Web Audio API to measure mic input volume. Speaker bleed from TTS
  // is typically 10-30 on a 0-100 scale, while a person speaking directly
  // into the mic registers 50-90+. If the volume exceeds the threshold for
  // a sustained duration, we treat it as a real human interrupt.
  useEffect(() => {
    if (phase !== 'ai-speaking' && phase !== 'coaching') return;

    // Use the existing mic stream from volume tracking (started in startInterview)
    const stream = micStreamRef.current;
    if (!stream) return;

    let audioCtx: AudioContext;
    try {
      audioCtx = new AudioContext();
    } catch {
      return; // AudioContext not available
    }

    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animFrame: number;
    let loudStartTime: number | null = null;
    const VOLUME_THRESHOLD = 55; // Speaker bleed is ~10-30; real speech is 50-90+
    const MIN_LOUD_DURATION = 500; // Must be loud for 500ms to count as real speech

    const check = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const volume = Math.round((average / 255) * 100);

      if (volume > VOLUME_THRESHOLD) {
        if (!loudStartTime) loudStartTime = Date.now();

        // If loud for more than MIN_LOUD_DURATION ms, it's a real person speaking
        if (Date.now() - loudStartTime > MIN_LOUD_DURATION) {
          console.log(`[Interrupt] Student speaking at volume ${volume}, interrupting Sarah`);
          tts.stop();
          setPhase('user-turn');
          speech.reset();
          userTranscriptRef.current = '';
          lastSpeechTimeRef.current = Date.now();
          setSilenceSeconds(0);
          silenceSpokenRef.current.clear();
          autoSubmitCancelledRef.current = false;
          setIsAutoSubmitCountdown(false);
          speech.start();
          setIsMicOn(true);
          audioCtx.close();
          return; // stop monitoring
        }
      } else {
        loudStartTime = null; // reset if volume drops
      }

      animFrame = requestAnimationFrame(check);
    };

    check();

    return () => {
      cancelAnimationFrame(animFrame);
      audioCtx.close().catch(() => {});
    };
  }, [phase, tts, speech]);

  // ---- Mic volume tracking ----
  const startVolumeTracking = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);

        volumeAnimRef.current = requestAnimationFrame(tick);
      };

      volumeAnimRef.current = requestAnimationFrame(tick);
    } catch {
      // Mic access denied or unavailable
    }
  }, []);

  const stopVolumeTracking = useCallback(() => {
    if (volumeAnimRef.current) {
      cancelAnimationFrame(volumeAnimRef.current);
      volumeAnimRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    analyserRef.current = null;
    setMicVolume(0);
  }, []);

  // ---- Mic control ----
  const unmuteMic = useCallback(() => {
    setIsMicOn(true);
    speech.start();
    lastSpeechTimeRef.current = Date.now();
    setSilenceSeconds(0);
  }, [speech]);

  const muteMic = useCallback(() => {
    setIsMicOn(false);
    speech.stop();
  }, [speech]);


  // ---- Add conversation message helper ----
  const addConversation = useCallback(
    (role: 'ai' | 'user', text: string, spoken = false, isCoaching = false, isAnswerFeedback = false) => {
      setConversationHistory((prev) => [
        ...prev,
        { role, text, timestamp: new Date(), spokenViaTTS: spoken, isCoaching, isAnswerFeedback },
      ]);
    },
    [],
  );

  // ---- Speak AI text ----
  const speakAI = useCallback(
    (text: string, isCoaching = false, isAnswerFeedback = false) => {
      setPhase(isCoaching ? 'coaching' : 'ai-speaking');
      // Fully mute mic — stop speech recognition to prevent self-hearing
      muteMic();
      addConversation('ai', text, true, isCoaching, isAnswerFeedback);
      tts.speak(text);
    },
    [tts, addConversation, muteMic],
  );

  // ---- Speak with delay ----
  const speakAIWithDelay = useCallback(
    async (text: string) => {
      setPhase('processing');
      await randomDelay(1000, 2000);

      if (phaseRef.current === 'ended' || phaseRef.current === 'paused') return;

      speakAI(text);
    },
    [speakAI],
  );

  // ---- Update metrics (called from InterviewPage via camera analysis) ----
  const updateMetrics = useCallback((metrics: Partial<CoachingMetrics>) => {
    currentMetricsRef.current = { ...currentMetricsRef.current, ...metrics };
    // Mark that we've received real metrics data (at least one non-zero value)
    if (
      (metrics.eyeContact && metrics.eyeContact > 0) ||
      (metrics.postureScore && metrics.postureScore > 0)
    ) {
      metricsReceivedRef.current = true;
    }
  }, []);

  // ---- Current question ----
  const currentQuestion = dynamicQuestion
    ? dynamicQuestion
    : interview && interview.currentQuestionIndex < interview.questions.length
      ? interview.questions[interview.currentQuestionIndex]
      : null;
  const questionNumber = dynamicQuestion ? dynamicQuestionNumber : (interview ? interview.currentQuestionIndex + 1 : 0);
  const totalQuestions = dynamicTotalRef.current || interview?.totalQuestions || 0;

  const isFirstQuestionRef = useRef(true);

  // ---- Build API conversation history ----
  const buildApiHistory = useCallback((): ConversationHistoryEntry[] => {
    return conversationHistory
      .filter((m) => !m.isCoaching) // Exclude coaching messages from history
      .map((m) => ({
        role: m.role === 'ai' ? ('interviewer' as const) : ('candidate' as const),
        content: m.text,
      }));
  }, [conversationHistory]);

  // ======================================================================
  // PRACTICE COACH: Real-time coaching loop
  // ======================================================================
  const coachingCountRef = useRef(0);

  useEffect(() => {
    // Always clear previous interval first to prevent leaks
    if (coachingTimerRef.current) {
      clearInterval(coachingTimerRef.current);
      coachingTimerRef.current = null;
    }

    if (!isPractice || phase === 'paused' || phase === 'ended') {
      return;
    }

    coachingTimerRef.current = setInterval(async () => {
      const currentPhase = phaseRef.current;
      const metrics = currentMetricsRef.current;

      // Only block if AI is actively speaking or processing
      if (
        currentPhase === 'ai-speaking' ||
        currentPhase === 'coaching' ||
        currentPhase === 'processing' ||
        currentPhase === 'paused' ||
        currentPhase === 'ended'
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastCoachingTimeRef.current < MIN_COACHING_GAP) return;

      // Build coaching tip locally if API fails or metrics available
      let tipText = '';

      // Always try to coach — even without metricsReceived flag
      // Generate tip based on whatever metrics we have
      if (metrics.eyeContact > 0 && metrics.eyeContact < 50) {
        tipText = `Your eye contact is at ${Math.round(metrics.eyeContact)}%. Try looking directly at the camera — it makes a big difference in how confident you appear.`;
      } else if (metrics.postureScore > 0 && metrics.postureScore < 60) {
        tipText = `Your posture is at ${Math.round(metrics.postureScore)}%. Sit up straight and keep your shoulders back — it shows confidence.`;
      } else if (metrics.speakingRate > 180) {
        tipText = `You're speaking at ${Math.round(metrics.speakingRate)} words per minute — that's a bit fast. Slow down a little so the interviewer can follow your thought process.`;
      } else if (metrics.speakingRate > 0 && metrics.speakingRate < 80) {
        tipText = `You're speaking at ${Math.round(metrics.speakingRate)} WPM — try to be a bit more fluent. Practice helps build confidence.`;
      } else if (metrics.fillerCount > 3) {
        tipText = `I noticed ${metrics.fillerCount} filler words like "um" or "uh". Try pausing briefly instead — a short silence sounds more professional than a filler word.`;
      } else if (metrics.lightingQuality === 'poor' || metrics.lightingQuality === 'dim') {
        tipText = `The lighting in your room is a bit ${metrics.lightingQuality}. If possible, face a window or turn on a light — good lighting makes you look more professional.`;
      } else if (metrics.eyeContact >= 75) {
        tipText = `Great eye contact at ${Math.round(metrics.eyeContact)}%! You're doing really well — keep it up.`;
      } else if (metrics.postureScore >= 80) {
        tipText = `Excellent posture at ${Math.round(metrics.postureScore)}%! You look confident and professional.`;
      } else if (coachingCountRef.current < 2) {
        // First few coaching moments — give general advice
        const generalTips = [
          'Remember to maintain eye contact with the camera. It shows confidence and engagement.',
          'Take a brief pause before answering — it shows you\'re thinking carefully about the question.',
          'Try to structure your answers with a clear beginning, middle, and end.',
          'Use specific examples from your experience — they make your answers much more convincing.',
        ];
        tipText = generalTips[coachingCountRef.current % generalTips.length];
      }

      if (!tipText) {
        // Try calling the API for more personalized feedback
        try {
          const feedback = await ai.getCoachingFeedback(metrics);
          if (feedback && feedback.priorityTip) {
            tipText = feedback.priorityTip;
          }
        } catch {
          // API failed, use generic tip
        }
      }

      if (!tipText) return;

      lastCoachingTimeRef.current = Date.now();
      coachingCountRef.current += 1;
      setCoachingTips((prev) => [...prev, tipText]);

      // Speak the tip — interrupt only if user is NOT actively speaking
      if (!isUserSpeakingRef.current) {
        speakAI(tipText, true);
      } else {
        // User is speaking, just show in panel silently
        addConversation('ai', tipText, false, true);
      }
    }, COACHING_CHECK_INTERVAL);

    return () => {
      if (coachingTimerRef.current) {
        clearInterval(coachingTimerRef.current);
        coachingTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPractice, phase]);

  // ======================================================================
  // START INTERVIEW
  // ======================================================================
  const startInterview = useCallback(async () => {
    if (!interviewId || !interview) return;

    try {
      setError(null);
      isFirstQuestionRef.current = true;
      dynamicTotalRef.current = interview.totalQuestions;
      setDynamicQuestionNumber(0);

      await storeStartInterview(interviewId);
      await startVolumeTracking();

      // Server-side neural TTS doesn't need browser warmup
      console.log('[ConversationalInterview] Using server-side neural TTS');

      setPhase('processing');

      // Get mode-appropriate intro from API (backend uses auth token to get user/resume data)
      const introData = await ai.getIntro();

      if (introData) {
        // Show "thinking" state while TTS loads, then show text when voice starts
        setPhase('processing');
        muteMic();

        // Pre-show text immediately so user isn't staring at blank screen
        addConversation('ai', introData.introText, true);
        setPhase('ai-speaking');

        tts.speak(introData.introText, () => {
          // After intro finishes speaking, speak the first question
          thinkingDelayRef.current = setTimeout(async () => {
            if (phaseRef.current === 'ended' || phaseRef.current === 'paused') return;

            isFirstQuestionRef.current = false;
            setDynamicQuestionNumber(1);

            const questionText = introData.followUpPrompt;
            setDynamicQuestion({
              id: `dynamic-${Date.now()}`,
              questionId: `dynamic-${Date.now()}`,
              questionIndex: 0,
              text: questionText,
              category: 'General',
              difficulty: 'medium',
              hints: [],
              skipped: false,
            });

            addConversation('ai', questionText, true);
            setPhase('ai-speaking');
            tts.speak(questionText);
          }, 400);
        });
      } else {
        // Fallback: generate first question dynamically
        await ai.generateDynamic([], undefined);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to start interview');
    }
  }, [interviewId, interview, storeStartInterview, startVolumeTracking, ai, tts, muteMic, addConversation]);

  // ======================================================================
  // When AI generates a new question/message via generateDynamic
  // ======================================================================
  useEffect(() => {
    if (ai.aiMessage && phase !== 'ended' && phase !== 'paused') {
      // Only handle if this was triggered by generateDynamic (not intro flow)
      if (!isFirstQuestionRef.current || dynamicQuestionNumber === 0) {
        setDynamicQuestionNumber((prev) => {
          const next = prev + 1;
          return next;
        });
        setDynamicQuestion({
          id: `dynamic-${Date.now()}`,
          questionId: `dynamic-${Date.now()}`,
          questionIndex: dynamicQuestionNumber,
          text: ai.aiMessage,
          category: ai.currentMetadata?.topic || 'General',
          difficulty: ai.currentMetadata?.difficulty || 'medium',
          hints: [],
          skipped: false,
        });

        if (isFirstQuestionRef.current) {
          isFirstQuestionRef.current = false;
          speakAIWithDelay(ai.aiMessage);
        }
        // For non-first questions, speaking is handled in handleSubmitAnswer
      }
      userTranscriptRef.current = '';
      speech.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai.aiMessage]);

  // ======================================================================
  // SAVE ANSWER DATA — voice + camera metrics after each answer
  // ======================================================================
  const saveAnswerData = useCallback(async (questionIndex: number, answerText: string, answerDurationSec: number) => {
    if (!interviewId) return;

    // --- Voice analysis ---
    try {
      const words = answerText.split(/\s+/).filter(Boolean);
      const fillerWordsList = ['um', 'uh', 'like', 'basically', 'you know', 'actually', 'literally', 'so', 'right', 'well'];
      let fillerCount = 0;
      const lower = answerText.toLowerCase();
      for (const filler of fillerWordsList) {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lower.match(regex);
        if (matches) fillerCount += matches.length;
      }
      const wpm = answerDurationSec > 0 ? Math.round((words.length / answerDurationSec) * 60) : 0;

      await voiceApi.saveAnalysis(interviewId, {
        questionIndex,
        metrics: {
          speakingRate: wpm,
          fillerCount,
          totalFillerCount: fillerCount,
          totalDuration: answerDurationSec,
          wordCount: words.length,
          pauseCount: 0,
        },
      });
    } catch (err) {
      console.warn('[saveAnswerData] Voice analysis save failed (non-critical):', err);
    }

    // --- Camera analysis ---
    try {
      const metrics = currentMetricsRef.current;
      await cameraApi.createAnalysis({
        interviewId,
        questionIndex,
        aggregated: {
          eyeContactPercentage: metrics.eyeContact || 0,
          avgPostureScore: metrics.postureScore ? metrics.postureScore / 100 : 0,
          lightingQuality: metrics.lightingQuality || 'unknown',
          blinkRate: metrics.blinkRate || 0,
          dominantExpression: 'neutral',
          faceDetected: (metrics.eyeContact || 0) > 0,
        },
      });
    } catch (err) {
      console.warn('[saveAnswerData] Camera analysis save failed (non-critical):', err);
    }
  }, [interviewId]);

  // ======================================================================
  // SAVE TRANSCRIPT — full conversation history when interview ends
  // ======================================================================
  const saveTranscript = useCallback(async (history: ConversationMessage[]) => {
    if (!interviewId) return;

    try {
      const segments = history
        .filter((m) => !m.isCoaching) // Exclude coaching tips from transcript
        .map((m, i) => ({
          questionIndex: Math.floor(i / 2),
          speaker: m.role === 'ai' ? 'interviewer' : 'candidate',
          text: m.text,
          startTime: 0,
          endTime: 0,
          confidence: m.role === 'user' ? 0.85 : 1.0,
        }));

      const fullText = segments.map((s) => `${s.speaker}: ${s.text}`).join('\n');

      await voiceApi.createTranscript({
        interviewId,
        segments,
        fullText,
        language: 'en',
      });
    } catch (err) {
      console.warn('[saveTranscript] Transcript save failed (non-critical):', err);
    }
  }, [interviewId]);

  // ======================================================================
  // SUBMIT ANSWER — mode-specific behavior
  // ======================================================================
  const handleSubmitAnswer = useCallback(async () => {
    const answerText =
      userTranscriptRef.current.trim() || speech.transcript.trim();
    if (!answerText) return;

    muteMic();
    setPhase('processing');
    setIsAutoSubmitCountdown(false);
    silenceSpokenRef.current.clear();

    addConversation('user', answerText);
    await ai.submitAnswer(answerText);

    try {
      const questionTextForBackend = currentQuestion?.text || `Question ${dynamicQuestionNumber}`;
      const result = await storeSubmitAnswer(answerText, questionTextForBackend);

      // Save voice + camera metrics for this answer (fire-and-forget)
      const answerDuration = Math.round((Date.now() - answerStartTimeRef.current) / 1000);
      saveAnswerData(dynamicQuestionNumber - 1, answerText, answerDuration).catch(() => {});

      if (result.isComplete) {
        // Save full transcript on natural completion (fire-and-forget)
        // Use a snapshot via setConversationHistory to get the latest state
        setConversationHistory((currentHistory) => {
          saveTranscript(currentHistory).catch(() => {});
          return currentHistory; // don't mutate
        });

        // ---- END ----
        if (isPractice) {
          // Practice Coach: coaching summary
          const summaryText = coachingTips.length > 0
            ? `Great session! Here are my top tips from today: ${coachingTips.slice(-3).join('. ')}. Keep practicing and you'll keep improving!`
            : "Great session! You did really well. Keep practicing and you'll continue to build confidence!";
          addConversation('ai', summaryText, true);
          setPhase('ai-speaking');
          tts.speak(summaryText, () => {
            setTimeout(() => {
              setPhase('ended');
              stopVolumeTracking();
            }, 1500);
          });
        } else {
          // Mock Interview: formal closing
          await ai.getClosing();
          const closingMsg = 'Thank you for your time. Your results are being prepared.';
          addConversation('ai', closingMsg, true);
          setPhase('ai-speaking');
          tts.speak(closingMsg, () => {
            setTimeout(() => {
              setPhase('ended');
              stopVolumeTracking();
            }, 1500);
          });
        }
        return;
      }

      // ---- NEXT QUESTION ----
      if (isPractice) {
        // Practice Coach: get answer feedback before next question
        const answerDuration = Math.round((Date.now() - answerStartTimeRef.current) / 1000);
        const feedback = await ai.getAnswerFeedback(
          currentQuestion?.text || '',
          answerText,
          currentMetricsRef.current,
          answerDuration,
        );

        if (feedback) {
          // Build a combined response: feedback + improvements + transition
          const parts: string[] = [];
          if (feedback.feedback) parts.push(feedback.feedback);
          if (feedback.improvements && feedback.improvements.length > 0) {
            const improvementTip = feedback.improvements[0];
            setCoachingTips((prev) => [...prev, improvementTip]);
          }

          const feedbackText = parts.join(' ');

          if (feedbackText) {
            addConversation('ai', feedbackText, true, false, true);
            setPhase('ai-speaking');

            // Speak feedback, then generate and speak next question
            tts.speak(feedbackText, async () => {
              if (phaseRef.current === 'ended' || phaseRef.current === 'paused') return;

              setPhase('processing');
              await randomDelay(500, 1000);

              // Generate next question (mix of resume-based and dynamic)
              const updatedHistory: ConversationHistoryEntry[] = [
                ...buildApiHistory(),
              ];

              // Alternate between resume questions and dynamic questions (every 3rd question)
              // Only attempt resume questions if a resume is attached to this interview
              const useResume = hasResume && dynamicQuestionNumber % 3 === 0;

              let nextQuestionData;
              if (useResume) {
                nextQuestionData = await ai.generateResumeQuestion(updatedHistory);
              }
              if (!nextQuestionData) {
                nextQuestionData = await ai.generateDynamic(updatedHistory, answerText);
              }

              // Speaking handled by the aiMessage effect or manually here
              if (nextQuestionData && 'question' in nextQuestionData) {
                const qText = nextQuestionData.question;
                setDynamicQuestionNumber((prev) => prev + 1);
                setDynamicQuestion({
                  id: `dynamic-${Date.now()}`,
                  questionId: `dynamic-${Date.now()}`,
                  questionIndex: dynamicQuestionNumber,
                  text: qText,
                  category: nextQuestionData.metadata?.topic || 'General',
                  difficulty: nextQuestionData.metadata?.difficulty || 'medium',
                  hints: [],
                  skipped: false,
                });

                const transition = feedback.transition || '';
                const fullText = transition ? `${transition} ${qText}` : qText;
                addConversation('ai', fullText, true);
                setPhase('ai-speaking');
                tts.speak(fullText);
              }
            });
          } else {
            // No feedback, just generate next question
            const updatedHistory: ConversationHistoryEntry[] = [
              ...buildApiHistory(),
            ];
            await ai.generateDynamic(updatedHistory, answerText);
          }
        } else {
          // Fallback: no feedback returned, just move on
          const updatedHistory: ConversationHistoryEntry[] = [
            ...buildApiHistory(),
          ];
          await ai.generateDynamic(updatedHistory, answerText);
        }
      } else {
        // Mock Interview: brief acknowledgement then next question immediately
        setPhase('processing');
        await randomDelay(800, 1500);

        if (phaseRef.current === 'ended' || phaseRef.current === 'paused') return;

        // Brief acknowledgement
        const ackPhrases = [
          'Thank you.',
          'Noted.',
          'I see.',
          'Understood.',
          'Good.',
          'Alright.',
        ];
        const ack = ackPhrases[Math.floor(Math.random() * ackPhrases.length)];

        addConversation('ai', ack, true);
        setPhase('ai-speaking');

        tts.speak(ack, async () => {
          if (phaseRef.current === 'ended' || phaseRef.current === 'paused') return;

          setPhase('processing');
          await randomDelay(300, 600);

          const updatedHistory: ConversationHistoryEntry[] = [
            ...buildApiHistory(),
          ];

          // Generate next question (mix of resume-based and dynamic)
          // Only attempt resume questions if a resume is attached to this interview
          const useResume = hasResume && dynamicQuestionNumber % 3 === 0;
          let nextQuestionData;
          if (useResume) {
            nextQuestionData = await ai.generateResumeQuestion(updatedHistory);
          }
          if (!nextQuestionData) {
            nextQuestionData = await ai.generateDynamic(updatedHistory, answerText);
          }

          if (nextQuestionData && 'question' in nextQuestionData) {
            const qText = nextQuestionData.question;
            setDynamicQuestionNumber((prev) => prev + 1);
            setDynamicQuestion({
              id: `dynamic-${Date.now()}`,
              questionId: `dynamic-${Date.now()}`,
              questionIndex: dynamicQuestionNumber,
              text: qText,
              category: nextQuestionData.metadata?.topic || 'General',
              difficulty: nextQuestionData.metadata?.difficulty || 'medium',
              hints: [],
              skipped: false,
            });

            addConversation('ai', qText, true);
            setPhase('ai-speaking');
            tts.speak(qText);
          }
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit answer');
      setPhase('user-turn');
      unmuteMic();
    }

    userTranscriptRef.current = '';
    speech.reset();
  }, [
    speech,
    muteMic,
    addConversation,
    ai,
    storeSubmitAnswer,
    stopVolumeTracking,
    unmuteMic,
    buildApiHistory,
    isPractice,
    tts,
    coachingTips,
    currentQuestion,
    dynamicQuestionNumber,
    saveAnswerData,
    saveTranscript,
  ]);

  // ======================================================================
  // Silence detection
  // ======================================================================
  useEffect(() => {
    // Clear previous interval to prevent leaks
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (phase === 'user-turn') {
      silenceTimerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - lastSpeechTimeRef.current) / 1000,
        );
        setSilenceSeconds(elapsed);

        if (elapsed >= 7 && !silenceSpokenRef.current.has(7) && userTranscriptRef.current.trim().length === 0) {
          silenceSpokenRef.current.add(7);
          tts.speak(SILENCE_10S_MESSAGE);
          addConversation('ai', SILENCE_10S_MESSAGE, true);
        }

        if (elapsed >= 15 && !silenceSpokenRef.current.has(15) && userTranscriptRef.current.trim().length === 0) {
          silenceSpokenRef.current.add(15);
          tts.speak(SILENCE_20S_MESSAGE);
          addConversation('ai', SILENCE_20S_MESSAGE, true);
        }

        if (
          elapsed >= autoSubmitDelay &&
          userTranscriptRef.current.trim().length > 3 &&
          !autoSubmitCancelledRef.current
        ) {
          setIsAutoSubmitCountdown(true);
        }
      }, 500);
    } else {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setSilenceSeconds(0);
      setIsAutoSubmitCountdown(false);
    }

    return () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [phase, autoSubmitDelay, tts, addConversation]);

  // Auto-submit when countdown finishes
  useEffect(() => {
    if (isAutoSubmitCountdown && silenceSeconds >= autoSubmitDelay + 2) {
      handleSubmitAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoSubmitCountdown, silenceSeconds]);

  // ======================================================================
  // Other actions
  // ======================================================================
  const submitAnswer = useCallback(() => {
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    handleSubmitAnswer();
  }, [handleSubmitAnswer]);

  const skipQuestion = useCallback(async () => {
    muteMic();
    setPhase('processing');
    setIsAutoSubmitCountdown(false);
    silenceSpokenRef.current.clear();
    userTranscriptRef.current = '';
    speech.reset();

    try {
      await storeSkipQuestion();
      await ai.acknowledgeSkip();
      const history = buildApiHistory();
      await ai.generateDynamic(history, undefined);
    } catch (err: any) {
      setError(err?.message || 'Failed to skip question');
    }
  }, [muteMic, speech, storeSkipQuestion, ai, buildApiHistory]);

  const pauseInterview = useCallback(async () => {
    tts.stop();
    muteMic();
    setPhase('paused');

    if (thinkingDelayRef.current) {
      clearTimeout(thinkingDelayRef.current);
      thinkingDelayRef.current = null;
    }

    try {
      await storePauseInterview();
    } catch (err: any) {
      setError(err?.message || 'Failed to pause');
    }
  }, [tts, muteMic, storePauseInterview]);

  const resumeInterview = useCallback(async () => {
    try {
      await storeResumeInterview();
      if (ai.currentQuestion) {
        speakAI(ai.currentQuestion);
      } else {
        setPhase('user-turn');
        unmuteMic();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resume');
    }
  }, [storeResumeInterview, ai.currentQuestion, speakAI, unmuteMic]);

  const endInterview = useCallback(async () => {
    tts.stop();
    muteMic();
    stopVolumeTracking();

    if (thinkingDelayRef.current) {
      clearTimeout(thinkingDelayRef.current);
      thinkingDelayRef.current = null;
    }

    if (isPractice) {
      // Practice: coaching summary
      const summaryText = coachingTips.length > 0
        ? `Great session! Here are my top tips: ${coachingTips.slice(-3).join('. ')}. Keep it up!`
        : "Great session! You're doing well. Keep practicing!";
      addConversation('ai', summaryText, true);
      tts.speak(summaryText);
    } else {
      // Mock: formal closing
      try {
        await ai.getClosing();
      } catch {
        addConversation('ai', 'Thank you for your time.', true);
      }
    }

    // Save full transcript before ending (fire-and-forget)
    saveTranscript(conversationHistory).catch(() => {});

    try {
      await storeEndInterview();
    } catch {
      // Already ending
    }

    setPhase('ended');
  }, [tts, muteMic, stopVolumeTracking, ai, storeEndInterview, isPractice, coachingTips, addConversation, saveTranscript, conversationHistory]);

  // ---- Interrupt Sarah: student clicks button to speak during AI turn ----
  const interruptSarah = useCallback(() => {
    if (phase !== 'ai-speaking' && phase !== 'coaching') return;
    console.log('[Interview] Student interrupted Sarah');
    tts.stop();
    setPhase('user-turn');
    speech.reset();
    userTranscriptRef.current = '';
    lastSpeechTimeRef.current = Date.now();
    setSilenceSeconds(0);
    silenceSpokenRef.current.clear();
    autoSubmitCancelledRef.current = false;
    setIsAutoSubmitCountdown(false);
    speech.start();
    setIsMicOn(true);
  }, [phase, tts, speech]);

  const toggleMic = useCallback(() => {
    if (isMicOn) {
      muteMic();
    } else if (phase === 'user-turn') {
      unmuteMic();
    }
  }, [isMicOn, phase, muteMic, unmuteMic]);

  const cancelAutoSubmit = useCallback(() => {
    autoSubmitCancelledRef.current = true;
    setIsAutoSubmitCountdown(false);
    lastSpeechTimeRef.current = Date.now();
    setSilenceSeconds(0);
  }, []);

  const requestRephrase = useCallback(async () => {
    if (phase === 'user-turn' || phase === 'ai-speaking') {
      tts.stop();
      muteMic();
      setPhase('processing');

      try {
        await ai.requestRephrase();
      } catch (err: any) {
        setError(err?.message || 'Failed to rephrase');
        setPhase('user-turn');
        unmuteMic();
      }
    }
  }, [phase, tts, muteMic, ai, unmuteMic]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
      if (volumeAnimRef.current) cancelAnimationFrame(volumeAnimRef.current);
      if (thinkingDelayRef.current) clearTimeout(thinkingDelayRef.current);
      if (coachingTimerRef.current) clearInterval(coachingTimerRef.current);
      tts.stop();
      speech.stop();
      stopVolumeTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    currentQuestion,
    questionNumber,
    totalQuestions,
    transcript: speech.transcript || userTranscriptRef.current,
    interimTranscript: speech.interimTranscript,
    conversationHistory,
    silenceSeconds,
    isAutoSubmitCountdown,
    coachingTips,

    startInterview,
    submitAnswer,
    skipQuestion,
    pauseInterview,
    resumeInterview,
    endInterview,
    toggleMic,
    cancelAutoSubmit,
    requestRephrase,
    updateMetrics,
    interruptSarah,

    isMicOn,
    isAISpeaking: tts.isSpeaking,
    micVolume,

    error: error || ai.error,
  };
}
