import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth.api';
import { userApi } from '../../api/user.api';
import { PasswordStrengthMeter } from '../../components/auth/PasswordStrengthMeter';

interface Device {
  id: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  ip: string;
  loginAt: string;
  expiresAt: string;
  current: boolean;
}

function parseUserAgent(ua: string | null | undefined): {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
} {
  let browser = 'Unknown browser';
  let os = 'Unknown OS';
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (!ua) return { browser, os, deviceType };

  // Browser (order matters — Edge and Chrome both say "Chrome/")
  const edgeMatch = ua.match(/Edg\/([\d.]+)/);
  const chromeMatch = ua.match(/Chrome\/([\d.]+)/);
  const firefoxMatch = ua.match(/Firefox\/([\d.]+)/);
  const safariMatch = ua.match(/Version\/([\d.]+).+Safari/);
  const operaMatch = ua.match(/OPR\/([\d.]+)/);
  if (edgeMatch) browser = `Microsoft Edge ${edgeMatch[1].split('.')[0]}`;
  else if (operaMatch) browser = `Opera ${operaMatch[1].split('.')[0]}`;
  else if (chromeMatch) browser = `Google Chrome ${chromeMatch[1].split('.')[0]}`;
  else if (firefoxMatch) browser = `Firefox ${firefoxMatch[1].split('.')[0]}`;
  else if (safariMatch) browser = `Safari ${safariMatch[1].split('.')[0]}`;

  // OS
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (/Mac OS X ([\d_]+)/.test(ua)) {
    const v = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') ?? '';
    os = `macOS${v ? ' ' + v.split('.').slice(0, 2).join('.') : ''}`;
  } else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iOS';
  else if (ua.includes('iPad')) os = 'iPadOS';
  else if (ua.includes('Linux')) os = 'Linux';

  // Device type
  if (/iPad|Tablet/i.test(ua)) deviceType = 'tablet';
  else if (/Mobi|Android|iPhone/i.test(ua)) deviceType = 'mobile';
  else deviceType = 'desktop';

  return { browser, os, deviceType };
}

function relativeTime(iso: string): string {
  if (!iso) return 'Unknown';
  const date = new Date(iso);
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  const future = diffSec < 0;
  const units: [number, string][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [31557600, 'month'],
    [Infinity, 'year'],
  ];
  const divisors = [1, 60, 3600, 86400, 604800, 2629800, 31557600];
  for (let i = 0; i < units.length; i++) {
    if (abs < units[i][0]) {
      const value = Math.max(1, Math.floor(abs / divisors[i]));
      const unit = units[i][1] + (value === 1 ? '' : 's');
      return future ? `in ${value} ${unit}` : `${value} ${unit} ago`;
    }
  }
  return date.toLocaleDateString();
}

