import React from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  accept = '*',
  maxSize = 10 * 1024 * 1024,
  label = 'Upload File',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= maxSize) {
      onUpload(file);
    }
  };

  return (
    <div className="p-4 border-2 border-dashed rounded-lg text-center">
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer text-blue-500 hover:text-blue-600">
        {label}
      </label>
      <p className="text-xs text-gray-400 mt-1">Max size: {Math.round(maxSize / 1024 / 1024)}MB</p>
    </div>
  );
};
