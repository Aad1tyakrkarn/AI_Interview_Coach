import { apiClient } from './client';

export const resumeApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return apiClient.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: () => apiClient.get('/resumes'),
  getById: (id: string) => apiClient.get(`/resumes/${id}`),
  getParsed: (id: string) => apiClient.get(`/resumes/${id}/parsed`),
  reparse: (id: string) => apiClient.post(`/resumes/${id}/reparse`),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/resumes/${id}`, data),
  delete: (id: string) => apiClient.delete(`/resumes/${id}`),
};
