import { DifficultyLevel } from './interview.types';

export interface IQuestion {
  id: string;
  text: string;
  category: string;
  subcategory?: string;
  difficulty: DifficultyLevel;
  jobRoles: string[];
  expectedTopics: string[];
  followUps?: IFollowUpTemplate[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestionCategory {
  id: string;
  name: string;
  description: string;
}

export interface IFollowUpTemplate {
  trigger: string;
  questionTemplate: string;
}
