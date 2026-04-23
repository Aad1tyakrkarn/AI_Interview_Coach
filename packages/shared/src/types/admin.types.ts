import { IUser } from './user.types';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface IAdminUser extends IUser {
  permissions: string[];
}

export interface ISystemAnalytics {
  totalUsers: number;
  activeInterviews: number;
  completionRate: number;
  avgScore: number;
  peakUsageTime: string;
}

export interface ISupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserFeedback {
  id: string;
  userId: string;
  interviewId: string;
  rating: number;
  comment: string;
  reviewed: boolean;
  reviewedBy?: string;
  createdAt: Date;
}

export interface IRBACPermission {
  role: string;
  resource: string;
  actions: string[];
}
