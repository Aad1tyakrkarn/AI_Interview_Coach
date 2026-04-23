import React from 'react';

interface ResumeUploaderProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  acceptedFormats?: string[];
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  onUpload,
  isUploading = false,
  acceptedFormats = ['.pdf', '.doc', '.docx'],
}) => {
  return (
    <div className="p-6 border-2 border-dashed rounded-lg text-center">
      <p className="text-gray-500">Drag and drop your resume here or click to browse</p>
      <p className="text-xs text-gray-400 mt-1">Accepted: {acceptedFormats.join(', ')}</p>
      <input
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        className="hidden"
        id="resume-upload"
        disabled={isUploading}
      />
      <label htmlFor="resume-upload" className="mt-3 inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">
        {isUploading ? 'Uploading...' : 'Browse Files'}
      </label>
    </div>
  );
};
