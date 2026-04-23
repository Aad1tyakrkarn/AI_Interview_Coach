import { apiClient } from './client';
import { API_ENDPOINTS } from '../config/api';

export interface QuestionListParams {
  category?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}

export const questionApi = {
  list: (params?: QuestionListParams) =>
    apiClient.get(API_ENDPOINTS.QUESTION.LIST, { params }),

  get: (id: string) =>
    apiClient.get(API_ENDPOINTS.QUESTION.GET.replace(':id', id)),

  getCategories: () =>
    apiClient.get(API_ENDPOINTS.QUESTION.CATEGORIES),
};
