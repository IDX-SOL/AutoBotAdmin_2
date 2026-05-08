export type SeoTaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type SeoTaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SeoTask {
  id: string;
  title: string;
  track: 'A' | 'B';
  phase: string;
  owner: string;
  dueDate: string;
  status: SeoTaskStatus;
  priority: SeoTaskPriority;
  notes?: string;
  links?: string[];
  completedAt?: string;
}

export interface SeoNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
  read: boolean;
}

export interface SeoWeeklyReport {
  weekStart: string;
  completed: number;
  pending: number;
  blocked: number;
  overdue: number;
  launchReadinessScore: number;
  nextSteps: string[];
}
