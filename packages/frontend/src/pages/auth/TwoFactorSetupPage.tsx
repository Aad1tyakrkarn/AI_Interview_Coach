import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { TwoFactorInput } from '../../components/auth/TwoFactorInput';

export const TwoFactorSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        const { data } = await authApi.setup2FA();
        setQrCodeUrl(data.qrCodeUrl || data.qrCode);
        setSecret(data.secret || '');
      } catch (err: any) {
        setSetupError(err.response?.data?.error?.message || 'Failed to set up two-factor authentication.');
      } finally {
        setIsLoadingSetup(false);
      }
    };
    setup();
  }, []);

  const handleVerify = async (code: string) => {
    setVerifyError(null);
    setIsVerifying(true);
    try {
      await authApi.verify2FA(code);
      setSuccess(true);
    } catch (err: any) {
      setVerifyError(err.response?.data?.error?.message || 'Invalid code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoadingSetup) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500">Setting up two-factor authentication...</p>
        </div>
      </div>
    );
  }

  if (setupError) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Setup Failed</h2>
          <p className="text-gray-500 mb-4">{setupError}</p>
          <button
            onClick={() => navigate('/security')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Security Settings
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">2FA Enabled</h2>
          <p className="text-gray-500 mb-4">
            Two-factor authentication has been enabled on your account. You will need to enter a code from your authenticator app each time you sign in.
          </p>
          <button
            onClick={() => navigate('/security')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Security Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Set Up Two-Factor Authentication</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Step 1: Scan QR Code</h2>
          <p className="text-sm text-gray-500 mb-4">
            Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).
          </p>
          {qrCodeUrl && (
            <div className="flex justify-center">
              <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 border rounded-lg" />
            </div>
          )}
        </div>

        {secret && (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Or enter this code manually in your authenticator app:
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-3 text-center">
              <code className="text-sm font-mono font-bold tracking-wider text-gray-900 dark:text-white select-all">{secret}</code>
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Step 2: Verify Code</h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter the 6-digit code from your authenticator app to complete setup.
          </p>
          <TwoFactorInput
            onSubmit={handleVerify}
            isLoading={isVerifying}
            error={verifyError}
          />
        </div>
      </div>
    </div>
  );
};
