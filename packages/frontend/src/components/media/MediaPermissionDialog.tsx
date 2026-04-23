import React, { useState } from 'react';

interface MediaPermissionDialogProps {
  onGranted: () => void;
  onDenied: () => void;
  requiredPermissions: ('camera' | 'microphone')[];
}

export const MediaPermissionDialog: React.FC<MediaPermissionDialogProps> = ({
  onGranted,
  onDenied,
  requiredPermissions,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAllow = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        audio: requiredPermissions.includes('microphone'),
        video: requiredPermissions.includes('camera'),
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop all tracks immediately -- we only needed to trigger the permission prompt
      stream.getTracks().forEach((track) => track.stop());
      onGranted();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError(
          'Permission was denied. Please enable access in your browser settings and reload the page.',
        );
      } else if (err.name === 'NotFoundError') {
        const missing = requiredPermissions.join(' and ');
        setError(`No ${missing} device found. Please connect a device and try again.`);
      } else {
        setError(`An error occurred: ${err.message}`);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const permissionLabels = requiredPermissions.map((p) =>
    p === 'camera' ? 'Camera' : 'Microphone',
  );
  const permissionText = permissionLabels.join(' and ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
        {/* Icons */}
        <div className="mb-5 flex items-center justify-center gap-4">
          {requiredPermissions.includes('microphone') && (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-600 dark:text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
          )}
          {requiredPermissions.includes('camera') && (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-purple-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-center text-lg font-semibold text-gray-900 dark:text-white">
          {permissionText} Access Required
        </h3>

        {/* Description */}
        <p className="mb-6 text-center text-sm text-gray-500">
          This interview requires access to your {permissionText.toLowerCase()} for recording and
          analysis. Your data is processed securely.
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            <div className="mt-2 rounded bg-red-100 dark:bg-red-900/40/50 p-2">
              <p className="text-xs text-red-600 dark:text-red-400">
                <span className="font-semibold">To re-enable permissions:</span>
              </p>
              <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-red-600 dark:text-red-400">
                <li>Click the lock/info icon in your browser address bar</li>
                <li>Find camera/microphone permissions</li>
                <li>Change the setting to &quot;Allow&quot;</li>
                <li>Reload this page</li>
              </ol>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDenied}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={isRequesting}
          >
            Cancel
          </button>
          <button
            onClick={handleAllow}
            disabled={isRequesting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {isRequesting ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Requesting...
              </>
            ) : (
              'Allow Access'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
