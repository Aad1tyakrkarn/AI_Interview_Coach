import React from 'react';

interface Resume {
  id: string;
  name: string;
  uploadedAt: string;
}

interface ResumeSelectorProps {
  resumes: Resume[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ResumeSelector: React.FC<ResumeSelectorProps> = ({ resumes, selectedId, onSelect }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Resume</label>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">Select a resume...</option>
        {resumes.map((resume) => (
          <option key={resume.id} value={resume.id}>{resume.name}</option>
        ))}
      </select>
    </div>
  );
};
