import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { reportApi } from '../../api/report.api';

interface PdfExportButtonProps {
  interviewId: string;
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  interviewId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await reportApi.getPdf(interviewId);
      const htmlContent = typeof data === 'string' ? data : data.html;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('Pop-up blocked. Please allow pop-ups and try again.');
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load before triggering print
      printWindow.onload = () => {
        printWindow.print();
      };

      // Fallback: trigger print after a short delay
      setTimeout(() => {
        try {
          printWindow.print();
        } catch {
          // Window may have been closed
        }
      }, 500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to export PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        {loading ? 'Generating...' : 'Export PDF'}
      </button>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};
