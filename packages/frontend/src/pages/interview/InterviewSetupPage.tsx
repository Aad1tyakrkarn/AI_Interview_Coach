import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInterviewStore } from '../../store/interviewStore';
import { resumeApi } from '../../api/resume.api';

type InterviewMode = 'PRACTICE' | 'MOCK';
type InterviewType = 'general' | 'resume';

interface ResumeOption {
  id: string;
  filename: string;
  status: string;
}

const DURATIONS = [10, 15, 20, 25, 30, 45, 60];

const DURATION_TO_QUESTIONS: Record<number, number> = {
  10: 5, 15: 7, 20: 10, 25: 12, 30: 15, 45: 20, 60: 25,
};

function getQuestionCountForDuration(duration: number | null): number {
  if (duration === null) return 10;
  return DURATION_TO_QUESTIONS[duration] ?? Math.round(duration / 2);
}

export const InterviewSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { createInterview, isLoading, error, clearError } = useInterviewStore();

  const [mode, setMode] = useState<InterviewMode>('PRACTICE');
  const [interviewType, setInterviewType] = useState<InterviewType>('general');
  const [targetRole, setTargetRole] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [selectedResume, setSelectedResume] = useState('');
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [roleError, setRoleError] = useState(false);

  const questionCount = getQuestionCountForDuration(duration);
  const parsedResumes = resumes.filter((r) => r.status === 'parsed');

  useEffect(() => {
    const loadResumes = async () => {
      setResumesLoading(true);
      try {
        const response = await resumeApi.list();
        const list = Array.isArray(response.data) ? response.data : response.data?.data ?? response.data ?? [];
        setResumes(
          list.map((r: Record<string, any>) => ({
            id: r.id,
            filename: r.fileName ?? r.file_name ?? r.filename ?? r.name ?? 'Untitled Resume',
            status: (r.status || 'pending').toLowerCase(),
          })),
        );
      } catch { /* optional */ } finally { setResumesLoading(false); }
    };
    loadResumes();
  }, []);

  useEffect(() => { clearError(); }, [mode, targetRole, duration, clearError]);

  // Clear role error when switching to resume-based questions
  useEffect(() => { if (interviewType === 'resume') setRoleError(false); }, [interviewType]);

  const handleSubmit = async () => {
    // Role is mandatory when question source is role-based
    if (interviewType === 'general' && !targetRole.trim()) {
      setRoleError(true);
      document.getElementById('targetRole')?.focus();
      return;
    }
    // Resume selection is mandatory when resume-powered
    if (interviewType === 'resume' && !selectedResume) {
      return;
    }
    try {
      const modeLabel = mode === 'PRACTICE' ? 'Practice Coach' : 'Mock Interview';
      const typeLabel = interviewType === 'resume' && selectedResume ? ' (Resume)' : '';
      const title = `${modeLabel} - ${targetRole || 'General'}${typeLabel}`;
      const id = await createInterview({
        title, mode,
        difficultyLevel: 'INTERMEDIATE',
        targetRole: targetRole || undefined,
        durationMinutes: duration != null ? duration : undefined,
        questionCount,
        resumeId: interviewType === 'resume' && selectedResume ? selectedResume : undefined,
      });
      navigate(`/interview/${id}/consent`);
    } catch { /* error in store */ }
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors">
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Configure Your Session
          </h1>
          <p className="mt-3 text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Choose your interview mode, set your preferences, and let Sarah prepare a personalized experience for you.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={clearError} className="text-red-400 hover:text-red-600 dark:hover:text-red-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Step 1: Mode Selection ── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-sm font-bold text-indigo-600 dark:text-indigo-400">1</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Interview Mode</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Practice Coach */}
            <button
              onClick={() => { setMode('PRACTICE'); setDuration(null); }}
              className={`relative text-left p-7 rounded-2xl border-2 transition-all duration-200 group ${
                mode === 'PRACTICE'
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/15 shadow-lg ring-1 ring-emerald-200 dark:ring-emerald-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md'
              }`}
            >
              {mode === 'PRACTICE' && (
                <div className="absolute top-4 right-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-colors ${
                  mode === 'PRACTICE' ? 'bg-emerald-100 dark:bg-emerald-800/30' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20'
                }`}>
                  <svg className={`w-7 h-7 ${mode === 'PRACTICE' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${mode === 'PRACTICE' ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    Practice & Learn
                  </h3>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    mode === 'PRACTICE' ? 'bg-emerald-200/80 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}>Guided Coaching</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">
                Sarah acts as your personal interview coach — giving you instant feedback on your answers,
                body language, eye contact, and speaking pace. Perfect for building confidence before the real thing.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Live coaching tips', 'Detailed answer feedback', 'Pause & skip anytime', 'Relaxed environment'].map((tag) => (
                  <span key={tag} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                    mode === 'PRACTICE' ? 'bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>{tag}</span>
                ))}
              </div>
            </button>

            {/* Mock Interview */}
            <button
              onClick={() => { setMode('MOCK'); if (duration === null) setDuration(20); }}
              className={`relative text-left p-7 rounded-2xl border-2 transition-all duration-200 group ${
                mode === 'MOCK'
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/15 shadow-lg ring-1 ring-indigo-200 dark:ring-indigo-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
              }`}
            >
              {mode === 'MOCK' && (
                <div className="absolute top-4 right-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-colors ${
                  mode === 'MOCK' ? 'bg-indigo-100 dark:bg-indigo-800/30' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
                }`}>
                  <svg className={`w-7 h-7 ${mode === 'MOCK' ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${mode === 'MOCK' ? 'text-indigo-800 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>
                    Mock Interview
                  </h3>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    mode === 'MOCK' ? 'bg-indigo-200/80 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}>Simulate the Real Thing</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">
                Experience a realistic interview simulation where Sarah evaluates you silently — just like a real hiring panel.
                Receive a comprehensive performance report with scores and actionable insights at the end.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Professional format', 'Silent evaluation', 'Performance report', 'Timed session'].map((tag) => (
                  <span key={tag} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                    mode === 'MOCK' ? 'bg-indigo-100 dark:bg-indigo-800/30 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>{tag}</span>
                ))}
              </div>
            </button>
          </div>
        </section>

        {/* ── Step 2: Question Source ── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-sm font-bold text-indigo-600 dark:text-indigo-400">2</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Choose Question Source</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role-Based */}
            <button
              onClick={() => { setInterviewType('general'); setSelectedResume(''); }}
              className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                interviewType === 'general'
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/15 shadow-md ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {interviewType === 'general' && (
                <div className="absolute top-3 right-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  interviewType === 'general' ? 'bg-blue-100 dark:bg-blue-800/30' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <svg className={`w-5 h-5 ${interviewType === 'general' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h3 className={`text-base font-bold ${interviewType === 'general' ? 'text-blue-800 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                  Role-Based Questions
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                AI generates dynamic questions tailored to your target role — covering technical concepts, behavioral scenarios, and problem-solving challenges.
              </p>
            </button>

            {/* Resume-Based */}
            <button
              onClick={() => setInterviewType('resume')}
              className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                interviewType === 'resume'
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/15 shadow-md ring-1 ring-purple-200 dark:ring-purple-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 hover:border-purple-300 hover:shadow-sm'
              }`}
            >
              {interviewType === 'resume' && (
                <div className="absolute top-3 right-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-white">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  interviewType === 'resume' ? 'bg-purple-100 dark:bg-purple-800/30' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <svg className={`w-5 h-5 ${interviewType === 'resume' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h3 className={`text-base font-bold ${interviewType === 'resume' ? 'text-purple-800 dark:text-purple-300' : 'text-gray-800 dark:text-gray-200'}`}>
                  Resume-Powered Questions
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Sarah reads your resume and asks about your specific skills, projects, and experience. Every 3rd question is directly based on what you've built.
              </p>
            </button>
          </div>

          {/* Resume dropdown */}
          {interviewType === 'resume' && (
            <div className="mt-5 bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              {resumesLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading your resumes...
                </div>
              ) : parsedResumes.length > 0 ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select a parsed resume <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-purple-500 bg-white dark:bg-gray-800 ${
                      !selectedResume
                        ? 'border-red-400 dark:border-red-500 focus:ring-red-300 dark:focus:ring-red-900/50'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                    }`}
                  >
                    <option value="">-- Choose your resume --</option>
                    {parsedResumes.map((r) => (
                      <option key={r.id} value={r.id}>{r.filename}</option>
                    ))}
                  </select>
                  {!selectedResume && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Required — select a resume to enable personalized questions
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    No resumes found. Upload one to unlock resume-powered questions.
                  </p>
                  <Link
                    to="/resumes"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Resume
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Step 3: Role & Duration ── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-sm font-bold text-indigo-600 dark:text-indigo-400">3</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Customize Your Session</h2>
          </div>

          <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Target Role */}
            <div>
              <label htmlFor="targetRole" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                What role are you preparing for?
                {interviewType === 'general' && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <input
                id="targetRole"
                type="text"
                value={targetRole}
                onChange={(e) => { setTargetRole(e.target.value); if (roleError) setRoleError(false); }}
                placeholder="e.g. Full Stack Developer, Data Scientist, Product Manager..."
                className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-indigo-500 bg-white dark:bg-gray-800 transition-all ${
                  roleError
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-300 dark:focus:ring-red-900/50'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                }`}
              />
              {roleError ? (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please enter a target role for role-based questions
                </p>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  {interviewType === 'general'
                    ? 'Required \u2014 Sarah will tailor all questions to match this role'
                    : 'Optional \u2014 Sarah will tailor questions to this role along with your resume'}
                </p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                How long do you want to practice?
              </label>
              <div className="flex flex-wrap gap-2">
                {mode === 'PRACTICE' && (
                  <button
                    onClick={() => setDuration(null)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      duration === null
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                    }`}
                  >
                    Unlimited
                  </button>
                )}
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      duration === d
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                {duration !== null
                  ? `Sarah will ask approximately ${questionCount} questions in ${duration} minutes`
                  : `Sarah will ask approximately ${questionCount} questions at your own pace`}
              </p>
            </div>
          </div>
        </section>

        {/* ── Start Button ── */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || (interviewType === 'general' && !targetRole.trim()) || (interviewType === 'resume' && !selectedResume)}
            className={`group px-8 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              isLoading || (interviewType === 'general' && !targetRole.trim())
                ? 'bg-indigo-400 dark:bg-indigo-800 text-white/70 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Preparing Session...
              </>
            ) : (
              <>
                Begin Interview
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
