import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterview } from '../../hooks/useInterview';
import { useConversationalInterview, ConversationMessage } from '../../hooks/useConversationalInterview';
import { useCamera } from '../../hooks/useCamera';
import { useCameraAnalysis } from '../../hooks/useCameraAnalysis';
import { useConnectionQuality } from '../../hooks/useConnectionQuality';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useHeartbeat } from '../../hooks/useHeartbeat';
import { ModeIndicator } from '../../components/interview/ModeIndicator';
import { InterviewTimer } from '../../components/interview/InterviewTimer';
import { InterviewControls } from '../../components/interview/InterviewControls';
import { CameraPreview } from '../../components/media/CameraPreview';
import { AIInterviewerAvatar } from '../../components/interview/AIInterviewerAvatar';
import { CoachingPanel } from '../../components/interview/CoachingPanel';
import { ReliabilityBar } from '../../components/interview/ReliabilityBar';
import type { AvatarState } from '../../components/interview/AIInterviewerAvatar';

// ------------------------------------------------------------------
// Mic Volume Bars component
// ------------------------------------------------------------------
const MicVolumeBars: React.FC<{ stream: MediaStream | null; isListening: boolean }> = ({
  stream,
  isListening,
}) => {
  const [levels, setLevels] = useState<number[]>([0, 0, 0, 0, 0]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!stream || !isListening) {
      setLevels([0, 0, 0, 0, 0]);
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.7;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioCtxRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      const bandSize = Math.floor(dataArray.length / 5);
      const newLevels: number[] = [];
      for (let i = 0; i < 5; i++) {
        let sum = 0;
        for (let j = i * bandSize; j < (i + 1) * bandSize; j++) {
          sum += dataArray[j];
        }
        const avg = sum / bandSize;
        newLevels.push(Math.min(100, Math.round((avg / 180) * 100)));
      }
      setLevels(newLevels);
      rafRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      audioContext.close();
      analyserRef.current = null;
      audioCtxRef.current = null;
    };
  }, [stream, isListening]);

  return (
    <div className="flex items-end gap-0.5 h-5">
      {levels.map((level, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-green-400 transition-all duration-75"
          style={{ height: `${Math.max(15, level)}%` }}
        />
      ))}
    </div>
  );
};

