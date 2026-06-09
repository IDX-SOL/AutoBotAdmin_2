'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import emailService from '@/utils/emailService';
import type { EmailTemplate } from '@/utils/adminApiService';
import { useToast } from '@/components/Toast/ToastContext';
import { FileEdit, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function EmailTemplatesListPage() {
  const { showSuccess, showError } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await emailService.getTemplates();
      setTemplates(list);
    } catch (e) {
      console.error(e);
      showError('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const result = await emailService.deleteTemplate(id);
      if (result.success) {
        showSuccess(result.message);
        void load();
      } else {
        showError(result.message);
      }
    } catch (e) {
      console.error(e);
      showError('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Email templates</h1>
            <p className="mt-2 text-gray-400">
              Create and edit HTML templates used for outbound and automated email.
            </p>
          </div>
          <Link
            href="/admin/email-templates/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
          >
            <Plus className="h-4 w-4" />
            New template
          </Link>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-10 text-center text-gray-400">
              <FileEdit className="mx-auto mb-3 h-10 w-10 text-zinc-500" />
              <p>No templates yet.</p>
              <Link
                href="/admin/email-templates/new"
                className="mt-4 inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200"
              >
                Create your first template →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Subject</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Updated</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {templates.map((t) => (
                    <tr key={t.id} className="text-zinc-200">
                      <td className="py-3 pr-4 font-medium text-white">{t.name}</td>
                      <td className="max-w-[240px] truncate py-3 pr-4 text-zinc-400">{t.subject}</td>
                      <td className="py-3 pr-4 capitalize text-zinc-400">{t.category}</td>
                      <td className="py-3 pr-4 text-zinc-500">
                        {t.updatedAt
                          ? new Date(t.updatedAt).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/email-templates/${t.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:bg-white/10"
                          >
                            Edit
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            disabled={deletingId === t.id}
                            onClick={() => void handleDelete(t.id, t.name)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === t.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
