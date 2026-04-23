import React, { useState, useEffect, useRef, useCallback } from 'react';
import { resumeApi } from '../../api/resume.api';

interface Resume {
  id: string;
  fileName: string;
  status: 'pending' | 'parsing' | 'parsed' | 'failed';
  uploadedAt: string;
  parsedData?: ParsedData;
}

interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
}

interface ExperienceEntry {
  title: string;
  company: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  highlights?: string[];
  kind?: 'experience' | 'project';
}

interface EducationEntry {
  degree: string;
  field_of_study?: string;
  institution: string;
  start_year?: number;
  end_year?: number;
  gpa?: number;
  percentage?: number;
}

interface ParsedData {
  contact?: ContactInfo;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  summary: string;
}

export const ResumePage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [loadingParsed, setLoadingParsed] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const loadResumes = useCallback(async () => {
    try {
      const { data } = await resumeApi.list();
      const raw = Array.isArray(data) ? data : data.resumes || data.data || [];
      setResumes(
        raw.map((r: Record<string, any>) => ({
          id: r.id,
          fileName: r.fileName || r.file_name || r.filename || 'Untitled',
          status: (r.status || 'pending').toLowerCase() as Resume['status'],
          uploadedAt: r.uploadedAt || r.uploaded_at || r.createdAt || r.created_at || '',
          parsedData: r.parsedData || r.parsed_data || undefined,
        })),
      );
    } catch {
      setError('Failed to load resumes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  useEffect(() => {
    const hasPending = resumes.some((r) => r.status === 'pending' || r.status === 'parsing');
    if (!hasPending) return;
    const interval = setInterval(() => {
      loadResumes();
    }, 5000);
    return () => clearInterval(interval);
  }, [resumes, loadResumes]);

  const handleUpload = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF and DOCX files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      await resumeApi.upload(file);
      await loadResumes();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string) => {
    try {
      await resumeApi.delete(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      if (selectedResume?.id === id) {
        setSelectedResume(null);
        setParsedData(null);
      }
    } catch {
      setError('Failed to delete resume.');
    }
  };

  const handleViewParsed = async (resume: Resume) => {
    setSelectedResume(resume);
    setParsedData(null);
    setLoadingParsed(true);
    try {
      const { data } = await resumeApi.getParsed(resume.id);
      const parsed = data?.parsedData || data?.parsed_data || data;
      const normalized: ParsedData = {
        contact: parsed?.contact || undefined,
        skills: parsed?.skills || [],
        experience: (parsed?.experience || []).map((exp: any) => {
          // Classification rules (in strict priority):
          //  1. Backend tagged `kind` → trust it (new parser)
          //  2. Legacy: title === 'Project' came from the old project parser
          //  3. Otherwise default to 'experience' — never infer project from
          //     missing dates alone (experience dates often fail to extract).
          let inferredKind: 'experience' | 'project';
          if (exp.kind === 'project' || exp.kind === 'experience') {
            inferredKind = exp.kind;
          } else if (exp.title === 'Project') {
            inferredKind = 'project';
          } else {
            inferredKind = 'experience';
          }
          return {
            title: exp.title || '',
            company: exp.company || '',
            start_date: exp.start_date || undefined,
            end_date: exp.end_date || undefined,
            description: exp.description || undefined,
            highlights: exp.highlights || [],
            kind: inferredKind,
          };
        }),
        education: (parsed?.education || []).map((edu: any) => ({
          degree: edu.degree || '',
          field_of_study: edu.field_of_study || undefined,
          institution: edu.institution || '',
          start_year: edu.start_year || undefined,
          end_year: edu.end_year || undefined,
          gpa: edu.gpa || undefined,
          percentage: edu.percentage || undefined,
        })),
        summary: parsed?.summary || parsed?.raw_text?.slice(0, 300) || '',
      };
      setParsedData(normalized);
    } catch {
      setError('Failed to load parsed data.');
    } finally {
      setLoadingParsed(false);
    }
  };

  const handleReparse = async () => {
    if (!selectedResume) return;
    setReparsing(true);
    setError(null);
    try {
      await resumeApi.reparse(selectedResume.id);
      // Poll until parsed (up to ~15 seconds)
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const { data } = await resumeApi.getParsed(selectedResume.id);
          if (data) {
            await handleViewParsed(selectedResume);
            await loadResumes();
            return;
          }
        } catch {
          // still PARSING — keep polling
        }
      }
      setError('Re-parse is taking longer than expected. Please reopen the resume in a few seconds.');
    } catch {
      setError('Re-parse failed.');
    } finally {
      setReparsing(false);
    }
  };

  const statusBadge = (status: Resume['status']) => {
    const map: Record<string, string> = {
      pending: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      parsing: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      parsed: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      failed: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${map[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Resume Management</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 mb-4 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-6
          ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500'}`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
        {isUploading ? (
          <div className="space-y-2">
            <svg className="animate-spin h-10 w-10 text-blue-600 dark:text-blue-400 mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Uploading resume...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-700 dark:text-gray-200 font-medium">Drop your resume here or click to browse</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">PDF or DOCX, max 10MB</p>
          </div>
        )}
      </div>

      {/* Resume List */}
      {resumes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No resumes uploaded yet. Upload your first resume to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => (
            <div key={resume.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{resume.fileName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                {statusBadge(resume.status)}
              </div>
              <div className="flex items-center gap-2">
                {resume.status === 'parsed' && (
                  <button
                    onClick={() => handleViewParsed(resume)}
                    className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    View Data
                  </button>
                )}
                <button
                  onClick={() => handleDelete(resume.id)}
                  className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Parsed Data Modal — Full Width, Organized */}
      {selectedResume && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedResume.fileName}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Parsed Resume Data</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReparse}
                  disabled={reparsing || loadingParsed}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Re-parse the uploaded file with the latest parser"
                >
                  <svg className={`w-3.5 h-3.5 ${reparsing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {reparsing ? 'Re-parsing...' : 'Re-parse'}
                </button>
                <button onClick={() => { setSelectedResume(null); setParsedData(null); }}
                  className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {loadingParsed ? (
              <div className="flex items-center justify-center py-20">
                <svg className="animate-spin h-10 w-10 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : parsedData ? (
              <div className="p-6 space-y-8">
                {/* Contact + Summary — Side by Side */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Contact Card */}
                  {parsedData.contact && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800/30">
                      <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Contact Info
                      </h3>
                      <div className="space-y-2.5">
                        {parsedData.contact.name && (
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{parsedData.contact.name}</p>
                        )}
                        {parsedData.contact.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300">{parsedData.contact.email}</span>
                          </div>
                        )}
                        {parsedData.contact.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300">{parsedData.contact.phone}</span>
                          </div>
                        )}
                        {parsedData.contact.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300">{parsedData.contact.location}</span>
                          </div>
                        )}
                        {parsedData.contact.linkedin && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <span className="text-blue-600 dark:text-blue-400">{parsedData.contact.linkedin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary Card */}
                  {parsedData.summary && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Professional Summary
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{parsedData.summary}</p>
                    </div>
                  )}
                </div>

                {/* Skills — Full Width */}
                {parsedData.skills?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Technical Skills
                      <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">({parsedData.skills.length} detected)</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience (kind === 'experience') */}
                {parsedData.experience?.some((e) => e.kind !== 'project') && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Work Experience
                      <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                        ({parsedData.experience.filter((e) => e.kind !== 'project').length})
                      </span>
                    </h3>
                    <div className="space-y-4">
                      {parsedData.experience
                        .filter((e) => e.kind !== 'project')
                        .map((exp, i) => (
                          <div key={`exp-${i}`} className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-l-blue-500 border-t border-r border-b border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-base">{exp.title || exp.company}</h4>
                                {exp.company && exp.title && exp.title !== exp.company && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{exp.company}</p>
                                )}
                              </div>
                              {exp.start_date && (
                                <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full flex-shrink-0 font-medium">
                                  {exp.start_date}{exp.end_date ? ` - ${exp.end_date}` : ''}
                                </span>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{exp.description}</p>
                            )}
                            {exp.highlights && exp.highlights.length > 0 && (
                              <ul className="space-y-2 mt-2">
                                {exp.highlights.map((h, j) => (
                                  <li key={j} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                    <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="leading-relaxed">{h}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Projects (kind === 'project') */}
                {parsedData.experience?.some((e) => e.kind === 'project') && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      Projects
                      <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                        ({parsedData.experience.filter((e) => e.kind === 'project').length})
                      </span>
                    </h3>
                    <div className="space-y-4">
                      {parsedData.experience
                        .filter((e) => e.kind === 'project')
                        .map((proj, i) => (
                          <div key={`proj-${i}`} className="bg-emerald-50/40 dark:bg-emerald-900/10 rounded-xl border-l-4 border-l-emerald-500 border-t border-r border-b border-emerald-100 dark:border-emerald-800/30 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-gray-900 dark:text-white text-base">{proj.company || proj.title}</h4>
                              {proj.start_date && (
                                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full flex-shrink-0 font-medium">
                                  {proj.start_date}{proj.end_date ? ` - ${proj.end_date}` : ''}
                                </span>
                              )}
                            </div>
                            {proj.description && (
                              <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg mb-3 inline-block font-medium">
                                {proj.description}
                              </p>
                            )}
                            {proj.highlights && proj.highlights.length > 0 && (
                              <ul className="space-y-2 mt-2">
                                {proj.highlights.map((h, j) => (
                                  <li key={j} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="leading-relaxed">{h}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {parsedData.education?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Education
                    </h3>
                    <div className="space-y-3">
                      {parsedData.education.map((edu, i) => (
                        <div key={i} className="flex items-start gap-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30 p-4">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
                            </p>
                            {edu.institution && <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{edu.institution}</p>}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {(edu.start_year || edu.end_year) && (
                                <span className="text-xs bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                                  {edu.start_year ? `${edu.start_year} - ` : ''}{edu.end_year || 'Present'}
                                </span>
                              )}
                              {edu.gpa && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-medium">
                                  CGPA: {edu.gpa}
                                </span>
                              )}
                              {edu.percentage && (
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-medium">
                                  {edu.percentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No parsed data available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
