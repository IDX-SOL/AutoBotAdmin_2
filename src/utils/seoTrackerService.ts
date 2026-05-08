import { SeoNotification, SeoTask, SeoWeeklyReport } from '@/types/seoTracker';

const TASKS_KEY = 'seo_tracker_tasks_v1';
const NOTIFICATIONS_KEY = 'seo_tracker_notifications_v1';
const LAST_ALERT_KEY = 'seo_tracker_last_telegram_alert_v1';

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const seedTasks: SeoTask[] = [
  { id: 'manual-copy-top5', title: 'Finalize unique copy for top 5 learn-more pages', track: 'A', phase: 'Content Finalization', owner: 'SEO Lead', dueDate: daysFromNow(2), status: 'todo', priority: 'high' },
  { id: 'manual-copy-rest', title: 'Finalize unique copy for remaining learn-more pages', track: 'A', phase: 'Content Finalization', owner: 'Content Team', dueDate: daysFromNow(5), status: 'todo', priority: 'high' },
  { id: 'metadata-schema-pass', title: 'Run metadata and JSON-LD consistency pass', track: 'A', phase: 'Metadata and Schema', owner: 'SEO Engineer', dueDate: daysFromNow(6), status: 'todo', priority: 'high' },
  { id: 'sitemap-robots-pass', title: 'Verify sitemap and robots readiness', track: 'A', phase: 'Sitemap and Crawl Readiness', owner: 'SEO Engineer', dueDate: daysFromNow(7), status: 'todo', priority: 'high' },
  { id: 'prod-launch-checks', title: 'Run build+sitemap checks and production verification', track: 'A', phase: 'Production Launch', owner: 'Release Owner', dueDate: daysFromNow(9), status: 'todo', priority: 'critical' },
  { id: 'postlaunch-monitoring', title: 'Submit sitemap and monitor Search Console indexing', track: 'A', phase: 'Post-launch Monitoring', owner: 'SEO Lead', dueDate: daysFromNow(12), status: 'todo', priority: 'medium' },
  { id: 'admin-seo-tracker-design', title: 'Implement SEO Tracker module in admin', track: 'B', phase: 'SEO Tracker', owner: 'Frontend Admin', dueDate: daysFromNow(14), status: 'todo', priority: 'medium' },
  { id: 'admin-header-notifications', title: 'Add admin header notification icon and drawer', track: 'B', phase: 'Notifications', owner: 'Frontend Admin', dueDate: daysFromNow(16), status: 'todo', priority: 'medium' },
  { id: 'telegram-alert-automation', title: 'Add Telegram reminders for due/overdue SEO steps', track: 'B', phase: 'Notifications', owner: 'Automation Engineer', dueDate: daysFromNow(18), status: 'todo', priority: 'medium' },
  { id: 'admin-reporting-and-next-step-engine', title: 'Build next-step engine and weekly report panel', track: 'B', phase: 'Reporting', owner: 'Product Ops', dueDate: daysFromNow(20), status: 'todo', priority: 'medium' },
];

function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

function readTasks(): SeoTask[] {
  if (!canUseStorage()) return [...seedTasks];
  const raw = window.localStorage.getItem(TASKS_KEY);
  if (!raw) return [...seedTasks];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...seedTasks];
    return parsed;
  } catch {
    return [...seedTasks];
  }
}

