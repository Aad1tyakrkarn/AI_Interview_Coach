import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth.api';
import { LoginForm } from '../../components/auth/LoginForm';
import { TwoFactorInput } from '../../components/auth/TwoFactorInput';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [needs2FA, setNeeds2FA] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [lastEmail, setLastEmail] = useState('');

  const handleResendVerification = async () => {
    if (!lastEmail) return;
    setResendStatus('sending');
    try {
      await authApi.resendVerification(lastEmail);
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  };

  const handleLogin = async (email: string, password: string) => {
    clearError();
    setEmailNotVerified(false);
    setResendStatus('idle');
    setLastEmail(email);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error?.message || '';
      if (status === 403 && err.response?.data?.error?.code === '2FA_REQUIRED') {
        setCredentials({ email, password });
        setNeeds2FA(true);
      } else if (status === 403 && message.toLowerCase().includes('email not verified')) {
        setEmailNotVerified(true);
      }
    }
  };

  const handle2FASubmit = async (code: string) => {
    setTwoFactorError(null);
    try {
      await login(credentials.email, credentials.password, code);
      navigate('/dashboard');
    } catch {
      setTwoFactorError('Invalid verification code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 transition-colors relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your interview platform account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {needs2FA ? (
            <div>
              <button
                onClick={() => { setNeeds2FA(false); setTwoFactorError(null); }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to login
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Your account is protected with two-factor authentication. Enter the code from your authenticator app.
              </p>
              <TwoFactorInput
                onSubmit={handle2FASubmit}
                isLoading={isLoading}
                error={twoFactorError}
              />
            </div>
          ) : (
            <>
              <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
              {emailNotVerified && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
                    Your email is not verified yet. Check your inbox or resend the verification link.
                  </p>
                  {resendStatus === 'sent' ? (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Verification email sent! Check your inbox.
                    </p>
                  ) : (
                    <button
                      onClick={handleResendVerification}
                      disabled={resendStatus === 'sending'}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</Link>
          <span className="mx-2">|</span>
          <Link to="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
};
