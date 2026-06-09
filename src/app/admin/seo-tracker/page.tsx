'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, AlertTriangle, Loader2, Send } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import seoTrackerService from '@/utils/seoTrackerService';
import { SeoTask, SeoTaskStatus } from '@/types/seoTracker';

const statusColors: Record<SeoTaskStatus, string> = {
  todo: 'bg-gray-700 text-gray-200',
  in_progress: 'bg-blue-600/20 text-blue-300',
  blocked: 'bg-red-600/20 text-red-300',
  done: 'bg-emerald-600/20 text-emerald-300',
};

function dueLabel(dueDate: string): string {
  const diff = Math.floor((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff}d`;
}

export default function SeoTrackerPage() {
  const [tasks, setTasks] = useState<SeoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [telegramResult, setTelegramResult] = useState<string>('');

  useEffect(() => {
    const next = seoTrackerService.getTasks();
    setTasks(next);
    setLoading(false);
  }, []);

  const grouped = useMemo(() => {
    const byTrack = { A: [] as SeoTask[], B: [] as SeoTask[] };
    for (const task of tasks) byTrack[task.track].push(task);
    return byTrack;
  }, [tasks]);

  const report = seoTrackerService.buildWeeklyReport();
  const nextSteps = seoTrackerService.computeNextSteps(6);

  const updateStatus = (taskId: string, status: SeoTaskStatus) => {
    const updated = seoTrackerService.updateTask(taskId, { status });
    setTasks(updated);
  };

  const sendTelegramDigest = async () => {
    setSending(true);
    setTelegramResult('');
    const result = await seoTrackerService.sendTelegramDigest('AutoBotAdmin SEO');
    setTelegramResult(result.ok ? 'Telegram digest sent.' : `Telegram not sent: ${result.reason || 'unknown reason'}`);
    setSending(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">SEO Tracker</h1>
              <p className="mt-1 text-sm text-gray-300">
                Track manual SEO delivery, check readiness, and follow next recommended actions.
              </p>
            </div>
            <button
              onClick={sendTelegramDigest}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/20 disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Telegram Digest
            </button>
          </div>
          {telegramResult ? <p className="mt-3 text-xs text-gray-300">{telegramResult}</p> : null}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
            <p className="text-xs text-gray-400">Launch Readiness</p>
            <p className="mt-1 text-2xl font-bold text-white">{report.launchReadinessScore}%</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
            <p className="text-xs text-gray-400">Completed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{report.completed}</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="mt-1 text-2xl font-bold text-blue-300">{report.pending}</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4">
            <p className="text-xs text-gray-400">Blocked / Overdue</p>
            <p className="mt-1 text-2xl font-bold text-red-300">
              {report.blocked} / {report.overdue}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-5">
          <h2 className="text-lg font-semibold text-white">Next steps</h2>
          <div className="mt-4 space-y-3">
            {nextSteps.map((task) => (
              <div key={task.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{task.title}</p>
                    <p className="text-xs text-gray-400">
                      Track {task.track} • {task.phase} • {dueLabel(task.dueDate)}
                    </p>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs ${statusColors[task.status]}`}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {(['A', 'B'] as const).map((track) => (
            <div key={track} className="rounded-xl border border-gray-700 bg-gray-800 p-5">
              <h2 className="text-lg font-semibold text-white">
                Track {track} Tasks ({grouped[track].length})
              </h2>
              <div className="mt-4 space-y-3">
                {grouped[track].map((task) => (
                  <div key={task.id} className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {task.phase} • Owner: {task.owner} • {dueLabel(task.dueDate)}
                        </p>
                      </div>
                      <span className={`rounded px-2 py-1 text-xs ${statusColors[task.status]}`}>{task.status}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center gap-1 rounded border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:bg-gray-700"
                        onClick={() => updateStatus(task.id, 'todo')}
                      >
                        <Clock3 className="h-3.5 w-3.5" /> Todo
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded border border-blue-500/40 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/10"
                        onClick={() => updateStatus(task.id, 'in_progress')}
                      >
                        <Loader2 className="h-3.5 w-3.5" /> In progress
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                        onClick={() => updateStatus(task.id, 'blocked')}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> Blocked
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded border border-emerald-500/40 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
                        onClick={() => updateStatus(task.id, 'done')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
