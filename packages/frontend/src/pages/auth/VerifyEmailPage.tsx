import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { ThemeToggle } from '../../components/common/ThemeToggle';

type VerifyStatus = 'loading' | 'success' | 'error';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token found. Please check your email link.');
      return;
    }

    const verifyEmail = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.error?.message || 'Email verification failed. The link may have expired.'
        );
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail.trim()) return;
    setResendStatus('sending');
    try {
      await authApi.resendVerification(resendEmail.trim());
      setResendStatus('sent');
      setResendMessage('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setResendStatus('error');
      setResendMessage(err.response?.data?.error?.message || 'Failed to resend. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 transition-colors relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto">
                <svg className="animate-spin h-16 w-16 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verifying Your Email</h2>
              <p className="text-gray-500">Please wait while we verify your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Verified</h2>
              <p className="text-gray-500">
                Your email has been verified successfully. You can now sign in to your account.
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verification Failed</h2>
              <p className="text-gray-500 dark:text-gray-400">{errorMessage}</p>

              {/* Resend verification form */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Need a new verification link? Enter your email:
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleResend}
                    disabled={resendStatus === 'sending' || !resendEmail.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {resendStatus === 'sending' ? 'Sending...' : 'Resend'}
                  </button>
                </div>
                {resendMessage && (
                  <p className={`text-sm ${resendStatus === 'sent' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Link
                  to="/login"
                  className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Go to Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-block px-6 py-2.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Create a New Account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
