import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../api/user.api';
import { authApi } from '../../api/auth.api';

interface ProfileForm {
  firstName: string;
  lastName: string;
}

interface OverviewStats {
  memberSince: string | null;
  totalInterviews: number;
  lastInterviewAt: string | null;
}

function formatJoinedDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeFromNow(iso: string | null): string {
  if (!iso) return 'Never';
  const diffSec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ProfilePage: React.FC = () => {
  const { user, loadUser } = useAuthStore();

  const [form, setForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
  });
  const [overview, setOverview] = useState<OverviewStats>({
    memberSince: null,
    totalInterviews: 0,
    lastInterviewAt: null,
  });
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // Parallel — profile + latest interview to derive "last interview"
        const [profileRes, historyRes] = await Promise.allSettled([
          userApi.getProfile(),
          userApi.getHistory(1, 1),
        ]);

        if (profileRes.status === 'fulfilled') {
          const data = profileRes.value.data;
          setForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
          });
          setEmailVerified(Boolean(data.emailVerified));
          setOverview((prev) => ({ ...prev, memberSince: data.createdAt || null }));
        }

        if (historyRes.status === 'fulfilled') {
          const res = historyRes.value.data;
          const arr = res?.data ?? res?.interviews ?? res?.history ?? res ?? [];
          const first = Array.isArray(arr) ? arr[0] : null;
          const total = res?.pagination?.total ?? (Array.isArray(arr) ? arr.length : 0);
          setOverview((prev) => ({
            ...prev,
            totalInterviews: total,
            lastInterviewAt:
              first?.completedAt || first?.startedAt || first?.createdAt || first?.date || null,
          }));
        }
      } catch {
        setError('Failed to load profile data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleResendVerification = async () => {
    if (!user?.email || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      await authApi.resendVerification(user.email);
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await userApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
      });
      await loadUser();
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-10 w-10 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg ' +
    'focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 ' +
    'outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white ' +
    'placeholder-gray-400 dark:placeholder-gray-500 transition-colors';

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  const sectionClass =
    'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6';

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Profile</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Manage your basic account information.
      </p>

      {/* Account overview strip */}
      <div className="grid grid-cols-3 gap-6 sm:gap-8 border-y border-gray-100 dark:border-gray-800 py-5 mb-6">
        <OverviewStat
          label="Member since"
          value={formatJoinedDate(overview.memberSince)}
        />
        <OverviewStat
          label="Total interviews"
          value={String(overview.totalInterviews)}
        />
        <OverviewStat
          label="Last interview"
          value={relativeFromNow(overview.lastInterviewAt)}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300 mb-4">
          Profile updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Information */}
        <div className={sectionClass}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className={labelClass}>First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                placeholder="e.g., Sarah"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="lastName" className={labelClass}>Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                placeholder="e.g., Johnson"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="email" className={labelClass + ' mb-0'}>Email</label>
                {/* Email verification badge */}
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      Not verified
                    </span>
                    {resendStatus === 'sent' ? (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        Email sent — check your inbox
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendStatus === 'sending'}
                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                      >
                        {resendStatus === 'sending' ? 'Sending…' : 'Resend verification'}
                      </button>
                    )}
                    {resendStatus === 'error' && (
                      <span className="text-[11px] text-red-600 dark:text-red-400">Failed, try again</span>
                    )}
                  </span>
                )}
              </div>
              <input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className={`${inputClass} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>
          </div>
        </div>

        {/* Informational card — explain where interview context comes from */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                How Sarah personalises your interview
              </p>
              <p className="mb-3">
                Target role, skills and experience are picked up automatically when you start an interview — either
                from your uploaded resume or from the role you enter on the setup page. No need to maintain them here.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/resumes"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage resume
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/interview/setup"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Start a new interview
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-400
              text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Small overview stat tile (used in the account-overview strip at the top)
// -----------------------------------------------------------------------------
const OverviewStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1 tabular-nums truncate">
      {value}
    </p>
  </div>
);