function writeTasks(tasks: SeoTask[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function readNotifications(): SeoNotification[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(NOTIFICATIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications: SeoNotification[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

function daysUntil(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  return Math.floor((due - now) / (1000 * 60 * 60 * 24));
}

function buildNotificationForTask(task: SeoTask): SeoNotification | null {
  if (task.status === 'done') return null;
  const remaining = daysUntil(task.dueDate);
  if (remaining > 1) return null;
  if (remaining < 0) {
    return {
      id: `overdue-${task.id}-${new Date().toISOString().slice(0, 10)}`,
      taskId: task.id,
      title: 'SEO Task Overdue',
      message: `${task.title} is overdue. Please update status or complete the step.`,
      severity: 'critical',
      createdAt: new Date().toISOString(),
      read: false,
    };
  }
  return {
    id: `due-${task.id}-${new Date().toISOString().slice(0, 10)}`,
    taskId: task.id,
    title: remaining === 0 ? 'SEO Task Due Today' : 'SEO Task Due Soon',
    message: `${task.title} is ${remaining === 0 ? 'due today' : 'due in 24 hours'}.`,
    severity: remaining === 0 ? 'warning' : 'info',
    createdAt: new Date().toISOString(),
    read: false,
  };
}

export const seoTrackerService = {
  ensureSeeded(): SeoTask[] {
    const tasks = readTasks();
    if (!canUseStorage()) return tasks;
    const missing = seedTasks.filter((seed) => !tasks.some((task) => task.id === seed.id));
    if (!missing.length) return tasks;
    const merged = [...tasks, ...missing];
    writeTasks(merged);
    return merged;
  },

  getTasks(): SeoTask[] {
    return this.ensureSeeded();
  },

  updateTask(taskId: string, patch: Partial<SeoTask>): SeoTask[] {
    const tasks = this.ensureSeeded().map((task) =>
      task.id === taskId
        ? {
            ...task,
            ...patch,
            completedAt: patch.status ? (patch.status === 'done' ? new Date().toISOString() : undefined) : task.completedAt,
          }
        : task,
    );
    writeTasks(tasks);
    return tasks;
  },

  computeNextSteps(limit = 5): SeoTask[] {
    return this.ensureSeeded()
      .filter((task) => task.status !== 'done')
      .sort((a, b) => {
        const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        const priorityRank: Record<SeoTask['priority'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityRank[a.priority] - priorityRank[b.priority];
      })
      .slice(0, limit);
  },

  refreshNotifications(): SeoNotification[] {
    const tasks = this.ensureSeeded();
    const current = readNotifications();
    const newItems = tasks
      .map(buildNotificationForTask)
      .filter((item): item is SeoNotification => Boolean(item))
      .filter((item) => !current.some((existing) => existing.id === item.id));

    const merged = [...newItems, ...current].slice(0, 100);
    writeNotifications(merged);
    return merged;
  },

  getNotifications(): SeoNotification[] {
    return this.refreshNotifications();
  },

  markNotificationRead(notificationId: string): SeoNotification[] {
    const next = this.getNotifications().map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    );
    writeNotifications(next);
    return next;
  },

  getUnreadNotificationCount(): number {
    return this.getNotifications().filter((notification) => !notification.read).length;
  },

  buildWeeklyReport(): SeoWeeklyReport {
    const tasks = this.ensureSeeded();
    const completed = tasks.filter((task) => task.status === 'done').length;
    const pending = tasks.filter((task) => task.status === 'todo' || task.status === 'in_progress').length;
    const blocked = tasks.filter((task) => task.status === 'blocked').length;
    const overdue = tasks.filter((task) => task.status !== 'done' && daysUntil(task.dueDate) < 0).length;
    const launchReadinessScore = Math.max(
      0,
      Math.min(100, Math.round((completed / Math.max(tasks.length, 1)) * 100 - overdue * 5 - blocked * 3)),
    );
    const nextSteps = this.computeNextSteps(5).map(
      (task) => `${task.title} (${daysUntil(task.dueDate) < 0 ? 'overdue' : 'due soon'})`,
    );

    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    return {
      weekStart: weekStart.toISOString(),
      completed,
      pending,
      blocked,
      overdue,
      launchReadinessScore,
      nextSteps,
    };
  },

  async sendTelegramDigest(channelName = 'SEO Ops'): Promise<{ ok: boolean; reason?: string }> {
    if (!canUseStorage()) return { ok: false, reason: 'Client-only function' };
    const token = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
    if (!token || !chatId) return { ok: false, reason: 'Missing Telegram env vars' };

    const key = `${LAST_ALERT_KEY}-${new Date().toISOString().slice(0, 10)}`;
    if (window.sessionStorage.getItem(key)) return { ok: false, reason: 'Already sent today' };

    const report = this.buildWeeklyReport();
    const nextSteps = this.computeNextSteps(3)
      .map((task, idx) => `${idx + 1}. ${task.title} (${task.status})`)
      .join('\n');
    const message =
      `SEO Tracker Digest - ${channelName}\n` +
      `Readiness: ${report.launchReadinessScore}%\n` +
      `Completed: ${report.completed}\n` +
      `Pending: ${report.pending}\n` +
      `Blocked: ${report.blocked}\n` +
      `Overdue: ${report.overdue}\n\n` +
      `Next steps:\n${nextSteps}`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });
      if (!response.ok) return { ok: false, reason: `Telegram API error (${response.status})` };
      window.sessionStorage.setItem(key, '1');
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
};

export default seoTrackerService;