// ------------------------------------------------------------------
// Connection quality badge
// ------------------------------------------------------------------
const ConnectionBadge: React.FC<{ quality: string }> = ({ quality }) => {
  const config: Record<string, { color: string; label: string }> = {
    excellent: { color: 'bg-green-400', label: 'Excellent' },
    good: { color: 'bg-green-400', label: 'Good' },
    poor: { color: 'bg-yellow-400', label: 'Poor' },
    offline: { color: 'bg-red-400', label: 'Offline' },
  };
  const c = config[quality] || config.good;

  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${c.color}`} />
      <span className="text-xs text-gray-400">{c.label}</span>
    </div>
  );
};

// ------------------------------------------------------------------
// Phase status indicator
// ------------------------------------------------------------------
const PhaseIndicator: React.FC<{ phase: string; isAISpeaking: boolean; mode: 'PRACTICE' | 'MOCK' }> = ({
  phase,
  isAISpeaking,
  mode,
}) => {
  const isPractice = mode === 'PRACTICE';

  if (phase === 'coaching') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-emerald-300">Sarah is coaching you...</span>
      </div>
    );
  }

  if (isAISpeaking) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-indigo-300">
          {isPractice ? 'Sarah is sharing feedback...' : 'Sarah is speaking...'}
        </span>
      </div>
    );
  }

  if (phase === 'processing') {
    return (
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 animate-spin text-yellow-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-yellow-300">
          {isPractice ? 'Sarah is reviewing your answer...' : 'Sarah is evaluating...'}
        </span>
      </div>
    );
  }

  if (phase === 'user-turn') {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-sm text-green-300">Go ahead, I'm listening...</span>
      </div>
    );
  }

  return null;
};

// ------------------------------------------------------------------
// Main InterviewPage Component
// ------------------------------------------------------------------
export const InterviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    interview,
    isLoading,
    error: storeError,
    timer,
    hasDuration,
    clearError,
  } = useInterview(id);

  const interviewMode = interview?.mode ?? 'PRACTICE';
  const isPractice = interviewMode === 'PRACTICE';

  const conv = useConversationalInterview({
    interviewId: id,
    mode: interviewMode,
    resumeId: interview?.resumeId,
    autoSubmitDelay: 3,
    micUnmuteDelay: 500,
  });

  const [hasStarted, setHasStarted] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Track answer start time for WPM calculation
  const answerStartTimeRef = useRef<number>(Date.now());

  // Live metrics state combining camera + voice
  const [liveMetrics, setLiveMetrics] = useState({
    eyeContact: 0,
    postureScore: 0,
    lightingQuality: 'unknown',
    speakingRate: 0,
    fillerCount: 0,
    blinkRate: 0,
  });

  // Camera
  const camera = useCamera({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });

  const cameraAnalysis = useCameraAnalysis({
    interviewId: id || '',
    questionIndex: interview?.currentQuestionIndex ?? 0,
    videoRef: camera.videoRef,
    enabled: camera.isActive,
  });

  // Mic stream for volume metering
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Connection quality
  const { quality: connectionQuality, isOnline: connectionIsOnline, effectiveType: connectionEffectiveType, latency: connectionLatency, speedMbps: connectionSpeedMbps } = useConnectionQuality();

  // Reliability: Auto-save interview state every 30 seconds
  const autoSave = useAutoSave(
    () => ({
      state: {
        phase: conv.phase,
        questionNumber: conv.questionNumber,
        conversationHistoryLength: conv.conversationHistory.length,
      },
      currentQuestionIndex: interview?.currentQuestionIndex ?? 0,
      answers: conv.conversationHistory
        .filter((m) => m.role === 'user')
        .map((m) => ({ text: m.text, timestamp: m.timestamp.toISOString() })),
    }),
    {
      interviewId: id || '',
      intervalMs: 30000, // 30 seconds
      enabled: hasStarted && conv.phase !== 'ended',
    },
  );

  // Reliability: Heartbeat every 10 seconds
  const heartbeat = useHeartbeat({
    interviewId: id || '',
    intervalMs: 10000,
    enabled: hasStarted && conv.phase !== 'ended',
  });

  // Avatar state
  const avatarState: AvatarState = conv.phase === 'coaching'
    ? 'coaching'
    : conv.isAISpeaking
      ? 'speaking'
      : conv.phase === 'processing'
        ? 'thinking'
        : conv.phase === 'user-turn'
          ? 'listening'
          : 'idle';

  // Update live metrics from camera analysis
  useEffect(() => {
    setLiveMetrics(prev => ({
      ...prev,
      eyeContact: cameraAnalysis.eyeContact || 0,
      postureScore: cameraAnalysis.postureScore || 0,
      lightingQuality: cameraAnalysis.lightingQuality || 'unknown',
      blinkRate: cameraAnalysis.blinkRate || 0,
    }));
  }, [cameraAnalysis.eyeContact, cameraAnalysis.postureScore, cameraAnalysis.lightingQuality, cameraAnalysis.blinkRate]);

  // Calculate voice metrics (WPM, filler count) from live transcript
  useEffect(() => {
    const transcript = conv.transcript;
    if (transcript) {
      const words = transcript.split(/\s+/).filter(Boolean);
      const fillerWords = ['um', 'uh', 'like', 'basically', 'you know', 'so', 'actually', 'literally', 'right', 'well'];
      let fillerCount = 0;
      const lowerTranscript = transcript.toLowerCase();
      for (const filler of fillerWords) {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lowerTranscript.match(regex);
        if (matches) fillerCount += matches.length;
      }
      const elapsedMinutes = (Date.now() - answerStartTimeRef.current) / 60000;
      const wpm = elapsedMinutes > 0.05 ? Math.round(words.length / elapsedMinutes) : 0;

      setLiveMetrics(prev => ({
        ...prev,
        speakingRate: wpm,
        fillerCount,
      }));
    }
  }, [conv.transcript]);

  // Reset answer start time when a new question starts (phase transitions to user-turn)
  useEffect(() => {
    if (conv.phase === 'user-turn') {
      answerStartTimeRef.current = Date.now();
    }
  }, [conv.phase]);

  // Push live metrics to conversational interview hook for coaching API
  useEffect(() => {
    conv.updateMetrics({
      eyeContact: liveMetrics.eyeContact,
      postureScore: liveMetrics.postureScore,
      lightingQuality: liveMetrics.lightingQuality,
      speakingRate: liveMetrics.speakingRate,
      fillerCount: liveMetrics.fillerCount,
      blinkRate: liveMetrics.blinkRate,
    });
  }, [liveMetrics, conv.updateMetrics]);

  // Auto-start camera and mic on mount
  useEffect(() => {
    camera.start();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => setMicStream(stream))
      .catch(() => {});

    return () => {
      camera.stop();
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fullscreen helpers
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Exit fullscreen when interview ends
  useEffect(() => {
    if (conv.phase === 'ended') {
      exitFullscreen();
    }
  }, [conv.phase, exitFullscreen]);

  // Start the conversational flow
  const handleStartConversation = useCallback(async () => {
    if (hasStarted || !interview) return;
    enterFullscreen();
    setHasStarted(true);
    await conv.startInterview();
  }, [hasStarted, interview, conv, enterFullscreen]);

  // Navigate to complete page when done
  useEffect(() => {
    if (interview?.status === 'COMPLETED' || conv.phase === 'ended') {
      camera.stop();
      micStream?.getTracks().forEach((t) => t.stop());
      const timeout = setTimeout(() => {
        navigate(`/interview/${id}/complete`);
      }, 3000);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview?.status, conv.phase]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conv.conversationHistory]);

  // Submit answer handler
  const handleManualSubmit = useCallback(
    (answerText: string) => {
      if (answerText.trim()) {
        conv.submitAnswer();
      }
    },
    [conv],
  );

  // Derive combined error
  const error = conv.error || storeError;

  // Loading state
  if (isLoading && !interview) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Interview not found</h2>
          <p className="text-gray-400 mb-4">The interview could not be loaded.</p>
          <button
            onClick={() => navigate('/interview/setup')}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  // Pre-start screen
  if (!hasStarted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="max-w-lg w-full mx-4 text-center">
          <div className="rounded-2xl bg-gray-800 border border-gray-700 shadow-2xl p-8">
            <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
              isPractice ? 'bg-emerald-600/20' : 'bg-indigo-600/20'
            }`}>
              {isPractice ? (
                <span className="text-4xl" role="img" aria-label="coach">&#127891;</span>
              ) : (
                <span className="text-4xl" role="img" aria-label="interview">&#128188;</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isPractice ? 'Ready for your coaching session?' : 'Ready for your interview?'}
            </h2>
            <p className="text-gray-400 mb-2">
              <strong className={isPractice ? 'text-emerald-300' : 'text-indigo-300'}>Sarah</strong>,
              your AI {isPractice ? 'coach' : 'interviewer'}, will{' '}
              {isPractice
                ? 'guide you through practice questions and give real-time feedback on your performance.'
                : 'conduct a professional interview and evaluate your responses.'}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {isPractice
                ? 'Make sure your camera and microphone are working. Sarah will coach you on eye contact, posture, voice, and answer quality.'
                : 'Make sure your microphone and speakers are working. Questions will be dynamically generated based on your answers.'}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleStartConversation}
                className={`w-full rounded-lg px-6 py-3 text-lg font-semibold text-white transition-colors ${
                  isPractice
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                }`}
              >
                {isPractice ? 'Start Practice' : 'Start Interview'}
              </button>
              <button
                onClick={() => navigate('/interview/setup')}
                className="text-sm text-gray-500 hover:text-gray-300"
              >
                Go back
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${camera.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                Camera {camera.isActive ? 'ready' : 'off'}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${micStream ? 'bg-green-400' : 'bg-red-400'}`} />
                Mic {micStream ? 'ready' : 'off'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPaused = conv.phase === 'paused';
  const totalDurationSeconds = interview.durationMinutes
    ? interview.durationMinutes * 60
    : undefined;

  // ====================================================================
  // PRACTICE COACH LAYOUT: 3-column
  // ====================================================================
  if (isPractice) {
    return (
      <div className="flex h-screen flex-col bg-gray-950 text-white overflow-hidden">
        {/* FLOATING TOP BAR — minimal, glassmorphism */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 py-2">
          {/* Center: Timer + Question */}
          <div className="flex items-center gap-3 rounded-full bg-gray-900/70 backdrop-blur-md border border-gray-700/50 px-4 py-1.5">
            <InterviewTimer
              seconds={timer.seconds}
              formatted={timer.formatted}
              isRunning={timer.isRunning}
              hasDuration={hasDuration}
              totalDurationSeconds={totalDurationSeconds}
            />
            <span className="text-[10px] text-gray-500 border-l border-gray-700 pl-3">Q{conv.questionNumber}</span>
          </div>

          {isFullscreen && (
            <button
              onClick={exitFullscreen}
              className="rounded-full bg-gray-900/70 backdrop-blur-md border border-gray-700/50 p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 transition-all"
              title="Exit Fullscreen (Esc)"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              </button>
            )}
        </div>

        {/* Error Banner — floating */}
        {error && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 max-w-lg w-full px-4">
            <div className="flex items-center justify-between rounded-xl bg-red-950/90 backdrop-blur-md border border-red-800/60 p-3 shadow-lg">
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={clearError} className="text-red-400 hover:text-red-200 ml-3">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* MAIN CONTENT — 3 columns, full height */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Camera Preview (~28%) */}
          <div className="relative flex w-[28%] flex-col">
            <div className="flex-1 bg-black relative">
              <CameraPreview
                stream={camera.stream}
                isActive={camera.isActive}
                analysisState={cameraAnalysis}
                showOverlays={true}
                mirrored={true}
                externalVideoRef={camera.videoRef}
              />
              {/* Floating camera metrics */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-md ${
                    cameraAnalysis.faceDetected ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cameraAnalysis.faceDetected ? 'bg-green-400' : 'bg-red-400'}`} />
                    {cameraAnalysis.faceDetected ? 'Face' : 'No face'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/60 backdrop-blur-md border border-gray-600/30 px-2 py-0.5 text-[10px] text-gray-300">
                    Eye {Math.round(cameraAnalysis.eyeContact)}%
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-900/60 backdrop-blur-md border border-gray-600/30 px-2 py-0.5 text-[10px] text-gray-300">
                    Posture {Math.round(cameraAnalysis.postureScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: Chat Panel (~47%) */}
          <div className="flex w-[47%] flex-col border-x border-gray-800/50">
            {/* Interviewer header — compact */}
            <div className="flex items-center justify-between bg-gray-900/40 px-5 py-2.5 mt-10">
              <AIInterviewerAvatar
                state={avatarState}
                size="md"
                showName={true}
                showStatus={true}
                mode="PRACTICE"
              />
              <PhaseIndicator phase={conv.phase} isAISpeaking={conv.isAISpeaking} mode="PRACTICE" />
            </div>

            {/* Scrollable conversation history */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scroll-smooth">
              {conv.conversationHistory.map((msg, idx) => (
                <div key={idx} className="animate-[fadeIn_0.3s_ease-out]">
                  {msg.role === 'ai' ? (
                    <div className="flex gap-3 max-w-[95%]">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center shadow-lg ${
                          msg.isCoaching
                            ? 'bg-gradient-to-br from-amber-500/40 to-orange-600/40 ring-1 ring-amber-500/30'
                            : 'bg-gradient-to-br from-emerald-500/40 to-teal-600/40 ring-1 ring-emerald-500/30'
                        }`}>
                          <span className={`text-xs font-bold ${
                            msg.isCoaching ? 'text-amber-200' : 'text-emerald-200'
                          }`}>S</span>
                        </div>
                      </div>
                      <div className={`flex-1 rounded-2xl rounded-tl-md px-4 py-3 ${
                        msg.isCoaching
                          ? 'bg-amber-900/30 border border-amber-700/30'
                          : msg.isAnswerFeedback
                            ? 'bg-emerald-900/20 border border-emerald-700/30'
                            : 'bg-gray-800/50 border border-gray-700/40'
                      }`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-semibold ${
                            msg.isCoaching ? 'text-amber-300' : 'text-emerald-300'
                          }`}>
                            {msg.isCoaching ? 'Coaching Tip' : 'Sarah'}
                          </span>
                          {msg.isCoaching && (
                            <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          )}
                          {msg.spokenViaTTS && !msg.isCoaching && (
                            <svg className="h-3 w-3 text-gray-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed ${
                          msg.isCoaching ? 'text-amber-100/90' : 'text-gray-100'
                        }`}>
                          {msg.text}
                          {/* Show loading indicator on the latest AI message while TTS is loading */}
                          {msg.spokenViaTTS && !msg.isCoaching && idx === conv.conversationHistory.length - 1 && conv.isAISpeaking && (
                            <span className="inline-flex ml-1.5 gap-0.5 align-middle">
                              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="h-1 w-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end max-w-[95%] ml-auto">
                      <div className="flex-1 rounded-2xl rounded-tr-md bg-indigo-600/15 border border-indigo-500/25 px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-indigo-300">You</span>
                        </div>
                        <p className="text-sm text-gray-100 leading-relaxed">{msg.text}</p>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-600/40 ring-1 ring-indigo-500/30 flex items-center justify-center shadow-lg">
                          <span className="text-xs font-bold text-indigo-200">U</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Auto-submit countdown indicator */}
              {conv.isAutoSubmitCountdown && (
                <div className="text-center py-2">
                  <span className="text-xs text-yellow-400 animate-pulse inline-flex items-center gap-1.5 bg-yellow-900/20 rounded-full px-3 py-1 border border-yellow-700/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-ping" />
                    Auto-submitting... (silence detected)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Coaching Panel (~25%) */}
          <div className="w-[25%] mt-10 flex flex-col">
            <CoachingPanel
              eyeContact={liveMetrics.eyeContact}
              postureScore={liveMetrics.postureScore}
              lightingQuality={liveMetrics.lightingQuality}
              speakingRate={liveMetrics.speakingRate}
              fillerCount={liveMetrics.fillerCount}
              blinkRate={liveMetrics.blinkRate}
              tips={conv.coachingTips}
            />

            {/* Network & Connection Status */}
            <div className="mt-auto border-t border-gray-800/50 px-4 py-3 space-y-2">
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Connection</h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Status</span>
                  <span className={`text-[11px] font-medium ${connectionIsOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {connectionIsOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Quality</span>
                  <span className={`text-[11px] font-medium ${
                    connectionQuality === 'excellent' ? 'text-green-400' :
                    connectionQuality === 'good' ? 'text-emerald-400' :
                    connectionQuality === 'fair' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {connectionQuality}
                  </span>
                </div>
                {connectionEffectiveType && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Network</span>
                    <span className="text-[11px] text-gray-400">{connectionEffectiveType}</span>
                  </div>
                )}
                {connectionSpeedMbps > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Speed</span>
                    <span className={`text-[11px] ${connectionSpeedMbps >= 5 ? 'text-green-400' : connectionSpeedMbps >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {connectionSpeedMbps.toFixed(1)} Mbps
                    </span>
                  </div>
                )}
                {heartbeat.latency > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Latency</span>
                    <span className={`text-[11px] ${heartbeat.latency < 200 ? 'text-green-400' : heartbeat.latency < 500 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {heartbeat.latency}ms
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">Heartbeat</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] ${heartbeat.isAlive ? 'text-green-400' : 'text-red-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${heartbeat.isAlive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    {heartbeat.isAlive ? 'Active' : 'Lost'}
                  </span>
                </div>
                {autoSave.lastSaved && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Saved</span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(autoSave.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Voice interrupt indicator */}
        {conv.isAISpeaking && (
          <div className="flex justify-center py-1 bg-gradient-to-r from-transparent via-gray-900/60 to-transparent">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
              <svg className="w-3.5 h-3.5 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
              Speak to interrupt
            </span>
          </div>
        )}

        {/* BOTTOM BAR — compact, glassmorphism */}
        <div className="bg-gray-900/70 backdrop-blur-xl border-t border-gray-700/40">
          {/* Transcript + controls in one row */}
          <div className="flex items-center gap-3 px-4 py-2">
            {/* Mic indicator */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {conv.isMicOn && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
              )}
              <MicVolumeBars stream={micStream} isListening={conv.isMicOn} />
            </div>

            {/* Transcript */}
            <div className="flex-1 min-h-[2rem] rounded-xl bg-gray-800/40 border border-gray-700/40 px-3 py-1.5">
              {conv.transcript || conv.interimTranscript ? (
                <p className="text-sm text-gray-200 leading-snug">
                  {conv.transcript}
                  {conv.interimTranscript && (
                    <span className="text-gray-400 italic"> {conv.interimTranscript}</span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  {conv.phase === 'user-turn'
                    ? 'Start speaking your answer...'
                    : conv.isAISpeaking
                      ? 'Sarah is speaking...'
                      : conv.phase === 'processing'
                        ? 'Processing...'
                        : 'Waiting...'}
                </p>
              )}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800/40">
            <InterviewControls
              mode="PRACTICE"
              config={interview.config}
              isPaused={isPaused}
              isLoading={isLoading}
              isListening={conv.isMicOn}
              isAISpeaking={conv.isAISpeaking}
              onToggleMic={conv.toggleMic}
              onPause={conv.pauseInterview}
              onResume={conv.resumeInterview}
              onSkip={conv.skipQuestion}
              onEnd={conv.endInterview}
              onNextQuestion={conv.submitAnswer}
              hasTranscript={!!conv.transcript.trim()}
            />

            <div className="flex items-center gap-3">
              {conv.phase === 'user-turn' && conv.silenceSeconds > 0 && !conv.transcript.trim() && (
                <span className="text-[10px] text-gray-600 dark:text-gray-400">{conv.silenceSeconds}s</span>
              )}
              {conv.phase === 'user-turn' && (
                <button
                  onClick={conv.requestRephrase}
                  className="text-[11px] text-gray-500 hover:text-emerald-400 transition-colors"
                >
                  Rephrase?
                </button>
              )}
              {conv.isAutoSubmitCountdown && (
                <button
                  onClick={conv.cancelAutoSubmit}
                  className="text-[11px] text-yellow-400 hover:text-yellow-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PAUSE OVERLAY */}
        {isPaused && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="rounded-2xl bg-gray-800 border border-gray-700 shadow-2xl p-8 max-w-md w-full mx-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20">
                <svg className="h-8 w-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Practice Paused</h2>
              <p className="text-gray-400 mb-6">
                Take your time. Your progress has been saved. Click resume when you are ready to continue.
              </p>
              <button
                onClick={conv.resumeInterview}
                disabled={isLoading}
                className="rounded-lg bg-emerald-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading ? 'Resuming...' : 'Resume Practice'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ====================================================================
  // MOCK INTERVIEW LAYOUT: 2-column
  // ====================================================================
  return (
    <div className="flex h-screen flex-col bg-gray-950 text-white overflow-hidden">
      {/* FLOATING TOP BAR — minimal */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 rounded-full bg-gray-900/70 backdrop-blur-md border border-gray-700/50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-400">Mock Interview</span>
          <span className="text-xs text-gray-500">Q{conv.questionNumber}</span>
        </div>

        <div className="rounded-full bg-gray-900/70 backdrop-blur-md border border-gray-700/50 px-4 py-1.5">
          <InterviewTimer
            seconds={timer.seconds}
            formatted={timer.formatted}
            isRunning={timer.isRunning}
            hasDuration={hasDuration}
            totalDurationSeconds={totalDurationSeconds}
          />
        </div>

        <div className="flex items-center gap-2">
          {isFullscreen && (
            <button
              onClick={exitFullscreen}
              className="rounded-full bg-gray-900/70 backdrop-blur-md border border-gray-700/50 p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 transition-all"
              title="Exit Fullscreen (Esc)"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner — floating */}
      {error && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 max-w-lg w-full px-4">
          <div className="flex items-center justify-between rounded-xl bg-red-950/90 backdrop-blur-md border border-red-800/60 p-3 shadow-lg">
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={clearError} className="text-red-400 hover:text-red-200 ml-3">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT — 2 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Camera Preview (~40%) */}
        <div className="relative flex w-[40%] flex-col">
          <div className="flex-1 bg-black relative">
            <CameraPreview
              stream={camera.stream}
              isActive={camera.isActive}
              analysisState={cameraAnalysis}
              showOverlays={false}
              mirrored={true}
              externalVideoRef={camera.videoRef}
            />
            {/* Floating camera status */}
            <div className="absolute bottom-3 left-3">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-md ${
                cameraAnalysis.faceDetected ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cameraAnalysis.faceDetected ? 'bg-green-400' : 'bg-red-400'}`} />
                {cameraAnalysis.faceDetected ? 'Camera active' : 'No face'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: AI Interviewer Panel (~60%) */}
        <div className="flex w-[60%] flex-col border-l border-gray-800/50">
          {/* Interviewer header — compact */}
          <div className="flex items-center justify-between bg-gray-900/40 px-5 py-2.5 mt-10">
            <AIInterviewerAvatar
              state={avatarState}
              size="md"
              showName={true}
              showStatus={true}
              mode="MOCK"
            />
            <PhaseIndicator phase={conv.phase} isAISpeaking={conv.isAISpeaking} mode="MOCK" />
          </div>

          {/* Scrollable conversation history */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scroll-smooth">
            {conv.conversationHistory.map((msg, idx) => (
              <div key={idx} className="animate-[fadeIn_0.3s_ease-out]">
                {msg.role === 'ai' ? (
                  <div className="flex gap-3 max-w-[95%]">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/40 to-blue-600/40 ring-1 ring-indigo-500/30 flex items-center justify-center shadow-lg">
                        <span className="text-xs font-bold text-indigo-200">S</span>
                      </div>
                    </div>
                    <div className="flex-1 rounded-2xl rounded-tl-md bg-gray-800/50 border border-gray-700/40 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-indigo-300">Sarah</span>
                        {msg.spokenViaTTS && (
                          <svg className="h-3 w-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-100 leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 justify-end max-w-[95%] ml-auto">
                    <div className="flex-1 rounded-2xl rounded-tr-md bg-indigo-600/15 border border-indigo-500/25 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-indigo-300">You</span>
                      </div>
                      <p className="text-sm text-gray-100 leading-relaxed">{msg.text}</p>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-600/40 ring-1 ring-indigo-500/30 flex items-center justify-center shadow-lg">
                        <span className="text-xs font-bold text-indigo-200">U</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {conv.isAutoSubmitCountdown && (
              <div className="text-center py-2">
                <span className="text-xs text-yellow-400 animate-pulse inline-flex items-center gap-1.5 bg-yellow-900/20 rounded-full px-3 py-1 border border-yellow-700/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-ping" />
                  Auto-submitting... (silence detected)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voice interrupt */}
      {conv.isAISpeaking && (
        <div className="flex justify-center py-1 bg-gradient-to-r from-transparent via-gray-900/60 to-transparent">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
            <svg className="w-3.5 h-3.5 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
            Speak to interrupt
          </span>
        </div>
      )}

      {/* BOTTOM BAR — compact */}
      <div className="bg-gray-900/70 backdrop-blur-xl border-t border-gray-700/40">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            {conv.isMicOn && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            )}
            <MicVolumeBars stream={micStream} isListening={conv.isMicOn} />
          </div>

          <div className="flex-1 min-h-[2rem] rounded-xl bg-gray-800/40 border border-gray-700/40 px-3 py-1.5">
            {conv.transcript || conv.interimTranscript ? (
              <p className="text-sm text-gray-200 leading-snug">
                {conv.transcript}
                {conv.interimTranscript && (
                  <span className="text-gray-400 italic"> {conv.interimTranscript}</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-gray-500 italic">
                {conv.phase === 'user-turn'
                  ? 'Start speaking your answer...'
                  : conv.isAISpeaking
                    ? 'Sarah is speaking...'
                    : conv.phase === 'processing'
                      ? 'Evaluating...'
                      : 'Waiting...'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800/40">
          <InterviewControls
            mode="MOCK"
            config={interview.config}
            isPaused={isPaused}
            isLoading={isLoading}
            isListening={conv.isMicOn}
            isAISpeaking={conv.isAISpeaking}
            onToggleMic={conv.toggleMic}
            onPause={conv.pauseInterview}
            onResume={conv.resumeInterview}
            onSkip={conv.skipQuestion}
            onEnd={conv.endInterview}
          />

          <div className="flex items-center gap-3">
            {conv.isAutoSubmitCountdown && (
              <button
                onClick={conv.cancelAutoSubmit}
                className="text-[11px] text-yellow-400 hover:text-yellow-200 transition-colors font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* No pause overlay for mock mode — pausing is not allowed */}
    </div>
  );
};
