import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInterviewStore } from '../../store/interviewStore';

type ConsentKey = 'camera' | 'mic' | 'data';

interface ConsentItem {
  key: ConsentKey;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const ConsentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { interview, isLoading, error, loadInterview, clearError } =
    useInterviewStore();

  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    camera: false,
    mic: false,
    data: false,
  });

  useEffect(() => {
    if (id && !interview) {
      loadInterview(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const allConsented = consents.camera && consents.mic && consents.data;
  const consentedCount = Object.values(consents).filter(Boolean).length;

  const handleBegin = () => {
    if (!id || !allConsented) return;
    navigate(`/interview/${id}`);
  };

  const toggleAll = () => {
    const next = !allConsented;
    setConsents({ camera: next, mic: next, data: next });
  };

  const isPractice = interview?.mode === 'PRACTICE';
  const accent = isPractice ? 'emerald' : 'indigo';

  // Expectations for each mode — each has a flag for pos/neg
  const expectations: { text: string; positive: boolean }[] = isPractice
    ? [
        { text: 'Sarah coaches you with real-time feedback', positive: true },
        { text: 'Unlimited pauses allowed', positive: true },
        { text: 'Skip questions you want to come back to', positive: true },
        { text: 'Tips on eye contact, posture, voice, and answers', positive: true },
        {
          text: interview?.durationMinutes
            ? `${interview.durationMinutes} minute time limit`
            : 'No time limit — go at your own pace',
          positive: true,
        },
      ]
    : [
        {
          text: 'Simulated environment — perform as you would in a real interview',
          positive: true,
        },
        { text: 'No pauses allowed', positive: false },
        { text: 'No skipping questions', positive: false },
        {
          text: 'Sarah evaluates silently — no coaching during the interview',
          positive: false,
        },
        {
          text: `${interview?.durationMinutes ?? 20} minute time limit`,
          positive: false,
        },
      ];

  const consentItems: ConsentItem[] = [
    {
      key: 'camera',
      title: 'Camera Access',
      description: isPractice
        ? 'Sarah will analyse your eye contact, posture, and body language for coaching feedback.'
        : 'Camera monitoring during the interview session.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
      ),
    },
    {
      key: 'mic',
      title: 'Microphone Access',
      description: isPractice
        ? 'Voice analysis, speech recognition, and speaking rate feedback.'
        : 'Audio recording and speech recognition during the interview.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
      ),
    },
    {
      key: 'data',
      title: 'Data Processing',
      description: isPractice
        ? 'Processing your interview data for personalised coaching feedback.'
        : 'Processing your interview data for evaluation, scoring, and reports.',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      ),
    },
  ];

  if (isLoading && !interview) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading interview details...
        </div>
      </div>
    );
  }

  // Pre-compute colour class maps so Tailwind JIT picks them up
  const accentText = isPractice ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400';
  const accentBg = isPractice ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700';
  const accentBgLight = isPractice ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20';
  const accentBorder = isPractice ? 'border-emerald-200 dark:border-emerald-900/40' : 'border-indigo-200 dark:border-indigo-900/40';
  const accentRing = isPractice ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500';
  const checkboxAccent = isPractice ? 'text-emerald-600 focus:ring-emerald-500' : 'text-indigo-600 focus:ring-indigo-500';

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        {/* Breadcrumb + heading */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/interview/setup')}
            className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-3"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to setup
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Before You Begin</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isPractice
              ? "Review your practice session and grant a few permissions. Once you start, Sarah will guide you step by step."
              : 'Review the session details and grant the permissions needed for a realistic mock interview.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        )}

        {/* Session summary */}
        {interview && (
          <div
            className={`rounded-2xl border ${accentBorder} ${accentBgLight} shadow-sm p-6 mb-6 overflow-hidden relative`}
          >
            {/* decorative accent corner */}
            <div className={`absolute top-0 right-0 w-24 h-24 ${isPractice ? 'bg-emerald-200/30 dark:bg-emerald-500/10' : 'bg-indigo-200/30 dark:bg-indigo-500/10'} rounded-bl-full -mt-6 -mr-6`} />

            <div className="relative flex items-center gap-3 mb-5">
              <div className={`shrink-0 w-11 h-11 rounded-xl ${isPractice ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300'} flex items-center justify-center`}>
                {isPractice ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.098a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25v-4.098m16.5 0a2.25 2.25 0 00-1.07-1.916l-7.5-4.615a2.25 2.25 0 00-2.36 0L4.82 12.234a2.25 2.25 0 00-1.07 1.916m16.5 0v-1.5a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25v1.5" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${accentText}`}>
                  {isPractice ? 'Practice & Learn' : 'Mock Interview'}
                </p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isPractice ? 'Coaching Session' : 'Simulation Session'}
                </h2>
              </div>
            </div>

            <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-4">
              <SummaryStat label="Mode" value={isPractice ? 'Practice & Learn' : 'Mock Interview'} accentClass={accentText} />
              <SummaryStat
                label="Duration"
                value={interview.durationMinutes != null && interview.durationMinutes > 0 ? `${interview.durationMinutes} minutes` : 'No limit'}
              />
              <SummaryStat
                label="Questions"
                value="AI-generated"
                hint="Dynamically tailored"
              />
              {interview.targetRole && (
                <SummaryStat
                  label="Target role"
                  value={interview.targetRole}
                  wide
                />
              )}
            </div>
          </div>
        )}

        {/* What to expect */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className={`w-5 h-5 ${accentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            What to Expect
          </h2>
          <ul className="space-y-3">
            {expectations.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                    item.positive
                      ? isPractice ? 'bg-emerald-500' : 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                >
                  {item.positive ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </span>
                <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Consents */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Required Permissions</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {consentedCount === 3
                  ? 'All permissions granted.'
                  : `${consentedCount} of 3 granted.`}
              </p>
            </div>
            <button
              onClick={toggleAll}
              className={`text-xs font-medium ${accentText} hover:underline`}
            >
              {allConsented ? 'Clear all' : 'Accept all'}
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full mb-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isPractice ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${(consentedCount / 3) * 100}%` }}
            />
          </div>

          <div className="space-y-2">
            {consentItems.map((item) => {
              const checked = consents[item.key];
              return (
                <label
                  key={item.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${checked
                      ? `${accentBgLight} ${accentBorder}`
                      : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                >
                  <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                    checked
                      ? isPractice ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300'
                      : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </p>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setConsents((c) => ({ ...c, [item.key]: e.target.checked }))
                        }
                        className={`h-4 w-4 rounded border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-900 ${checkboxAccent}`}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
            <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Your camera and microphone data are analysed in real time. Nothing is shared with third parties.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/interview/setup')}
            className="px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Setup
          </button>
          <button
            onClick={handleBegin}
            disabled={!allConsented || isLoading}
            className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 ${accentRing}
              ${!allConsented || isLoading
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : `${accentBg} active:scale-[0.98]`}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting...
              </>
            ) : (
              <>
                {isPractice ? 'Begin Practice' : 'Begin Interview'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// Small helper — summary stat tile inside the session card
// -------------------------------------------------------------------------
interface SummaryStatProps {
  label: string;
  value: string;
  accentClass?: string;
  hint?: string;
  wide?: boolean;
}

const SummaryStat: React.FC<SummaryStatProps> = ({ label, value, accentClass, hint, wide }) => (
  <div className={wide ? 'col-span-2 sm:col-span-3' : ''}>
    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`mt-1 text-sm font-semibold ${accentClass ?? 'text-gray-900 dark:text-white'}`}>
      {value}
    </p>
    {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>}
  </div>
);
