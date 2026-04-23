import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/user.api';

interface Preferences {
  notifications: boolean;
  reminders: boolean;
  marketingEmails: boolean;
  theme: string;
  language: string;
  timezone: string;
  cameraEnabled: boolean;
  micEnabled: boolean;
}

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland',
];

export const PreferencesPage: React.FC = () => {
  const [prefs, setPrefs] = useState<Preferences>({
    notifications: true,
    reminders: true,
    marketingEmails: false,
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    cameraEnabled: true,
    micEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const { data } = await userApi.getPreferences();
        setPrefs((prev) => ({ ...prev, ...data }));
      } catch {
        setError('Failed to load preferences.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPrefs();
  }, []);

  const handleToggle = (key: keyof Preferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSuccess(false);
  };

  const handleSelect = (key: keyof Preferences, value: string) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await userApi.updatePreferences(prefs);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save preferences.');
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

  const Toggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-800 transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );

  const selectClass = "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none bg-white dark:bg-gray-800 dark:text-white";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Preferences</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300 mb-4">
          Preferences saved successfully.
        </div>
      )}

      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about your interviews</p>
              </div>
              <Toggle enabled={prefs.notifications} onToggle={() => handleToggle('notifications')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Interview Reminders</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get reminded before scheduled interviews</p>
              </div>
              <Toggle enabled={prefs.reminders} onToggle={() => handleToggle('reminders')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Marketing Emails</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive tips and product updates</p>
              </div>
              <Toggle enabled={prefs.marketingEmails} onToggle={() => handleToggle('marketingEmails')} />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance & Locale</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Theme</label>
              <select
                value={prefs.theme}
                onChange={(e) => handleSelect('theme', e.target.value)}
                className={selectClass}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
              <select
                value={prefs.language}
                onChange={(e) => handleSelect('language', e.target.value)}
                className={selectClass}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
              <select
                value={prefs.timezone}
                onChange={(e) => handleSelect('timezone', e.target.value)}
                className={selectClass}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Media Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Camera</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enable camera for interviews</p>
              </div>
              <Toggle enabled={prefs.cameraEnabled} onToggle={() => handleToggle('cameraEnabled')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Microphone</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enable microphone for voice responses</p>
              </div>
              <Toggle enabled={prefs.micEnabled} onToggle={() => handleToggle('micEnabled')} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