export const SecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [showDisable2FA, setShowDisable2FA] = useState(false);

  // Devices
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [refreshingDevices, setRefreshingDevices] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revokingAllOthers, setRevokingAllOthers] = useState(false);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeleteConfirmText('');
    setShowDeletePassword(false);
    setDeleteError(null);
  };

  // Lock body scroll while modal is open
  useEffect(() => {
    if (showDeleteModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showDeleteModal]);

  // Close on Escape
  useEffect(() => {
    if (!showDeleteModal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDeleteModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleteModal, isDeleting]);

  useEffect(() => {
    setTwoFactorEnabled(user?.twoFactorEnabled || false);
  }, [user]);

  const loadDevices = async (isRefresh = false) => {
    if (isRefresh) setRefreshingDevices(true);
    setDevicesError(null);
    try {
      const { data } = await userApi.getDevices();
      const raw = Array.isArray(data) ? data : [];
      setDevices(
        raw.map((s: any) => {
          const { browser, os, deviceType } = parseUserAgent(s.userAgent || '');
          return {
            id: s.id,
            browser,
            os,
            deviceType,
            ip: s.ipAddress || s.ip || 'Unknown',
            loginAt: s.loginAt || s.createdAt || '',
            expiresAt: s.expiresAt || '',
            current: Boolean(s.current),
          };
        }),
      );
    } catch (err: any) {
      setDevicesError(err?.response?.data?.error?.message || 'Failed to load active sessions.');
    } finally {
      setDevicesLoading(false);
      setRefreshingDevices(false);
    }
  };

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) { setPasswordError('Current password is required'); return; }
    if (!newPassword) { setPasswordError('New password is required'); return; }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmNewPassword) { setPasswordError('Passwords do not match'); return; }

    setPasswordLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setTwoFactorError('Please enter a valid 6-digit code');
      return;
    }
    setDisabling2FA(true);
    setTwoFactorError(null);
    try {
      await authApi.disable2FA(disableCode);
      setTwoFactorEnabled(false);
      setShowDisable2FA(false);
      setDisableCode('');
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.error?.message || 'Invalid code.');
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    const device = devices.find((d) => d.id === sessionId);
    if (device?.current) return; // safety — button should already be disabled
    setRevokingId(sessionId);
    setDevicesError(null);
    try {
      await userApi.revokeDevice(sessionId);
      setDevices((prev) => prev.filter((d) => d.id !== sessionId));
    } catch (err: any) {
      setDevicesError(err?.response?.data?.error?.message || 'Failed to revoke session.');
    } finally {
      setRevokingId(null);
      setConfirmRevokeId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    setRevokingAllOthers(true);
    setDevicesError(null);
    try {
      await userApi.revokeOtherDevices();
      setDevices((prev) => prev.filter((d) => d.current));
      setShowRevokeAllConfirm(false);
    } catch (err: any) {
      setDevicesError(err?.response?.data?.error?.message || 'Failed to sign out of other devices.');
    } finally {
      setRevokingAllOthers(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE exactly as shown to confirm.');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Please enter your password.');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await userApi.deleteAccount(deletePassword);
      await logout();
      navigate('/login');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error?.message;
      if (status === 401) {
        setDeleteError(msg || 'Incorrect password. Please try again.');
      } else {
        setDeleteError(msg || 'Failed to delete account. Please try again.');
      }
      setIsDeleting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none bg-white dark:bg-gray-800 dark:text-white";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Security Settings</h1>

      <div className="space-y-6">
        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          {passwordError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 mb-4">{passwordError}</div>
          )}
          {passwordSuccess && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300 mb-4">
              Password changed successfully.
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <input id="currentPassword" type="password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input id="newPassword" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password" />
              <PasswordStrengthMeter password={newPassword} />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input id="confirmNewPassword" type="password" value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password" />
            </div>
            <button type="submit" disabled={passwordLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
              {passwordLoading && (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Status: <span className={twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account with 2FA.
              </p>
            </div>
          </div>

          {twoFactorEnabled ? (
            <div>
              {showDisable2FA ? (
                <div className="space-y-3">
                  {twoFactorError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">{twoFactorError}</div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enter a code from your authenticator app to disable 2FA.</p>
                  <input
                    type="text"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    className="w-48 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none text-center tracking-wider bg-white dark:bg-gray-800 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleDisable2FA} disabled={disabling2FA}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors">
                      {disabling2FA ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                    <button onClick={() => { setShowDisable2FA(false); setTwoFactorError(null); }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDisable2FA(true)}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800 transition-colors">
                  Disable 2FA
                </button>
              )}
            </div>
          ) : (
            <button onClick={() => navigate('/2fa-setup')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              Enable 2FA
            </button>
          )}
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Sessions</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                These devices are currently signed in to your account.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadDevices(true)}
                disabled={devicesLoading || refreshingDevices}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Refresh"
                title="Refresh"
              >
                <svg className={`w-3.5 h-3.5 ${refreshingDevices ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              {devices.filter((d) => !d.current).length > 0 && (
                <button
                  onClick={() => setShowRevokeAllConfirm(true)}
                  disabled={revokingAllOthers}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out other devices
                </button>
              )}
            </div>
          </div>

          {/* Error banner */}
          {devicesError && (
            <div className="mb-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-700 dark:text-red-300 flex items-start justify-between gap-2">
              <span>{devicesError}</span>
              <button onClick={() => setDevicesError(null)} className="shrink-0 text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Confirm revoke-all inline banner */}
          {showRevokeAllConfirm && (
            <div className="mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start justify-between gap-3">
              <div className="text-sm text-amber-800 dark:text-amber-200">
                Sign out of <span className="font-semibold">{devices.filter((d) => !d.current).length}</span> other device(s)? You'll stay signed in on this one.
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowRevokeAllConfirm(false)}
                  disabled={revokingAllOthers}
                  className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeAllOthers}
                  disabled={revokingAllOthers}
                  className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded inline-flex items-center gap-1"
                >
                  {revokingAllOthers && (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Confirm
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {devicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <svg className="mx-auto w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No active sessions found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  onRevoke={() => handleRevokeSession(device.id)}
                  confirming={confirmRevokeId === device.id}
                  onConfirmingChange={(v) => setConfirmRevokeId(v ? device.id : null)}
                  revoking={revokingId === device.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone — delete account */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-red-200 dark:border-red-900/60 p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Deleting your account will permanently remove all your interviews, scores,
                uploaded resumes, and profile data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Delete my account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={closeDeleteModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 id="delete-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                    Delete account permanently?
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    This will erase your profile, resumes, interview history and scores.
                    We cannot recover your data after this.
                  </p>
                </div>
                {!isDeleting && (
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="shrink-0 -mt-1 -mr-1 h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Account email (read-only) */}
              {user?.email && (
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{user.email}</span>
                </div>
              )}

              {/* Error */}
              {deleteError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="delete-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Enter your password to confirm
                </label>
                <div className="relative">
                  <input
                    id="delete-password"
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); if (deleteError) setDeleteError(null); }}
                    placeholder="Your current password"
                    autoComplete="current-password"
                    disabled={isDeleting}
                    className="w-full px-4 py-2.5 pr-11 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/50 outline-none bg-white dark:bg-gray-900 dark:text-white disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword((s) => !s)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showDeletePassword ? 'Hide password' : 'Show password'}
                  >
                    {showDeletePassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Type DELETE confirmation */}
              <div>
                <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Type <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => { setDeleteConfirmText(e.target.value); if (deleteError) setDeleteError(null); }}
                  placeholder="DELETE"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isDeleting}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/50 outline-none bg-white dark:bg-gray-900 dark:text-white font-mono tracking-wide disabled:opacity-60"
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword || deleteConfirmText !== 'DELETE'}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : 'Permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// DeviceRow — one row in the Active Sessions list
// ---------------------------------------------------------------------------
interface DeviceRowProps {
  device: Device;
  onRevoke: () => void;
  confirming: boolean;
  onConfirmingChange: (v: boolean) => void;
  revoking: boolean;
}

const DeviceRow: React.FC<DeviceRowProps> = ({
  device,
  onRevoke,
  confirming,
  onConfirmingChange,
  revoking,
}) => {
  // Device icon
  const Icon = () => {
    if (device.deviceType === 'mobile') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      );
    }
    if (device.deviceType === 'tablet') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    );
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
        device.current
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 ring-1 ring-emerald-200 dark:ring-emerald-900/30'
          : 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Icon tile */}
      <div
        className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
          device.current
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
        }`}
      >
        <Icon />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {device.browser} <span className="text-gray-500 dark:text-gray-400 font-normal">on</span> {device.os}
          </p>
          {device.current && (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold uppercase tracking-wider rounded-full">
              This device
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-x-3 gap-y-0.5 flex-wrap text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21l-.97-.97m0 0a5.985 5.985 0 00-4.243-1.757m4.243 1.757a5.985 5.985 0 004.243-1.757M3.124 7.5A8.969 8.969 0 015.292 3m13.416 0A8.969 8.969 0 0120.876 7.5" />
            </svg>
            {device.ip}
          </span>
          <span className="inline-flex items-center gap-1" title={device.loginAt ? new Date(device.loginAt).toLocaleString() : undefined}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Signed in {relativeTime(device.loginAt)}
          </span>
          {device.expiresAt && (
            <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
              Expires {relativeTime(device.expiresAt)}
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {device.current ? (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Current</span>
        ) : confirming ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onConfirmingChange(false)}
              disabled={revoking}
              className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onRevoke}
              disabled={revoking}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded"
            >
              {revoking && (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {revoking ? 'Revoking' : 'Confirm'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => onConfirmingChange(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/60 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Revoke
          </button>
        )}
      </div>
    </div>
  );
};
