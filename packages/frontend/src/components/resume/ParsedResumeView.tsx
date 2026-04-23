import React from 'react';

interface ParsedResumeViewProps {
  data: {
    contact?: {
      name?: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      location?: string;
    };
    skills?: string[];
    experience?: {
      title: string;
      company: string;
      start_date?: string;
      description?: string;
      highlights?: string[];
    }[];
    education?: {
      degree: string;
      field_of_study?: string;
      institution: string;
      end_year?: number;
      gpa?: number;
      percentage?: number;
    }[];
    summary?: string;
  } | null;
}

export const ParsedResumeView: React.FC<ParsedResumeViewProps> = ({ data }) => {
  if (!data) {
    return <p className="text-gray-500 dark:text-gray-400">No parsed resume data available</p>;
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4 bg-white dark:bg-gray-800">
      {/* Contact */}
      {data.contact && (
        <div>
          {data.contact.name && <p className="font-semibold text-gray-900 dark:text-white">{data.contact.name}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            {data.contact.email && <span>{data.contact.email}</span>}
            {data.contact.phone && <span>{data.contact.phone}</span>}
            {data.contact.location && <span>{data.contact.location}</span>}
          </div>
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <p className="text-sm text-gray-600 dark:text-gray-300">{data.summary}</p>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Skills</h4>
          <div className="flex flex-wrap gap-1">
            {data.skills.map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-800">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Experience</h4>
          <div className="space-y-2">
            {data.experience.map((exp, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">{exp.title}</p>
                <p className="text-gray-500 dark:text-gray-400">{exp.company}{exp.start_date ? ` | ${exp.start_date}` : ''}</p>
                {exp.description && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{exp.description}</p>
                )}
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-gray-600 dark:text-gray-300 text-xs">
                    {exp.highlights.slice(0, 3).map((h, j) => (
                      <li key={j} className="flex items-start gap-1">
                        <span className="text-blue-500 mt-1 flex-shrink-0">-</span> {h}
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
      {data.education && data.education.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Education</h4>
          {data.education.map((edu, i) => (
            <div key={i} className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">
                {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                {edu.institution}
                {edu.end_year ? ` | ${edu.end_year}` : ''}
                {edu.gpa ? ` | CGPA: ${edu.gpa}` : ''}
                {edu.percentage ? ` | ${edu.percentage}%` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
