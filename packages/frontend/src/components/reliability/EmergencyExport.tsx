import React, { useState, useCallback } from 'react';
import { reliabilityApi } from '../../api/reliability.api';

interface EmergencyExportProps {
  interviewId: string;
}

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export const EmergencyExport: React.FC<EmergencyExportProps> = ({ interviewId }) => {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleExport = useCallback(async () => {
    if (!interviewId) return;

    setStatus('exporting');
    setErrorMessage('');

    try {
      const response = await reliabilityApi.emergencyExport(interviewId);
      const exportData = response.data;

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-export-${interviewId}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('success');

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to export interview data. Please try again.';
      setErrorMessage(message);
      setStatus('error');

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  }, [interviewId]);

  const buttonStyles: Record<ExportStatus, string> = {
    idle: 'bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-400',
    exporting: 'bg-orange-400 text-white cursor-not-allowed',
    success: 'bg-green-500 text-white cursor-default',
    error: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
  };

  const buttonContent: Record<ExportStatus, React.ReactNode> = {
    idle: (
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Interview Data
      </span>
    ),
    exporting: (
      <span className="flex items-center gap-2">
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Exporting...
      </span>
    ),
    success: (
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Exported Successfully
      </span>
    ),
    error: (
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Export Failed - Retry
      </span>
    ),
  };

  return (
    <div className="inline-flex flex-col items-start">
      <button
        onClick={handleExport}
        disabled={status === 'exporting' || status === 'success'}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-offset-2
          transition-all duration-200
          ${buttonStyles[status]}
        `}
        aria-label="Export interview data"
      >
        {buttonContent[status]}
      </button>

      {status === 'error' && errorMessage && (
        <p className="mt-1.5 text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};
